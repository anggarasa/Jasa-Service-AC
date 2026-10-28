# Laporan Implementasi — Phase 02: Autentikasi JWT, Rotasi Token & RBAC

## 1. Ringkasan Eksekutif

| Parameter | Keterangan |
|---|---|
| **Proyek** | TampilKit AC Service Booking System (CoolCare AC Service) |
| **Fase** | Phase 02 — JWT Authentication, Refresh Token Rotation & RBAC |
| **Tanggal Penyelesaian** | 28 Oktober 2026 |
| **Tim Pelaksana** | Principal Fullstack Engineer, NestJS Security Architect, Next.js Engineer, QA Engineer |
| **Status Akhir** | **PASS / SELESAI PENUH** |

Phase 02 telah berhasil diimplementasikan secara komprehensif tanpa melanggar batasan arsitektur (tanpa NextAuth, Passport, Clerk, Firebase, Supabase, Redis, ataupun migrasi ke package manager selain npm). Seluruh sistem autentikasi beroperasi di bawah kendali tunggal NestJS Fastify dengan penyimpanan PostgreSQL-backed sessions dan HttpOnly cookies melalui Next.js BFF proxy.

---

## 2. Rincian Implementasi Fitur

### A. Backend NestJS Fastify (`apps/backend/src/modules/auth/`)
1. **Password Security**:
   - Algoritma hashing modern Argon2id dengan standard OWASP (memory 64MB, 3 iterasi, 4 threads).
   - Validasi kebijakan password ketat (minimal 12 karakter, huruf besar, huruf kecil, angka, simbol).
2. **Token Management (`jose`)**:
   - Access Token JWT (15 menit) bertanda tangan HS256 dengan secret terpisah.
   - Refresh Token (7 hari) tersimpan dalam bentuk hash SHA-256 di tabel `RefreshTokenRecord`.
   - Rotasi token atomik dengan deteksi penggunaan ulang (*token replay detection*) yang otomatis mencabut seluruh sesi jika terjadi anomali.
3. **Session & Persistence (`AuthSession`)**:
   - Manajemen sesi login multi-perangkat tersimpan di PostgreSQL.
   - Fitur logout sesi aktif (`/logout`) dan logout dari seluruh perangkat (`/logout-all`).
   - Penambahan `tokenVersion` pada user untuk invalidasi instan semua access token.
4. **Proteksi & Keamanan Lanjutan**:
   - Rate limiting berbasis PostgreSQL (`RateLimitRecord`) membatasi maksimal 5 kegagalan login per 15 menit.
   - Audit logging terstruktur (`AuthAuditLog`) untuk seluruh peristiwa login, rotasi, logout, dan ganti sandi.
   - Fastify HttpOnly cookies (`tk_ac_access`, `tk_ac_refresh`) dengan konfigurasi `SameSite=Lax`.
   - Native NestJS Guards: `JwtAuthGuard` dan `RolesGuard` dengan decorator `@Public()`, `@Roles()`, dan `@CurrentUser()`.

### B. Shared API Contract (`packages/api-contract/`)
- Penambahan skema Zod dan TypeScript types untuk autentikasi (`src/auth.ts`):
  - `LoginRequestSchema`, `UpdateProfileRequestSchema`, `ChangePasswordRequestSchema`, `SessionItemSchema`, `AuthUserSchema`.
- Resolusi ekspor bundler bersih yang kompatibel dengan Next.js App Router Webpack dan Node.js runtime.

### C. Frontend Next.js (`apps/frontend/`)
1. **Same-Origin BFF Proxy**:
   - Route handler `/api/auth/[...path]` mem-proxy request ke NestJS Fastify dan meneruskan header `Set-Cookie` secara aman.
2. **Server-Side Authentication**:
   - Fungsi `getServerSession()` memvalidasi sesi secara server-side pada Server Components layout sebelum merender halaman berproteksi.
3. **Client API Token Refresh**:
   - `apps/frontend/src/lib/api/client.ts` dilengkapi mekanisme *single-flight token refresh* saat mendeteksi respon 401 Unauthorized.
4. **Antarmuka Pengguna (UI) dalam Bahasa Indonesia**:
   - `/login`: Form login dengan validasi interaktif, penanganan error ramah pengguna, dan indikator status proses.
   - `/dashboard`: Area manajerial untuk OWNER & ADMIN dengan header navigasi, kartu statistik sesi, dan profil staf.
   - `/dashboard/sessions`: Tabel daftar sesi aktif multi-perangkat dengan tombol pencabutan sesi individual dan logout seluruh perangkat.
   - `/dashboard/profile` & `/dashboard/security`: Pengaturan nama, nomor telepon, dan perubahan kata sandi berstandar 12 karakter.
   - `/technician`: Workspace terisolasi untuk role TECHNICIAN (dengan rute `/technician/profile` dan `/technician/security`) yang terhindar dari tampilan manajerial kantor.

