# Spesifikasi Fitur — Phase 05: Customer, Service Address & AC Unit Management

**Fitur:** Manajemen Pelanggan, Alamat Servis, dan Inventaris Unit AC  
**Modul:** Customer, Customer Address, AC Unit, Private Media & Audit Log  
**Otorisasi:** OWNER & ADMIN (Akses Penuh); TECHNICIAN (Ditolak / Terbatas pada Work Order di fase lanjutan)  

---

## 1. Latar Belakang & Tujuan
Fase 05 mengimplementasikan fondasi data operasional lapangan:
1. **Direktori Pelanggan**: Pencatatan profil pelanggan, normalisasi nomor telepon Indonesia (+62/08), deteksi kandidat duplikasi (tanpa penggabungan paksa), dan pengarsipan aman (*soft-delete/archive*).
2. **Manajemen Alamat Servis**: Mendukung banyak alamat per pelanggan (Rumah, Kantor, Ruko), aturan tepat satu alamat utama (*primary address*) aktif dengan proteksi konkurensi database, serta validasi cakupan area servis (*ServiceArea*).
3. **Inventaris Unit AC**: Relasi ketat unit AC terhadap alamat pelanggan dengan jaminan database (*composite integrity*), dukungan kapasitas PK presisi (*Decimal* pecahan: 0.5, 0.75, 1, 1.5, 2 PK), pemindahan unit antar alamat pelanggan yang sama, dan dokumentasi foto privat melalui MinIO.
4. **Audit & Histori Layanan**: Pelacakan aktivitas mutasi data dan penyiapan tampilan histori layanan tanpa menyisipkan data fiktif.

---

## 2. Model Data & Skema Database
- **Perubahan Skema Prisma**:
  - Penambahan enum `AcType` (`SPLIT`, `CASSETTE`, `FLOOR_STANDING`, `CENTRAL`, `WINDOW`, `PORTABLE`, `OTHER`).
  - Penambahan nilai `AC_UNIT_PHOTO` pada enum `MediaPurpose`.
  - Penambahan enum `CustomerAuditAction`.
  - Pembaruan model `Customer`: Tambah `customerCode`, `normalizedPhone`, `displayPhone`, `notes`, `isActive`, `archivedAt`. Drop unique phone constraint ketat antar bisnis.
  - Pembaruan model `CustomerAddress`: Tambah `recipientName`, `recipientPhone`, `province`, `subdistrict`, `serviceAreaId`, `isPrimary`, `isActive`, `archivedAt`.
  - Pembaruan model `AcUnit`: Tambah relasi `customerAddressId`, `unitCode`, `unitLabel`, `serialNumber`, `installationRoom`, `installationDate`, `isActive`, `archivedAt`.
  - Model baru `AcUnitMedia`: Relasi antara `AcUnit` dan `MediaAsset`.
  - Model baru `CustomerAuditLog`: Pelacakan audit aksi pelanggan, alamat, dan unit AC.
- **Integritas Database Tingkat PostgreSQL**:
  - Partial Unique Index untuk 1 primary address aktif per customer:
    `CREATE UNIQUE INDEX "customer_address_one_active_primary_idx" ON "CustomerAddress" ("customerId") WHERE "isPrimary" = true AND "isActive" = true;`
  - Composite Foreign Key untuk menjamin `customerAddressId` milik pelanggan yang sama:
    `FOREIGN KEY ("customerAddressId", "customerId") REFERENCES "CustomerAddress"("id", "customerId")`.

---

## 3. Endpoints REST API (NestJS Fastify)
Semua endpoint berawalan `/api/v1/admin/*`, dilindungi `JwtAuthGuard` dan `RolesGuard` (`OWNER`, `ADMIN`).

### A. Customer
- `GET /api/v1/admin/customers` — List pelanggan berhalaman, pencarian (nama, kode, no telp), filter status.
- `POST /api/v1/admin/customers` — Tambah pelanggan baru (otomatis normalisasi nomor telepon dan generate customerCode).
- `GET /api/v1/admin/customers/check-duplicate?phone=...` — Deteksi kandidat duplikasi nomor telepon.
- `GET /api/v1/admin/customers/:id` — Detail profil pelanggan lengkap dengan ringkasan alamat & unit AC.
- `PATCH /api/v1/admin/customers/:id` — Perbarui data profil pelanggan.
- `DELETE /api/v1/admin/customers/:id` — Arsipkan pelanggan (soft-delete).
- `GET /api/v1/admin/customers/:id/history` — Riwayat booking & work order nyata (atau kosong jika belum ada).

### B. Customer Address
- `GET /api/v1/admin/customers/:customerId/addresses` — List alamat pelanggan.
- `POST /api/v1/admin/customers/:customerId/addresses` — Tambah alamat baru (otomatis primary jika alamat aktif pertama).
- `GET /api/v1/admin/customers/:customerId/addresses/:addressId` — Detail alamat.
- `PATCH /api/v1/admin/customers/:customerId/addresses/:addressId` — Perbarui alamat.
- `DELETE /api/v1/admin/customers/:customerId/addresses/:addressId` — Arsipkan alamat.
- `POST /api/v1/admin/customers/:customerId/addresses/:addressId/set-primary` — Jadikan alamat utama secara transaksional.
- `POST /api/v1/admin/customers/:customerId/addresses/validate-area` — Validasi ketercakupan area servis berdasarkan kota/kecamatan.

### C. AC Unit
- `GET /api/v1/admin/customers/:customerId/ac-units` — List unit AC milik pelanggan tertentu.
- `POST /api/v1/admin/customers/:customerId/ac-units` — Tambah unit AC ke alamat pelanggan.
- `GET /api/v1/admin/ac-units` — Direktori global unit AC (pencarian kode/brand/tipe/customer).
- `GET /api/v1/admin/ac-units/:id` — Detail unit AC beserta foto & histori.
- `PATCH /api/v1/admin/ac-units/:id` — Perbarui data teknis unit AC.
- `DELETE /api/v1/admin/ac-units/:id` — Arsipkan unit AC.
- `POST /api/v1/admin/ac-units/:id/move-address` — Pindahkan unit ke alamat lain milik pelanggan yang sama.
- `GET /api/v1/admin/ac-units/:id/history` — Riwayat pengerjaan unit AC.

### D. AC Unit Photo (MinIO)
- `GET /api/v1/admin/ac-units/:id/photos` — List foto unit AC.
- `POST /api/v1/admin/ac-units/:id/photos` — Upload foto unit AC (multipart, max 5MB, validasi magic bytes WebP/JPEG/PNG, simpan di MinIO).
- `DELETE /api/v1/admin/ac-units/:id/photos/:photoId` — Hapus foto unit AC.
- `GET /api/v1/admin/ac-units/:id/photos/:photoId/content` — Streaming foto unit AC berotorisasi.

---

## 4. Antarmuka Next.js Admin Dashboard
- Halaman `/dashboard/customers`: Tabel direktori pelanggan dengan pencarian, filter, badge status, dan pagination.
- Halaman `/dashboard/customers/new`: Formulir registrasi pelanggan dengan deteksi duplikasi instan.
- Halaman `/dashboard/customers/[id]`: Tab profil (Overview, Alamat, Unit AC, Riwayat Layanan).
- Halaman `/dashboard/customers/[id]/edit`: Formulir edit data pelanggan.
- Halaman `/dashboard/ac-units`: Direktori global unit AC dengan filter brand, tipe, dan kapasitas PK.
- Halaman `/dashboard/ac-units/[id]`: Detail unit AC, galeri foto MinIO, dan opsi pemindahan alamat.
