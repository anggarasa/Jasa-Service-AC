# Feature Specification: Technician Workspace & Field Service Execution (Phase 09)

## 1. Latar Belakang & Tujuan
Modul Phase 09 bertujuan untuk menyediakan ruang kerja mandiri berbasis web responsif (*mobile-first*) bagi para teknisi lapangan CoolCare AC Service. Teknisi dapat mengakses tugas yang ditugaskan secara eksklusif (terisolasi dari pekerjaan teknisi lain), melakukan check-in kedatangan di lokasi pelanggan (*Arrival Check-in*), memeriksa & mendiagnosis unit AC per-unit, mengisi checklist servis terstandardisasi, mengunggah foto dokumentasi *before/after* ke MinIO secara privat, mencatat riwayat pengerjaan, dan menyelesaikan pekerjaan secara transaksional dengan sinkronisasi ke data pemesanan induk.

---

## 2. Cakupan Fitur Utama

### A. Dashboard & Direktori Tugas Teknisi
- **Rute**: `/technician` dan `/technician/jobs`
- **Endpoints**: `GET /api/v1/technician/dashboard`, `GET /api/v1/technician/work-orders`
- **Fungsi**:
  - Menampilkan ringkasan tugas: Hari Ini, Mendatang, Sedang Dikerjakan, Menunggu Tindak Lanjut, dan Selesai Hari Ini.
  - Memastikan isolasi data mutlak (*IDOR Protection*): teknisi hanya dapat melihat pekerjaan yang ditugaskan ke dirinya (`technicianId` yang di-resolve dari sesi JWT).
  - Menyediakan filter status, pencarian nomor SPK/nama pelanggan, dan paginasi.

### B. Detail Pekerjaan, Kontak Pelanggan & Navigasi
- **Rute**: `/technician/jobs/[id]`
- **Endpoints**: `GET /api/v1/technician/work-orders/:id`
- **Fungsi**:
  - Menampilkan detail pekerjaan: nomor SPK, kode booking, jadwal servis, instruksi admin, unit AC yang ditangani.
  - Akses cepat komunikasi: tombol panggilan langsung (`tel:`) dan WhatsApp dengan pesan pembuka otomatis terformat.
  - Tautan navigasi Google Maps berdasarkan alamat servis.

### C. Siklus Hidup Status Tugas (*Work Order State Machine*)
- **Endpoints**:
  - `POST /api/v1/technician/work-orders/:id/status`
  - `POST /api/v1/technician/work-orders/:id/arrive`
  - `POST /api/v1/technician/work-orders/:id/start`
  - `POST /api/v1/technician/work-orders/:id/follow-up`
  - `POST /api/v1/technician/work-orders/:id/complete`
- **Alur Transisi**:
  `ASSIGNED` ➔ `ON_THE_WAY` ➔ `ARRIVED` ➔ `IN_PROGRESS` ➔ `COMPLETED` (atau `FOLLOW_UP_REQUIRED`)
- **Aturan**:
  - Hanya teknisi yang ditugaskan yang dapat memutasi status.
  - Transisi status divalidasi ketat (tidak dapat melompati alur atau membalikkan status yang sudah selesai/dibatalkan).
  - Sinkronisasi otomatis ke status pemesanan induk (`BookingStatus`).

### D. Inspeksi Unit AC Per-Unit
- **Rute**: `/technician/jobs/[id]/inspection`
- **Endpoints**:
  - `GET /api/v1/technician/work-orders/:id/inspections`
  - `PUT /api/v1/technician/work-orders/:id/items/:itemId/inspection`
- **Fungsi**:
  - Form inspeksi terisolasi untuk setiap unit AC pada SPK.
  - Input diagnosa teknis, kondisi awal, tindakan yang direkomendasikan, dan penandaan jika butuh tindak lanjut.

### E. Checklist Layanan Servis Terstandardisasi
- **Rute**: `/technician/jobs/[id]/checklist`
- **Endpoints**:
  - `GET /api/v1/technician/work-orders/:id/checklist`
  - `PATCH /api/v1/technician/work-orders/:id/checklist/items/:itemId`
- **Fungsi**:
  - Template checklist disnapshot saat SPK diinisialisasi agar perubahan template masa depan tidak merusak histori data.
  - Pelacakan per-unit AC: `NOT_STARTED`, `DONE`, `NOT_APPLICABLE` (wajib alasan), `NEEDS_ATTENTION`.
  - Item berlabel *required* wajib diselesaikan sebelum SPK dapat ditandai selesai.

### F. Dokumentasi Foto Sebelum & Sesudah (*Before/After Media*)
- **Rute**: `/technician/jobs/[id]/photos`
- **Endpoints**:
  - `GET /api/v1/technician/work-orders/:id/photos`
  - `POST /api/v1/technician/work-orders/:id/photos` (Multipart upload)
  - `DELETE /api/v1/technician/work-orders/:id/photos/:photoId`
  - `GET /api/v1/technician/work-orders/:id/photos/:photoId/content` (Secure media stream)
- **Kategori Foto**: `BEFORE`, `DURING`, `AFTER`, `ISSUE`.
- **Keamanan**: Disimpan di bucket privat MinIO dengan otorisasi berbasis penugasan teknisi.

### G. Laporan Servis Lapangan (*Service Report*)
- **Rute**: `/technician/jobs/[id]/report`
- **Endpoints**:
  - `GET /api/v1/technician/work-orders/:id/report`
  - `PUT /api/v1/technician/work-orders/:id/report`
- **Fungsi**:
  - Ringkasan komprehensif temuan lapangan, tindakan yang telah dilakukan, kendala yang ditemukan, dan rekomendasi perawatan.

### H. Alur Penyelesaian Pekerjaan & Tindak Lanjut (*Completion & Follow-up*)
- Validasi syarat sebelum penyelesaian:
  1. Status sedang `IN_PROGRESS`.
  2. Seluruh unit AC telah diinspeksi.
  3. Checklist wajib telah berstatus `DONE` atau `NOT_APPLICABLE` dengan alasan.
  4. Laporan servis telah diisi.
- Jika ada kendala yang belum tuntas, teknisi dapat memindahkan status ke `FOLLOW_UP_REQUIRED` dengan alasan tercatat untuk ditindaklanjuti admin.
- Saat selesai, `completedAt` dicatat dan status `Booking` induk diselesaikan.

---

## 3. Otorisasi & Keamanan
- Peran `TECHNICIAN` diwajibkan untuk seluruh endpoint `/technician/*`.
- Token JWT dan HttpOnly cookie diverifikasi via `JwtAuthGuard` dan `RolesGuard`.
- Setiap query database difilter dengan klausa `technicianId: authenticatedTechnician.id`.
- Akses oleh teknisi yang tidak ditugaskan atau tidak aktif akan ditolak dengan `403 Forbidden` / `404 Not Found`.

---

## 4. UI/UX Responsif Mobile-First
- Navigasi bawah (*Bottom Navigation Bar*) untuk perangkat bergerak: Beranda, Pekerjaan, Jadwal, Profil.
- Tombol aksi utama berukuran besar, form mudah diisi di layar ponsel, dan indikator progres yang jelas.
- Dukungan input kamera ponsel atau galeri foto.
