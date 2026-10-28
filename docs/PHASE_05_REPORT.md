# Laporan Implementasi: Phase 05 — Customer, Service Address & AC Unit Management

**Proyek:** TampilKit AC Booking System  
**Brand Demo:** CoolCare AC Service  
**Status Audit:** **PASS (100% Verified)**  
**Tanggal Verifikasi:** 28 Oktober 2026  

---

## 1. Ringkasan Eksekutif
Phase 05 berhasil mengimplementasikan seluruh modul operasional manajemen pelanggan, multi-alamat servis, dan inventaris unit pendingin ruangan (AC). Seluruh entitas disimpan secara nyata di database PostgreSQL lokal dan foto dokumentasi unit AC disimpan di MinIO Docker Desktop.

Seluruh kriteria penerimaan terpenuhi tanpa merusak fitur-fitur dari Phase 01 s/d Phase 04.

---

## 2. Fitur & Modul yang Diimplementasikan

### A. Modul Pelanggan (`CustomerModule`)
- **Normalisasi Nomor Telepon Indonesia**:
  - Konversi otomatis dari `08...`, `628...`, `+628...` ke format E.164 (`+6281234567890`) dan format tampilan ramah pengguna (`0812-3456-7890`).
  - Pembersihan karakter spasi, tanda strip, dan tanda kurung.
- **Deteksi Kandidat Duplikasi**:
  - Endpoint `GET /api/v1/admin/customers/check-duplicate?phone=...` mendeteksi nomor telepon serupa secara real-time.
  - Tidak memaksakan penggabungan akun (*no silent merge*) sehingga aman untuk nomor telepon keluarga/kantor bersama.
- **Kode Pelanggan Unik**:
  - Generator server-side aman konkurensi (format: `CUS-000001`).
- **Pengarsipan Aman (Soft-Delete)**:
  - `DELETE /api/v1/admin/customers/:id` mengubah `isActive: false` dan menyimpan waktu `archivedAt`.

### B. Modul Alamat Servis (`CustomerAddressModule`)
- **Multi-Alamat per Pelanggan**:
  - Mendukung penambahan banyak alamat (Rumah, Kantor, Ruko, dll) untuk satu pelanggan.
- **Aturan Alamat Utama Transaksional**:
  - Alamat aktif pertama yang dibuat otomatis menjadi alamat utama (`isPrimary: true`).
  - Endpoint `POST /api/v1/admin/customers/:id/addresses/:addressId/set-primary` berjalan di dalam `Prisma.$transaction` untuk mendemote alamat lain dan mempromosikan alamat target.
  - Jika alamat utama diarsipkan, sistem secara otomatis mengalihkan status utama ke alamat aktif berikutnya.
- **Proteksi Konkurensi Database**:
  - Penegakan integritas menggunakan PostgreSQL Partial Unique Index:
    `CREATE UNIQUE INDEX "customer_address_one_active_primary_idx" ON "CustomerAddress" ("customerId") WHERE "isPrimary" = true AND "isActive" = true;`
- **Validasi Ketercakupan Area Servis**:
  - Endpoint `POST /api/v1/admin/customers/:id/addresses/validate-area` memverifikasi kota dan kecamatan terhadap tabel `ServiceArea` aktif untuk menampilkan estimasi waktu tempuh dan ongkos kunjungan.

### C. Modul Inventaris Unit AC (`AcUnitsModule`)
- **Relasi Integritas Komposit Database**:
  - Menerapkan *Composite Foreign Key*:
    `FOREIGN KEY ("customerAddressId", "customerId") REFERENCES "CustomerAddress"("id", "customerId")`.
  - Mencegah asosiasi unit AC ke alamat milik pelanggan lain di level database.
- **Kapasitas PK Pecahan**:
  - Menggunakan tipe `Decimal(4, 2)` di PostgreSQL untuk nilai `0.5`, `0.75`, `1.0`, `1.5`, `2.0`, `2.5` PK.
- **Pemindahan Unit Antar Alamat (*Move Address*)**:
  - Endpoint `POST /api/v1/admin/ac-units/:id/move-address` memvalidasi bahwa alamat tujuan baru harus milik pelanggan yang sama.
- **Dokumentasi Foto Privat MinIO**:
  - Unggahan Fastify multipart dengan batas 5 MB, validasi tipe MIME (JPEG, PNG, WebP), dan pengecekan tanda tangan byte (*magic bytes*).
  - Pengaliran aman berotorisasi melalui `GET /api/v1/admin/ac-units/:id/photos/:photoId/content` dengan header `Cache-Control: private, max-age=3600`.
- **Histori Servis Riil**:
  - Ditarik dari tabel relasi pesanan nyata (`BookingAcUnit` -> `Booking` -> `WorkOrder`). Mengembalikan state kosong netral jika belum ada pengerjaan tanpa pernah membuat data palsu.

### D. Audit Log Mutasi Pelanggan (`CustomerAuditModule`)
- Pelacakan audit mutasi data pelanggan, alamat, dan unit AC pada tabel `CustomerAuditLog`.

---

## 3. Rute Frontend Next.js 15
- `/dashboard/customers` — Direktori pelanggan berhalaman dengan pencarian dan filter status.
- `/dashboard/customers/new` — Formulir pendaftaran pelanggan baru dengan deteksi duplikasi instan.
- `/dashboard/customers/[id]` — Detail profil pelanggan lengkap (Tabs: Ringkasan, Alamat, Unit AC, Riwayat Layanan).
- `/dashboard/customers/[id]/edit` — Formulir perubahan data profil pelanggan.
- `/dashboard/ac-units` — Direktori global unit AC dengan filter merk, tipe, dan kapasitas PK.
- `/dashboard/ac-units/[id]` — Detail unit AC, spesifikasi teknis, galeri foto MinIO, dan opsi pemindahan lokasi alamat.
- `/api/admin/[...path]` — Next.js BFF proxy yang meneruskan cookie HttpOnly kredensial sesi ke backend Fastify.

---

## 4. Bukti Pengujian Otomatis Monorepo

| Pengujian | Target | Status | Hasil |
|---|---|:---:|---|
| **Typecheck** | Monorepo (3 workspaces) | **PASS** | 0 errors |
| **Linter** | Monorepo (3 workspaces) | **PASS** | 0 warnings, 0 errors |
| **Unit Tests** | Frontend & Backend | **PASS** | 40 passed (25 frontend, 15 backend) |
| **E2E Tests** | Backend Fastify | **PASS** | 46 passed across 6 test suites |
| **Production Build** | Next.js App Router | **PASS** | 23 routes static/dynamic generated |

---

## 5. Matriks Regresi Phase 01–04
- Health endpoints (`/health`): PASS.
- Autentikasi JWT, refresh token rotation, logout, audit sesi (Phase 02): PASS.
- Pengaturan bisnis, jam operasional, area servis, katalog servis (Phase 03): PASS.
- Website publik, katalog dinamis, SEO, proxy media publik (Phase 04): PASS.
- Data pribadi pelanggan dan foto unit AC terisolasi penuh dari rute publik.

---

## 6. Vonis Akhir
**STATUS: PASS**
Seluruh kriteria penerimaan Phase 05 terpenuhi dengan bukti pengujian nyata dan kode produksi yang siap digunakan.
