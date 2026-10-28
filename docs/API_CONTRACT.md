# Spesifikasi Shared API Contract — @tampilkit-ac/api-contract

## 1. Format Standar Respons

### Respons Berhasil (Success)
```json
{
  "success": true,
  "data": { ... },
  "correlationId": "req-1a2b3c4d"
}
```

### Respons Gagal (Error)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validasi data masukan gagal.",
    "details": ["Nomor telepon harus diawali dengan format valid"]
  },
  "correlationId": "req-1a2b3c4d"
}
```

---

## 2. Endpoint Health (Phase 01)
- `GET /api/v1/health`: Menampilkan status sistem umum dan konektivitas dependensi (database, storage).
- `GET /api/v1/health/live`: Liveness check untuk orchestrator.
- `GET /api/v1/health/ready`: Readiness check dependensi.

---

## 3. Endpoint Autentikasi (Phase 02)
- `POST /api/v1/auth/login`: Autentikasi email dan password (Argon2id).
- `POST /api/v1/auth/refresh`: Rotasi token atomik dengan deteksi penyalahgunaan.
- `POST /api/v1/auth/logout`: Logout sesi aktif.
- `POST /api/v1/auth/logout-all`: Logout seluruh sesi pengguna.
- `GET /api/v1/auth/me`: Data pengguna terautentikasi.
- `GET /api/v1/auth/sessions`: Daftar sesi multi-perangkat aktif.
- `DELETE /api/v1/auth/sessions/:id`: Pencabutan sesi tertentu.
- `PATCH /api/v1/auth/profile`: Pembaruan nama dan nomor kontak.
- `POST /api/v1/auth/change-password`: Perubahan kata sandi akun (min 12 karakter).

---

## 4. Endpoint Publik (Phase 04)
- `GET /api/v1/public/business`: Profil publik bisnis dan kontak.
- `GET /api/v1/public/operating-hours`: Jadwal jam operasional 7 hari dan jadwal libur.
- `GET /api/v1/public/service-categories`: Kategori layanan aktif dan jumlah layanan.
- `GET /api/v1/public/services`: Katalog layanan AC dengan filter pencarian dan paginasi.
- `GET /api/v1/public/services/:slug`: Detail layanan AC beserta 3 layanan terkait.
- `GET /api/v1/public/service-areas`: Wilayah operasional dan ongkos kunjungan.
- `GET /api/v1/public/gallery`: Galeri foto pengerjaan teknisi yang disetujui.
- `GET /api/v1/public/media/:id`: Berkas media publik terverifikasi (streaming/redirect).

---

## 5. Endpoint Pelanggan, Alamat & Unit AC (Phase 05)

### Modul Pelanggan (`/api/v1/customers`)
- `GET /api/v1/customers`: Daftar pelanggan terpaginasi (filter `search`, `status`, `page`, `limit`).
- `POST /api/v1/customers`: Pendaftaran pelanggan baru dengan auto-generated kode `CUS-XXXXXX` dan normalisasi nomor telepon Indonesia (+62).
- `GET /api/v1/customers/duplicates`: Deteksi kandidat duplikat nomor telepon secara real-time (`phone` query param) tanpa silent merge.
- `GET /api/v1/customers/:id`: Profil lengkap pelanggan termasuk alamat aktif, unit AC, ringkasan metrik, dan log aktivitas operasional.
- `PATCH /api/v1/customers/:id`: Pembaruan data pelanggan.
- `DELETE /api/v1/customers/:id`: Pengarsipan aman pelanggan (*soft archive* jika memiliki riwayat, *hard delete* jika belum ada transaksi).
- `GET /api/v1/customers/:id/history`: Riwayat servis nyata dan log audit operasional pelanggan.

### Modul Alamat Pelanggan (`/api/v1/customers/:customerId/addresses`)
- `GET /api/v1/customers/:customerId/addresses`: Daftar alamat tersimpan pelanggan.
- `POST /api/v1/customers/:customerId/addresses`: Penambahan alamat baru dengan verifikasi area jangkauan dan penegakan alamat utama tunggal (*single primary address invariant*).
- `PATCH /api/v1/customers/:customerId/addresses/:id`: Pembaruan alamat.
- `POST /api/v1/customers/:customerId/addresses/:id/set-primary`: Menjadikan alamat sebagai alamat utama tunggal secara atomik.
- `DELETE /api/v1/customers/:customerId/addresses/:id`: Pengarsipan aman alamat (dilarang jika masih memiliki unit AC aktif).
- `POST /api/v1/customers/:customerId/addresses/validate-area`: Validasi instan cakupan kode pos/kota/kecamatan terhadap master `ServiceArea`.

### Modul Inventaris Unit AC (`/api/v1/ac-units`)
- `GET /api/v1/ac-units`: Direktori global inventaris unit AC di seluruh pelanggan (filter `search`, `brand`, `capacityPk`, `acType`, `page`, `limit`).
- `POST /api/v1/ac-units`: Registrasi unit AC dengan auto-generated kode `AC-XXXXXX`, kapasitas PK desimal (`0.50`, `0.75`, `1.00`, dsb), dan verifikasi integritas relasi alamat.
- `GET /api/v1/ac-units/:id`: Detail unit AC, riwayat pemindahan, foto terproteksi, dan riwayat servis nyata.
- `PATCH /api/v1/ac-units/:id`: Pembaruan spesifikasi dan ruangan unit AC.
- `POST /api/v1/ac-units/:id/move`: Pemindahan unit AC antar alamat milik pelanggan yang sama (menegakkan foreign key komposit `[customerAddressId, customerId]`).
- `DELETE /api/v1/ac-units/:id`: Pengarsipan aman unit AC (*soft archive* jika ada riwayat servis).
- `POST /api/v1/ac-units/:id/photos`: Unggah foto unit AC ke MinIO privat (`MediaPurpose.AC_UNIT_PHOTO`, max 5MB, validasi magic bytes JPEG/PNG/WebP).
- `GET /api/v1/ac-units/:id/photos/:photoId/preview`: Streaming foto unit AC dengan proteksi otentikasi role OWNER & ADMIN.
- `DELETE /api/v1/ac-units/:id/photos/:photoId`: Penghapusan foto unit AC dari MinIO privat dan database.

---

## 6. Endpoint Pemesanan Publik & Ketersediaan (Phase 07)

### Modul Ketersediaan Publik (`/api/v1/public/availability`)
- `GET /api/v1/public/availability`: Menghitung slot waktu servis yang tersedia secara dinamis berdasarkan jam kerja bisnis, libur, dan kapasitas teknisi aktif (`serviceId`, `unitCount`, `serviceAreaId`, `date`).

### Modul Pemesanan Guest (`/api/v1/public/bookings`)
- `POST /api/v1/public/bookings`: Membuat pemesanan servis AC baru (multi-unit AC) secara idempoten dengan alokasi kapasitas teknisi dan pencegahan double-booking database.
- `GET /api/v1/public/bookings/manage`: Menampilkan detail pemesanan dan riwayat status menggunakan token akses kriptografis 64-karakter.
- `POST /api/v1/public/bookings/process-expirations`: Membebaskan kapasitas teknisi pada pemesanan `PENDING` yang melewati batas penahanan waktu hold (`pendingHoldMinutes`).

### 11. Admin Bookings & Work Orders Endpoints (Phase 08)
- `GET /api/v1/admin/dashboard/overview`: Ringkasan metrik KPI harian, janji temu hari ini, pemesanan dan SPK terbaru.
- `GET /api/v1/admin/bookings`: Daftar reservasi servis dengan paginasi, pencarian, dan filter status/teknisi/tanggal.
- `GET /api/v1/admin/bookings/:id`: Rincian lengkap pemesanan, snapshot unit AC, alamat, histori status, dan jejak audit.
- `POST /api/v1/admin/bookings`: Pemesanan manual oleh admin/operator (source: `ADMIN_MANUAL`).
- `POST /api/v1/admin/bookings/:id/confirm`: Konfirmasi reservasi pending.
- `POST /api/v1/admin/bookings/:id/reject`: Tolak reservasi dengan alasan tercatat dan pelepasan slot teknisi.
- `POST /api/v1/admin/bookings/:id/assign-technician`: Penugasan awal teknisi lapangan dengan advisory lock.
- `POST /api/v1/admin/bookings/:id/reassign-technician`: Pengalihan teknisi ke teknisi lain beserta pencatatan alasan.
- `POST /api/v1/admin/bookings/:id/reschedule`: Penjadwalan ulang tanggal & jam servis, pembaruan okupansi, dan propagasi ke SPK.
- `POST /api/v1/admin/bookings/:id/cancel`: Pembatalan reservasi beserta pembatalan kaskade ke SPK aktif.
- `PATCH /api/v1/admin/bookings/:id/internal-notes`: Pembaruan catatan internal admin.
- `GET /api/v1/admin/bookings/calendar`: Kalender agenda servis (tampilan Day, Week, Month).
- `GET /api/v1/admin/technicians/schedule`: Ikhtisar kapasitas harian dan slot kerja teknisi aktif.
- `GET /api/v1/admin/work-orders`: Daftar Surat Perintah Kerja (SPK) lapangan.
- `GET /api/v1/admin/work-orders/:id`: Detail SPK, item tugas, diagnosa, dan histori status.
- `POST /api/v1/admin/work-orders`: Penerbitan SPK resmi dari pemesanan eligible.
- `PATCH /api/v1/admin/work-orders/:id`: Pembaruan status pengerjaan SPK, diagnosa teknisi, dan catatan lapangan.
- `POST /api/v1/admin/work-orders/:id/assign`: Penugasan / pengalihan teknisi penanggung jawab SPK.
- `POST /api/v1/admin/work-orders/:id/cancel`: Pembatalan SPK dengan pencatatan alasan.

## 6. Modul Workspace Teknisi Lapangan (Phase 09)
- `GET /api/v1/technician/dashboard`: Metrik harian teknisi.
- `GET /api/v1/technician/work-orders`: Daftar SPK yang ditugaskan ke teknisi.
- `GET /api/v1/technician/work-orders/:id`: Detail SPK teknisi.
- `POST /api/v1/technician/work-orders/:id/start-journey`: Transisi status ke ON_THE_WAY.
- `POST /api/v1/technician/work-orders/:id/arrive`: Check-in kedatangan di lokasi pelanggan.
- `POST /api/v1/technician/work-orders/:id/start`: Mulai pengerjaan servis (IN_PROGRESS).
- `PUT /api/v1/technician/work-orders/:id/items/:itemId/inspection`: Input parameter inspeksi teknis unit AC.
- `PUT /api/v1/technician/work-orders/:id/checklist/:checklistItemId`: Pembaruan status item checklist.
- `POST /api/v1/technician/work-orders/:id/photos`: Unggah foto Before/After ke MinIO.
- `PUT /api/v1/technician/work-orders/:id/report`: Input ringkasan laporan servis.
- `POST /api/v1/technician/work-orders/:id/complete`: Validasi & penyelesaian SPK.

## 7. Modul Integrasi Google Calendar (Phase 10)
- `GET /api/v1/admin/integrations/google/status`: Status koneksi kalender.
- `GET /api/v1/admin/integrations/google/connect`: URL otorisasi OAuth 2.0.
- `GET /api/v1/admin/integrations/google/callback`: Penanganan callback OAuth 2.0.
- `POST /api/v1/admin/integrations/google/disconnect`: Pemutusan integrasi kalender.
- `GET /api/v1/admin/integrations/google/jobs`: Antrean sinkronisasi outbox.
- `POST /api/v1/admin/integrations/google/jobs/:id/retry`: Retry manual job sinkronisasi yang gagal.
- `GET /api/v1/admin/integrations/google/conflicts`: Daftar konflik jadwal kalender.
- `POST /api/v1/admin/integrations/google/conflicts/:id/resolve`: Penyelesaian konflik jadwal.
- `POST /api/v1/public/google-calendar/webhook`: Webhook notifikasi push dari Google.

## 8. Modul Finansial, Faktur & Pembayaran (Phase 11)
- `GET /api/v1/admin/work-orders/:id/pricing`: Tinjauan estimasi awal vs biaya aktual SPK.
- `PUT /api/v1/admin/work-orders/:id/pricing`: Penyimpanan biaya jasa tambahan dan material.
- `POST /api/v1/admin/work-orders/:id/approvals`: Pencatatan persetujuan biaya pelanggan.
- `POST /api/v1/admin/invoices/drafts`: Pembuatan draf faktur (`INV-YYYYMM-XXXXX`).
- `POST /api/v1/admin/invoices/:id/issue`: Penerbitan resmi faktur & pembekuan item tagihan.
- `POST /api/v1/admin/invoices/:id/void`: Pembatalan faktur (hanya jika belum ada pembayaran terverifikasi).
- `POST /api/v1/admin/invoices/:id/payments`: Pencatatan pembayaran manual di tempat.
- `POST /api/v1/admin/payments/:id/verify`: Verifikasi kasir terhadap pembayaran masuk.
- `POST /api/v1/admin/payments/:id/reject`: Penolakan pembayaran tidak valid.
- `GET /api/v1/admin/invoices/:id/pdf`: Unduh dokumen faktur resmi (A4 PDF).
- `GET /api/v1/admin/payments/:id/receipt-pdf`: Unduh kuitansi resmi (A4 PDF).
- `GET /api/v1/admin/reports/overview`: Dasbor KPI keuangan & kinerja operasional.
- `GET /api/v1/admin/reports/export`: Ekspor data laporan keuangan ke CSV (proteksi CWE-1236).
- `GET /api/v1/public/bookings/:code/financial-summary`: Ringkasan finansial pelanggan mandiri.
