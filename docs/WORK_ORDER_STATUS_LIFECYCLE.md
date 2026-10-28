# Work Order Status Lifecycle — CoolCare AC Service

Dokumen ini mendefinisikan siklus hidup status Surat Perintah Kerja (SPK) lapangan.

---

## 1. Status Enumeration (`WorkOrderStatus`)

- `DRAFT`: Draf awal sebelum SPK diterbitkan secara resmi ke teknisi.
- `SCHEDULED`: SPK diterbitkan dan masuk ke antrean jadwal.
- `ASSIGNED`: Teknisi lapangan telah ditugaskan dan menerima notifikasi tugas.
- `ON_THE_WAY`: Teknisi dalam perjalanan menuju alamat pelanggan.
- `IN_PROGRESS`: Teknisi tiba di lokasi dan sedang melakukan pembongkaran/pencucian AC.
- `COMPLETED`: Pekerjaan servis telah tuntas diselesaikan oleh teknisi.
- `CANCELLED`: SPK dibatalkan karena pembatalan pemesanan atau kendala operasional.
- `FOLLOW_UP_REQUIRED`: Pekerjaan membutuhkan kunjungan susulan (misalnya menunggu sparepart pengganti atau pengadaan freon khusus).

---

## 2. Diagram Alur Status SPK

```
        (DRAFT)
           │
           ▼
      (SCHEDULED) ────────────► (CANCELLED)
           │
           ▼
       (ASSIGNED) ────────────► (CANCELLED)
           │
           ▼
      (ON_THE_WAY) ───────────► (CANCELLED)
           │
           ▼
      (IN_PROGRESS) ──────────► (FOLLOW_UP_REQUIRED)
           │                          │
           │                          ▼
           │                   (Jadwal Ulang)
           ▼
      (COMPLETED)
```