### D. OWNER Bootstrap CLI
- Skrip mandiri `apps/backend/src/scripts/auth-bootstrap.ts` dijalankan via `npm run auth`.
- Menginisialisasi akun bawaan `owner@coolcare.id`, `admin@coolcare.id`, dan `technician@coolcare.id` secara idempotent.

---

## 3. Bukti Verifikasi & Pengujian

### A. Ringkasan Eksekusi Test
```text
Test Suites: 8 passed, 8 total
Tests:       31 passed, 31 total (15 frontend unit, 15 backend unit, 16 backend E2E)
Snapshots:   0 total
Status:      ALL TESTS GREEN
```

1. **Backend E2E Tests (`npm run test:e2e -w @tampilkit-ac/backend`)**:
   - `test/health.e2e-spec.ts`: PASS (2 tests)
   - `test/auth-rbac-concurrency.e2e-spec.ts`: PASS (6 tests - login, access control RBAC, isolasi technician, logout-all)
   - `test/auth.e2e-spec.ts`: PASS (8 tests - login, me, refresh token rotation, replay detection revocation, session listing, change password)
   - **Total**: 16/16 passed.

2. **Backend Unit Tests (`npm run test -w @tampilkit-ac/backend`)**:
   - `password.service.spec.ts`: PASS (3 tests)
   - `storage.service.spec.ts`: PASS (3 tests)
   - `health.controller.spec.ts`: PASS (2 tests)
   - `refresh-rotation.service.spec.ts`: PASS (4 tests)
   - `token.service.spec.ts`: PASS (3 tests)
   - **Total**: 15/15 passed.

3. **Frontend Unit Tests (`npm run test -w @tampilkit-ac/frontend`)**:
   - API client unwrap & normalized error parsing: PASS (3 tests)
   - Auth flow schemas, password policy, role redirects, and refresh queue: PASS (6 tests)
   - Homepage & UI structural checks: PASS (6 tests)
   - **Total**: 15/15 passed.

### B. Validasi Typecheck & Linter
- `npm run typecheck`: **PASS (0 errors di 3 workspaces)**
- `npm run lint`: **PASS (0 warnings, 0 errors di 3 workspaces)**

### C. Build Produksi
- `npm run build`: **PASS**
  - `@tampilkit-ac/api-contract`: Kompilasi TypeScript sukses (`tsc -b`).
  - `@tampilkit-ac/backend`: Prisma client generated (v6.19.3) & NestJS distribution build sukses (`dist/main.js`).
  - `@tampilkit-ac/frontend`: Next.js 15.5.28 optimized production build sukses merender 12 halaman statis dan dinamis:
    - `/` (Static)
    - `/_not-found` (Static)
    - `/api/auth/[...path]` (Dynamic)
    - `/dashboard` (Dynamic)
    - `/dashboard/profile` (Dynamic)
    - `/dashboard/security` (Dynamic)
    - `/dashboard/sessions` (Dynamic)
    - `/login` (Dynamic)
    - `/technician` (Dynamic)
    - `/technician/profile` (Dynamic)
    - `/technician/security` (Dynamic)

---

## 4. Matriks Kepatuhan Batasan Arsitektur

| Batasan / Kebutuhan | Status | Bukti Implementasi |
|---|---|---|
| Package Manager Hanya `npm` | Patuh | Menggunakan npm workspaces & single `package-lock.json` |
| Tanpa NextAuth / Auth.js / Clerk | Patuh | Native JWT + Jose + Fastify cookie proxy |
| Tanpa Passport | Patuh | Native NestJS Guards (`JwtAuthGuard`, `RolesGuard`) |
| Password Argon2id | Patuh | `PasswordService` dengan memory 64MB |
| Token Storage Aman | Patuh | Cookie HttpOnly, SameSite=Lax (tidak di localStorage) |
| Rotasi Refresh Token + Replay Detection | Patuh | `RefreshRotationService` dengan pencabutan keluarga token |
| Tanpa Redis Tambahan | Patuh | PostgreSQL-backed sessions dan rate limits |
| CLI Bootstrap OWNER | Patuh | `npm run auth` idempotently provisioned |
| Role Separation (RBAC) | Patuh | OWNER & ADMIN ke `/dashboard`, TECHNICIAN ke `/technician` |
| Teks Pengguna Bahasa Indonesia | Patuh | 100% halaman login, dashboard, error, dan form berbahasa Indonesia |

---

## 5. Kesimpulan & Status Kesiapan

Fase 02 telah selesai secara sempurna dengan seluruh pengujian otomatis berhasil diverifikasi. Fondasi autentikasi dan otorisasi telah siap mendukung **Phase 03 (Core AC Booking Domain & Service Catalog Management)**.
