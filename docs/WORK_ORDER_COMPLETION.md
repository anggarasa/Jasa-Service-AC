# Dokumen Spesifikasi: Work Order Completion & Validation Gates

## 1. Konsep Pintu Validasi (Validation Gates)
Penyelesaian Surat Perintah Kerja (SPK) di lapangan tidak boleh dilakukan secara terburu-buru tanpa bukti pekerjaan yang memadai. Sistem menerapkan **Validation Gates** terprogram pada endpoint `POST /api/v1/technician/work-orders/:id/complete`:

### Pintu 1: Kelengkapan Inspeksi Unit AC
- Sistem memindai seluruh `WorkOrderItem` yang terdaftar pada SPK.
- Setiap item wajib memiliki catatan inspeksi `WorkOrderUnitInspection` dengan status selain `NOT_INSPECTED`.
- Jika ada unit yang belum diinspeksi, sistem menolak request dengan status HTTP 400 Bad Request:
  `Semua unit AC wajib diinspeksi sebelum menyelesaikan pekerjaan. Unit "..." belum lengkap diinspeksi.`

### Pintu 2: Penyelesaian Item Checklist Wajib
- Sistem memeriksa seluruh `WorkOrderChecklistItem` yang memiliki `isRequiredSnapshot: true`.
- Tidak boleh ada item wajib yang berstatus `NOT_STARTED`.
- Item wajib harus berstatus `DONE` atau `NOT_APPLICABLE` (dengan catatan).
- Jika ada item wajib yang terlewat, sistem menolak dengan HTTP 400 Bad Request.

### Pintu 3: Laporan Servis (Service Report)
- Sistem memastikan model `WorkOrderServiceReport` telah dibuat untuk SPK tersebut.
- Kolom `summary` (ringkasan servis) dan `workPerformed` (tindakan teknis yang dilakukan) wajib terisi dan valid.

## 2. Sinkronisasi Otomatis Antar Model
Saat ketiga pintu validasi terpenuhi, transaksi atomik database (`$transaction`) menjalankan pembaruan:
1. `WorkOrder`:
   - Status menjadi `COMPLETED`.
   - `completedAt` dicatat timestamp waktu server saat ini.
   - `technicianNotes` dicatat.
2. `WorkOrderServiceReport`:
   - Tanda tangan / nama pelanggan penerima dan teknisi diperbarui.
   - `isCompleted` diset `true`.
3. `Booking`:
   - Status pemesanan otomatis diperbarui menjadi `COMPLETED`.
4. Audit & History:
   - `WorkOrderStatusHistory` mencatat transisi status ke `COMPLETED`.
   - `BookingAuditLog` mencatat tindakan `WORK_ORDER_COMPLETED`.
