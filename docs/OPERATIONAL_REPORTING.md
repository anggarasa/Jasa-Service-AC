# Laporan Operasional & Analisis Kinerja Lapangan (Operational Reporting)

## 1. Ikhtisar Metrik Operasional
Laporan operasional menyediakan visibilitas menyeluruh terhadap efisiensi pelaksanaan pekerjaan servis AC harian dan bulanan:
- **Total Reservasi**: Akumulasi pemesanan yang masuk melalui website atau backoffice.
- **Tingkat Penyelesaian SPK**: Jumlah SPK berstatus `COMPLETED` dibandingkan SPK yang dibatalkan (`CANCELLED`).
- **Produktivitas Teknisi**: Jumlah pekerjaan yang diselesaikan per teknisi dalam rentang waktu yang dipilih.
- **Rata-rata Durasi Pekerjaan**: Waktu yang dihabiskan sejak teknisi mulai bekerja (`startedAt`) hingga selesai (`completedAt`).

---

## 2. Filter & Rentang Waktu
Laporan operasional dapat difilter secara fleksibel:
- `startDate`: Awal periode pelaporan (default: tanggal 1 bulan berjalan).
- `endDate`: Akhir periode pelaporan (default: hari ini).
- `technicianId`: Menyaring metrik pekerjaan teknisi tertentu.
- `serviceId`: Menyaring kategori layanan tertentu.

Endpoint: `GET /api/v1/admin/reports/overview`
