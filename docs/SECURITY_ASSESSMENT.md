# Security Assessment & Vulnerability Audit (OWASP ASVS 5.0.0 Reference)
**Project**: TampilKit Studio — AC Service Booking System  
**Edition**: Basic Field Service (CoolCare AC Service)  
**Date**: 2026-10-28  
**Auditor**: Application Security Engineering Lead  

---

## 1. Executive Summary

Sistem pemesanan servis AC TampilKit Studio dirancang dengan prinsip pertahanan berlapis (*Defense-in-Depth*). Audit keamanan ini merujuk pada standar industri **OWASP Application Security Verification Standard (ASVS) 5.0.0**.

Hasil audit mengonfirmasi:
- **Zero Critical Unmitigated Flaws**: Tidak ditemukan kerentanan bypass otentikasi, eskalasi hak akses (privilege escalation), ataupun SQL injection.
- **Invarian Finansial Kuat**: Pembekuan item faktur (*invoice snapshot freeze*) dan transaksi atomik database mencegah manipulasi harga pasca-penerbitan.
- **Isolasi Berkas Privat**: Berkas sensitif (foto pekerjaan AC, bukti pembayaran) tersimpan dalam bucket MinIO terproteksi dengan akses berbasis signed URL bertenggat waktu pendek.

---

## 2. Rincian Evaluasi OWASP ASVS

### V2: Authentication Verification
- **V2.1 Password Security**: Menggunakan algoritma **Argon2id** dengan salt kriptografis unik per akun. Kebijakan panjang kata sandi minimal 12 karakter ditegakkan di level API validator dan frontend Zod schema.
- **V2.2 Credential Handling**: Tidak ada password yang dicatat dalam log aplikasi (*sanitized logger*). Kata sandi akun default diatur melalui skrip bootstrap administratif.
- **V2.3 Token Architecture**:
  - Access Token: JWT berumur pendek (15 menit) berisi claims minimal (`sub`, `role`, `businessId`).
  - Refresh Token: Berumur panjang (7 hari) yang disimpan dalam HttpOnly, Secure, SameSite=Lax cookie.
  - Refresh Token Rotation: Menggunakan `RefreshTokenFamily`. Jika token lama yang sudah dikonsumsi dikirimkan kembali (indikasi *token theft / replay attack*), seluruh sesi dalam keluarga token tersebut dicabut seketika.

### V4: Access Control & Authorization (RBAC & IDOR)
- **V4.1 Role-Based Access Control**:
  - Endpoint administratif dilindungi oleh `JwtAuthGuard` dan `RolesGuard` terpadu.
  - Peran `TECHNICIAN` dibatasi secara ketat hanya pada ruang kerja tugasnya (`/technician/work-orders`) dan ditolak (HTTP 403) saat mencoba mengakses direktori pelanggan, manajemen bisnis, atau laporan keuangan.
- **V4.2 Insecure Direct Object Reference (IDOR) Protection**:
  - Penugasan teknisi diverifikasi terhadap ID pengguna yang sedang login (`user.id === technician.userId`). Teknisi A tidak dapat membaca atau memodifikasi SPK Teknisi B.
  - Akses unit AC divalidasi dengan foreign key komposit `(customerAddressId, customerId)`. Pelanggan tidak dapat mengaitkan unit AC ke alamat milik pelanggan lain.
  - Akses pemesanan pelanggan publik diproteksi oleh *Capability-based Token* berkekuatan kriptografis (`BookingAccessToken`) 256-bit dengan masa berlaku 30 hari.

### V5: Malicious Input & Injection Handling
- **V5.1 SQL Injection**: Menggunakan **Prisma ORM** dengan query berparameter penuh. Seluruh operasi penulisan menggunakan skema tipe ketat.
- **V5.2 Cross-Site Scripting (XSS)**: Next.js secara bawaan melakukan auto-escaping pada seluruh render JSX. Tidak ada pemanggilan `dangerouslySetInnerHTML` pada data masukan pengguna.
- **V5.3 CSV / Spreadsheet Formula Injection (CWE-1236)**:
  - Pada layanan ekspor laporan finansial (`CsvExportService`), seluruh sel teks yang diawali karakter eksekusi (`=`, `+`, `-`, `@`, `\t`, `\r`) diproteksi dengan awalan tanda kutip tunggal (`'`).

### V8: Data Protection & Privacy
- **V8.1 Enkripsi At-Rest untuk Secret Pihak Ketiga**:
  - Token refresh Google Calendar disimpan terenkripsi di database menggunakan **AES-256-GCM** dengan random 96-bit IV per baris dan 128-bit authentication tag. Kunci enkripsi diambil dari environment variable `APP_ENCRYPTION_KEY`.
- **V8.2 CSRF & Origin Protection**:
  - Cookie JWT menggunakan konfigurasi `SameSite=Lax`.
  - Fastify CORS whitelist dikonfigurasi ketat hanya menerima origin terdaftar (`APP_ORIGIN`).

### V12: File Upload & Storage Security
- **V12.1 Validasi Berkas**: Unggahan foto dan bukti bayar divalidasi ukuran maksimal (5MB untuk foto, 10MB untuk PDF/bukti), serta tipe MIME yang diizinkan (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`).
- **V12.2 Path Traversal**: Nama berkas yang diunggah pengguna diganti dengan UUID acak v4 (`crypto.randomUUID()`) dan disimpan dalam subdirektori terorganisir (`work-orders/photos/`, `payments/proofs/`).

---

## 3. Dependency & Supply Chain Audit Findings

Pemeriksaan `npm audit` mendeteksi 24 peringatan pada pustaka dependensi (9 low, 8 moderate, 7 high). Berikut adalah analisis exploitabilitas kontekstual:

| Komponen | Peringatan / Advisory | Severity | Analisis Kontekstual & Mitigasi TampilKit | Status Risiko |
|---|---|---|---|---|
| `@fastify/static` | Path traversal pada directory listing | High | Aplikasi TampilKit menonaktifkan directory listing (`list: false`). Berkas privat diakses melalui MinIO S3 presigned URL, bukan static folder Fastify. | **LOW (Mitigated)** |
| `fastify` | Validasi root primitive mismatch & proxy trust | High | Validasi masukan ditangani di layer NestJS `ValidationPipe` menggunakan DTO `class-validator` berbasis whitelist ketat, memitigasi celah Fastify native schema. | **LOW (Mitigated)** |
| `postcss` / `next` | XSS pada unescaped style stringify | High | Terjadi pada compiler build-time CSS, bukan runtime injeksi pengguna. Halaman publik Next.js di-compile aman tanpa custom runtime CSS injection. | **LOW (Build-time only)** |
| `zod` | Memory exhaustion pada koleksi besar | High | Skema Zod frontend dibatasi oleh batasan form UI bawaan (maksimal 5 unit AC per pemesanan). | **LOW (Bounded)** |
| `decode-uri-component` | DoS pada dekompresi query string panjang | Moderate | Terletak pada sub-dependensi internal SDK MinIO. Payload S3 dikontrol oleh backend terpercaya, bukan input publik langsung. | **LOW (Internal SDK)** |

> [!NOTE]
> Sesuai Rule 19, `npm audit fix --force` **tidak dijalankan secara membabi-buta** karena akan memicu breaking changes pada versi Next.js dan NestJS Fastify. Pembaruan dependensi minor terjadwal direkomendasikan pada siklus pemeliharaan berkala berikutnya.
