# Admin Booking Management — CoolCare AC Service (Phase 08)

Dokumen ini mendefinisikan arsitektur dan panduan operasional manajemen reservasi servis AC pada dashboard admin CoolCare AC Service (TampilKit Studio).

---

## 1. Arsitektur Modul

Modul Admin Booking bertanggung jawab atas kontrol penuh siklus hidup reservasi servis AC lapangan, mencakup:
- **Pencarian & Penyaringan**: Berdasarkan kode booking (`ACB-YYYYMMDD-XXXX`), nama pelanggan, nomor telepon terstandarisasi E.164, status reservasi, teknisi yang ditugaskan, dan rentang tanggal janji temu.
- **Konfirmasi Administratif**: Verifikasi pesanan `PENDING` menjadi `CONFIRMED` atau langsung `ASSIGNED` jika teknisi dialokasikan saat konfirmasi.
- **Penolakan Administratif**: Penolakan pesanan dengan pencatatan `rejectionReason` dan pelepasan kunci slot okupansi teknisi (`ResourceOccupancy`).
- **Penjadwalan Ulang (Reschedule)**: Pemindahan tanggal/jam janji temu, sinkronisasi jendela okupansi, alokasi ulang teknisi, penambahan counter `rescheduleCount`, dan propagasi perubahan jadwal ke Surat Perintah Kerja (SPK) terkait.
- **Pembatalan**: Pembatalan pesanan dengan alasan jelas, pelepasan okupansi teknisi, serta pembatalan otomatis (*cascade cancellation*) ke SPK aktif.
- **Pemesanan Manual (Back-office)**: Penerbitan pemesanan langsung dari saluran telepon atau WhatsApp pelanggan dengan format kode resmi dan pencatatan audit log `bookingSource: ADMIN_MANUAL`.
- **Catatan Internal**: Catatan khusus antar staf admin dan operator tanpa terekspos ke pelanggan.

---

## 2. API Endpoints

| Method | Endpoint | Deskripsi | Otorisasi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/bookings` | Daftar reservasi servis dengan pagination dan filter | `ADMIN`, `OWNER` |
| `GET` | `/api/v1/admin/bookings/:id` | Detail reservasi lengkap, snapshot unit, dan log audit | `ADMIN`, `OWNER` |
| `POST` | `/api/v1/admin/bookings` | Pemesanan manual oleh admin/operator | `ADMIN`, `OWNER` |
| `POST` | `/api/v1/admin/bookings/:id/confirm` | Konfirmasi pesanan berstatus PENDING | `ADMIN`, `OWNER` |
| `POST` | `/api/v1/admin/bookings/:id/reject` | Tolak pesanan dengan alasan tercatat | `ADMIN`, `OWNER` |
| `POST` | `/api/v1/admin/bookings/:id/assign-technician` | Alokasi awal teknisi lapangan | `ADMIN`, `OWNER` |
| `POST` | `/api/v1/admin/bookings/:id/reassign-technician` | Pengalihan teknisi ke teknisi lain | `ADMIN`, `OWNER` |
| `POST` | `/api/v1/admin/bookings/:id/reschedule` | Jadwalkan ulang tanggal & jam servis | `ADMIN`, `OWNER` |
| `POST` | `/api/v1/admin/bookings/:id/cancel` | Batalkan pemesanan dan SPK terkait | `ADMIN`, `OWNER` |
| `PATCH` | `/api/v1/admin/bookings/:id/internal-notes` | Perbarui catatan internal tim admin | `ADMIN`, `OWNER` |
| `GET` | `/api/v1/admin/bookings/calendar` | Kalender agenda janji temu (Day/Week/Month) | `ADMIN`, `OWNER` |
| `GET` | `/api/v1/admin/technicians/schedule` | Ikhtisar kapasitas & slot kerja harian teknisi | `ADMIN`, `OWNER` |

---

## 3. Logika Transaksi & Integritas Data

Semua aksi mutasi status reservasi dan alokasi teknisi berjalan di dalam `prisma.$transaction`:
1. Penguncian sesi tingkat transaksi (*PostgreSQL Transaction-level Advisory Lock*) menggunakan `pg_try_advisory_xact_lock(hashtext(technicianId))` untuk mencegah *race conditions* antar operator.
2. Perekaman otomatis ke tabel `BookingStatusHistory` (mencatat `fromStatus`, `toStatus`, `reason`, dan `actorUserId`).
3. Perekaman jejak audit ke tabel `BookingAuditLog` (mencatat `action`, `actorUserId`, dan payload mutasi `details` dalam format JSON).
