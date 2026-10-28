# Booking and Work Order Consistency Matrix — CoolCare AC Service

Dokumen ini mendefinisikan aturan sinkronisasi status otomatis dua arah antara entitas `Booking` dan `WorkOrder`.

---

## 1. Aturan Sinkronisasi Otomatis

| Peristiwa pada Work Order | Efek Sinkronisasi pada Booking Terkait |
| :--- | :--- |
| SPK diterbitkan dengan teknisi | Jika status booking adalah `CONFIRMED`, status otomatis naik ke `ASSIGNED` dan `technicianId` diselaraskan. |
| Teknisi SPK dialihkan (`POST /assign`) | `technicianId` pada rekaman `Booking` ikut diselaraskan secara atomik. |
| Status SPK berubah ke `IN_PROGRESS` | Jika status booking belum `IN_PROGRESS`, status booking otomatis diubah ke `IN_PROGRESS`. |
| Status SPK berubah ke `COMPLETED` | Jika status booking belum `COMPLETED`, status booking otomatis diselesaikan (`COMPLETED`). |

---

## 2. Aturan Kaskade dari Booking ke Work Order

| Peristiwa pada Booking | Efek Kaskade pada Work Order Terkait |
| :--- | :--- |
| Booking dialihkan teknisinya (`/reassign-technician`) | Semua SPK aktif yang terkait otomatis dialihkan ke teknisi baru, dan riwayat mutasi dicatat di `WorkOrderAssignmentHistory`. |
| Booking dijadwalkan ulang (`/reschedule`) | Jadwal `scheduledStartAt` dan `scheduledEndAt` pada SPK aktif otomatis diselaraskan dengan waktu baru. |
| Booking dibatalkan (`/cancel`) | Semua SPK terkait yang belum selesai (`status NOT IN [COMPLETED, CANCELLED]`) otomatis dibatalkan (`status = CANCELLED`) dengan alasan pembatalan booking. |
