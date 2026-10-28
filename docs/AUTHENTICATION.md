# Dokumentasi Sistem Autentikasi (Phase 02)

## 1. Arsitektur & Prinsip Dasar

Sistem autentikasi TampilKit AC Service Booking System dirancang dengan prinsip **Zero Trust on Frontend** dan **Single Authority on NestJS Fastify**:
- **Otoritas Autentikasi**: Backend NestJS bertanggung jawab penuh atas penerbitan, verifikasi, rotasi, pembatasan laju (*rate limiting*), dan pencabutan sesi pengguna.
- **Topologi Same-Origin BFF**: Frontend Next.js mengekspos endpoint proxy internal `/api/auth/[...path]` yang meneruskan permintaan ke NestJS (`/api/v1/auth/[...path]`). Cookie autentikasi berstatus `HttpOnly`, `SameSite=Lax`, dan `Path=/` sehingga terlindung dari akses skrip peramban (XSS) dan dikirim secara transparan.
- **Argon2id Hashing**: Kata sandi di-hash menggunakan algoritma modern Argon2id dengan konfigurasi enterprise (memory 64MB, iterations 3, parallelism 4) sesuai standar OWASP.
- **PostgreSQL Session Storage**: Sesi aktif (`AuthSession`) dan siklus hidup refresh token (`RefreshTokenRecord`) dicatat langsung di PostgreSQL untuk mendukung pencabutan sesi instan dan deteksi penyalahgunaan (*token replay attack*).

---

## 2. Model Akun & Hak Akses (RBAC)

Sistem membedakan tiga role internal staf:
1. **OWNER**: Akses penuh ke seluruh konfigurasi bisnis, manajemen user staf, laporan keuangan, dan seluruh sesi.
2. **ADMIN**: Akses operasional sistem, manajemen booking, penugasan teknisi, dan pengaturan jadwal.
3. **TECHNICIAN**: Akses kerja lapangan terisolasi (`/technician`), jadwal penugasan harian, pembaruan status order, dan profil personal.

> Catatan: Pendaftaran mandiri pelanggan (Customer Registration) ditiadakan sesuai spesifikasi. Akun staf dikelola oleh OWNER atau di-bootstrap via CLI.

---

## 3. Alur Kerja Autentikasi

### A. Login
1. Pengguna mengirimkan email dan password via Next.js `/login`.
2. Next.js BFF meneruskan permintaan ke backend NestJS `/api/v1/auth/login`.
3. Backend memeriksa rate limit IP + email (maksimal 5 percobaan gagal per jendela waktu).
4. Backend memverifikasi keberadaan user dan mencocokkan password dengan Argon2id.
5. Jika valid, backend membuat record `AuthSession` baru di PostgreSQL dan menerbitkan:
   - **Access Token**: JWT berumur pendek (15 menit) berisi `sub`, `role`, `tokenVersion`, dan `sessionId`.
   - **Refresh Token**: Opaque cryptographically random token (256-bit) berumur 7 hari. Nilai hash SHA-256 disimpan di tabel `RefreshTokenRecord`.
6. Backend menyetel dua cookie HttpOnly: `tk_ac_access` dan `tk_ac_refresh`.
7. Catatan audit `AuthAuditLog` dibuat dengan status `SUCCESS`.
8. Frontend mengarahkan pengguna ke dashboard sesuai role (`/dashboard` untuk OWNER/ADMIN, `/technician` untuk TECHNICIAN).

### B. Validasi Sesi & Proteksi Rute
- **Server-Side Next.js (`getServerSession`)**: Server Component Next.js membaca cookie `tk_ac_access` dari peramban dan memanggil NestJS `/api/v1/auth/me` dengan cookie yang diteruskan. Jika token kedaluwarsa, BFF mencoba me-refresh sesi secara transparan.
- **Backend NestJS (`JwtAuthGuard` & `RolesGuard`)**: Setiap request yang masuk ke endpoint berproteksi divalidasi tanda tangannya via `jose`. Guard memeriksa `tokenVersion` user dan status sesi `isRevoked` di database.

### C. Rotasi Refresh Token
- Saat Access Token kedaluwarsa (HTTP 401), API client di Next.js secara otomatis memanggil `/api/auth/refresh`.
- Backend memvalidasi Refresh Token lama, mencabutnya, dan menerbitkan pasangan token baru dalam transaksi atomik database.
- Jika terdeteksi token lama digunakan kembali (*reuse/replay detection*), seluruh keluarga token dalam sesi tersebut langsung dicabut demi keamanan.

### D. Logout
- **Logout Sesi Aktif (`/api/v1/auth/logout`)**: Menandai sesi aktif sebagai `isRevoked: true`, menghapus seluruh refresh token terkait di DB, dan membersihkan cookie peramban.
- **Logout Seluruh Perangkat (`/api/v1/auth/logout-all`)**: Menandai semua sesi milik pengguna sebagai dicabut dan menaikkan `tokenVersion` user, sehingga seluruh access token lama otomatis tidak valid.

---

## 4. Ringkasan Endpoint Backend

| Method | Endpoint | Deskripsi | Hak Akses |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Autentikasi email & password | Publik (Rate Limited) |
| POST | `/api/v1/auth/refresh` | Rotasi token sesi | Publik (Memerlukan Refresh Cookie) |
| POST | `/api/v1/auth/logout` | Logout sesi aktif | Terautentikasi |
| POST | `/api/v1/auth/logout-all` | Logout semua sesi | Terautentikasi |
| GET | `/api/v1/auth/me` | Profil pengguna aktif | Terautentikasi |
| GET | `/api/v1/auth/sessions` | Daftar sesi login aktif | Terautentikasi |
| DELETE | `/api/v1/auth/sessions/:id` | Cabut sesi tertentu | Terautentikasi (Milik sendiri / OWNER) |
| PATCH | `/api/v1/auth/profile` | Perbarui nama & no telepon | Terautentikasi |
| POST | `/api/v1/auth/change-password` | Ganti kata sandi | Terautentikasi |
