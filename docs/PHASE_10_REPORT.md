# Laporan Implementasi Phase 10 — Google Calendar OAuth, FreeBusy, Event Sync, Webhook & Reliability

**Proyek**: TampilKit AC Service Booking System  
**Bisnis Demo**: CoolCare AC Service  
**Arsitektur**: npm Workspaces Monorepo (Next.js 15, NestJS 11 Fastify, PostgreSQL 16, Prisma 6)  
**Status**: SELESAI (100% Lulus Pengujian E2E & Validasi Kontrak)

---

## 1. Ringkasan Eksekutif

Phase 10 mengimplementasikan integrasi dua arah antara CoolCare AC Service Booking System dan Google Calendar. Sistem memungkinkan bisnis mengaitkan akun Google Workspace / Gmail resmi untuk memproyeksikan seluruh jadwal operasional teknisi AC secara terpusat, menyerap interval waktu sibuk non-servis (FreeBusy) ke dalam Availability Engine publik, menangani mutasi jadwal secara asinkron menggunakan Transactional Outbox pattern, serta mendeteksi dan menyelesaikan konflik data tanpa risiko *overbooking* atau *data drift*.

---

## 2. Fitur & Komponen yang Diimplementasikan

### 2.1 Autentikasi OAuth 2.0 & Keamanan Kriptografi
- **Server-Side Authorization Code Flow**:
  - Alur otorisasi menggunakan parameter `state` dinamis yang memuat `businessId`, `userId`, `timestamp`, `nonce`, dan tanda tangan HMAC-SHA256.
  - State memiliki masa kedaluwarsa 10 menit dan dilindungi dari *replay attack* dengan pencatatan status single-use.
  - Perbandingan tanda tangan menggunakan fungsi waktu konstan `crypto.timingSafeEqual`.
- **Enkripsi Data At-Rest (AES-256-GCM)**:
  - `GoogleTokenService` mengamankan seluruh token akses dan refresh token Google di database PostgreSQL (`encryptedAccessToken`, `encryptedRefreshToken`).
  - Setiap enkripsi menggunakan IV 96-bit yang diacak secara independen dan dilengkapi dengan Auth Tag 128-bit untuk memvalidasi integritas ciphertext.

### 2.2 Model Kalender Bersama Multi-Teknisi (Basic v1)
- **Authoritative Database Invariant**:
  - PostgreSQL tetap menjadi pemegang kebenaran mutlak atas kapasitas armada teknisi, status pemesanan, dan penugasan kerja.
  - Jadwal seluruh teknisi diproyeksikan ke dalam 1 Google Calendar terpusat. Keberadaan satu event servis tidak membatasi teknisi lain untuk menerima pemesanan pada jam yang sama.
- **Pembedaan Event Internal vs Eksternal**:
  - Event pemesanan ditandai secara privat dengan properti `extendedProperties.private.source = 'TampilKit-AC'`.
  - `GoogleFreeBusyService` memfilter event mandiri agar tidak terjadi pemblokiran palsu (*false positive busy*), sementara event luar (`EXTERNAL_BUSY`) diperlakukan sebagai penutupan toko global.
- **Fail-Closed Availability Policy**:
  - Jika token integrasi dicabut atau berstatus `REAUTH_REQUIRED`, sistem availability publik secara otomatis menutup slot baru untuk mencegah jadwal yang tidak tervalidasi masuk ke sistem.

### 2.3 Antrean Asinkron Transactional Outbox & Worker Daemon
- **Durable Outbox Queue**:
  - Mutasi pemesanan lokal (`CONFIRMED`, `ASSIGNED`, `RESCHEDULED`, `CANCELLED`) secara atomik mencatat entri pekerjaan ke tabel `CalendarSyncJob`.
  - Operasi yang didukung: `CREATE_EVENT`, `UPDATE_EVENT`, `DELETE_EVENT`, `SYNC_EXTERNAL_EVENTS`.
- **Worker Daemon (`CalendarJobProcessor`)**:
  - Polling interval 5 detik dengan mekanisme *atomic claim* dan *lease locking* selama 60 detik.
  - Strategi penanganan kegagalan dengan *exponential backoff retry* hingga 5 kali percobaan.
  - Script eksekusi latar belakang mandiri: `npm run calendar:worker -w @tampilkit-ac/backend`.

### 2.4 Google Calendar Push Notifications (Webhook) & Incremental Sync
- **Pendaftaran Watch Channel**:
  - Registrasi saluran notifikasi push Google Calendar dengan ID saluran dan verifikasi hash token HMAC-SHA256 (`verificationTokenHash`).
