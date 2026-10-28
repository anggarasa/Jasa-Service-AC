# Work Order (SPK) Management — CoolCare AC Service (Phase 08)

Dokumen ini mendefinisikan sistem penerbitan dan pengelolaan Surat Perintah Kerja (SPK) untuk teknisi lapangan CoolCare AC Service.

---

## 1. Konsep & Struktur Data

Surat Perintah Kerja (SPK) adalah dokumen operasional lapangan resmi yang mengikat teknisi, alamat pengerjaan, dan unit AC yang ditangani.

### Entitas Utama:
- `WorkOrder`:
  - `workOrderNumber`: Format terstandarisasi `WO-YYYYMMDD-XXXX` (unik, berurutan per hari).
  - `bookingId`: Referensi ke reservasi pemesanan asal (relasi 1-to-1 aktif).
  - `technicianId`: Teknisi lapangan penanggung jawab.
  - `status`: `WorkOrderStatus` (`SCHEDULED`, `ASSIGNED`, `ON_THE_WAY`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `FOLLOW_UP_REQUIRED`).
  - `serviceSummarySnapshot`: Salinan nama layanan saat SPK diterbitkan.
  - `customerComplaintSnapshot`: Salinan keluhan pelanggan dari form booking.
  - `adminInstructions`: Instruksi khusus dari admin/supervisor.
  - `diagnosis`: Diagnosa teknis teknisi di lapangan (tekanan freon, kondisi kompresor, ampere motor fan).
  - `technicianNotes`: Catatan tindakan yang telah dilakukan.
- `WorkOrderItem`:
  - Rincian item servis per unit AC dengan salinan harga satuan, kuantitas, dan catatan unit.
- `WorkOrderStatusHistory`:
  - Catatan kronologis setiap perpindahan status SPK beserta alasan dan identitas pengguna.
- `WorkOrderAssignmentHistory`:
  - Catatan audit jika terjadi pergantian atau pengalihan teknisi penanggung jawab SPK.

---

## 2. API Endpoints SPK

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/v1/admin/work-orders` | Daftar SPK dengan filter status, teknisi, dan rentang tanggal |
| `GET` | `/api/v1/admin/work-orders/:id` | Detail lengkap SPK, item tugas, dan histori penugasan |
| `POST` | `/api/v1/admin/work-orders` | Penerbitan SPK baru dari pemesanan yang valid |
| `PATCH` | `/api/v1/admin/work-orders/:id` | Pembaruan status SPK, diagnosa teknisi, dan catatan lapangan |
| `POST` | `/api/v1/admin/work-orders/:id/assign` | Penugasan atau pengalihan teknisi penanggung jawab SPK |
| `POST` | `/api/v1/admin/work-orders/:id/cancel` | Pembatalan SPK dengan pencatatan alasan |

---

## 3. Aturan Bisnis & Integritas SPK

1. **Kelayakan Terbit**: SPK hanya dapat diterbitkan untuk pemesanan yang berstatus `CONFIRMED`, `ASSIGNED`, atau `IN_PROGRESS`. Pemesanan yang masih `PENDING` wajib dikonfirmasi terlebih dahulu.
2. **Pencegahan Duplikasi**: Setiap pemesanan hanya boleh memiliki maksimal 1 SPK aktif. Upaya pembuatan SPK kedua pada pemesanan yang sama akan memicu penolakan `409 Conflict`.
3. **Imutabilitas Selesai/Batal**: SPK yang telah berstatus `COMPLETED` atau `CANCELLED` dikunci secara permanen dan tidak dapat diubah statusnya lagi.