- **Webhook Endpoint**:
  - `POST /api/v1/webhooks/google-calendar` memverifikasi header saluran Google dalam waktu konstan.
  - Pemrosesan sinkronisasi bertahap dijalankan asinkron dan webhook langsung mengembalikan `HTTP 200 OK` dalam waktu < 500ms.
- **Pemulihan Otomatis HTTP 410 Gone**:
  - Jika `syncToken` kedaluwarsa, sistem otomatis melakukan pemulihan cerdas dengan memicu Full Sync rekonsiliasi.

### 2.5 Manajemen & Resolusi Konflik
- **Deteksi Anomali**:
  - Mendeteksi perbedaan waktu `REMOTE_EVENT_CHANGED`, penghapusan tak terduga `REMOTE_EVENT_DELETED`, dan tumpang tindih waktu `EXTERNAL_BUSY_OVERLAP`.
- **Panel Resolusi Konflik Admin**:
  - Tampilan perbandingan *side-by-side* antara snapshot lokal vs snapshot remote di `/dashboard/integrations/google-calendar/conflicts`.
  - Opsi tindakan yang tersedia: `RESTORE_LOCAL` (menimpa kembali kalender Google dengan data lokal), `ACCEPT_REMOTE` (menerima perubahan eksternal), dan `IGNORE` (mengabaikan anomali).

### 2.6 Frontend Antarmuka Admin Next.js
- Halaman Status Integrasi: `/dashboard/integrations/google-calendar`
- Halaman Antrean Outbox: `/dashboard/integrations/google-calendar/jobs`
- Halaman Resolusi Konflik: `/dashboard/integrations/google-calendar/conflicts`
- Halaman Pengaturan Akun & Kalender: `/dashboard/settings/integrations/google`
- Tautan navigasi aktif pada sidebar admin `dashboard-sidebar.tsx`.

---

## 3. Bukti Verifikasi & Hasil Pengujian

### 3.1 Backend E2E Test Suite (`google-calendar-integration.e2e-spec.ts`)
```
PASS apps/backend/test/google-calendar-integration.e2e-spec.ts (22.38 s)
  Phase 10 — Google Calendar Integration E2E Test Suite
    1. AES-256-GCM Token Encryption Security
      √ should securely encrypt and decrypt refresh tokens at rest with unique IVs (6 ms)
      √ should reject tampered ciphertext during decryption (44 ms)
    2. OAuth 2.0 Connection Management Endpoints
      √ should reject unauthenticated request to connection status (2 ms)
      √ should return connection status for authenticated owner (117 ms)
      √ should generate Google OAuth connect URL with cryptographically secure state (11 ms)
      √ should reject callback with invalid state parameter (2 ms)
    3. Multi-Technician Google FreeBusy Projection & Fail-Closed Policy
      √ should return external busy intervals from ExternalCalendarEvent table (11 ms)
      √ should fail-closed if connection status is REAUTH_REQUIRED (4 ms)
    4. Transactional Outbox Job Queue & Retry API
      √ should list outbox jobs via GET /admin/integrations/google/jobs (10 ms)
      √ should reset failed job for immediate retry via POST /admin/integrations/google/jobs/:id/retry (7 ms)
    5. Conflict Resolution Workflow
      √ should list conflicts via GET /admin/integrations/google/conflicts (7 ms)
      √ should retrieve conflict details by ID (5 ms)
      √ should resolve conflict via POST /admin/integrations/google/conflicts/:id/resolve (6 ms)
    6. Google Calendar Webhook Push Notification Handshake
      √ should respond 200 OK to Google Webhook initial sync handshake (2 ms)
      √ should reject webhook without channel headers with 401 (1 ms)
    7. Disconnect Google Calendar Integration
      √ should disconnect Google Calendar and reset connection status (13 ms)

Test Suites: 1 passed, 1 total
Tests:       16 passed, 16 total
Snapshots:   0 total
Time:        22.602 s
```

### 3.2 Frontend Unit Test Suite (`npm test -w @tampilkit-ac/frontend`)
```
ℹ tests 55
ℹ suites 9
ℹ pass 55
ℹ fail 0
ℹ duration_ms 341.835
```

### 3.3 Typecheck Monorepo (`npm run typecheck`)
- `@tampilkit-ac/api-contract`: PASSED (0 errors)
- `@tampilkit-ac/backend`: PASSED (0 errors)
- `@tampilkit-ac/frontend`: PASSED (0 errors)

### 3.4 Production Build (`npm run build`)
- Next.js 15: Seluruh 37 rute halaman dan API routes berhasil dioptimasi dan dikompilasi tanpa galat.
- NestJS 11 Fastify: Prisma Client dan bundle server berhasil dibangun secara tuntas.
