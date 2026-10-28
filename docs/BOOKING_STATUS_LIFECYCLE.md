# Booking Status Lifecycle — CoolCare AC Service

Dokumen ini memetakan diagram status transisi (*state machine*) reservasi servis AC CoolCare AC Service.

---

## 1. Status Enumeration (`BookingStatus`)

- `PENDING`: Pemesanan baru dibuat, menunggu verifikasi jadwal & ketersediaan teknisi oleh operator.
- `CONFIRMED`: Jadwal dan pesanan telah dikonfirmasi oleh admin/operator.
- `ASSIGNED`: Teknisi lapangan telah ditugaskan secara resmi dan jadwal tercatat pada kalender teknisi.
- `IN_PROGRESS`: Teknisi telah tiba di lokasi dan pekerjaan servis AC sedang berlangsung.
- `COMPLETED`: Seluruh pekerjaan servis selesai, tagihan telah diselesaikan, dan unit AC telah dites dingin.
- `CANCELLED`: Pemesanan dibatalkan atas permintaan pelanggan atau kebijakan operasional.
- `REJECTED`: Pemesanan ditolak oleh admin (misalnya: di luar jangkauan operasional, slot penuh tidak terjadwal).
- `EXPIRED`: Pemesanan pending yang melewati batas waktu hold tanpa konfirmasi.
- `NO_SHOW`: Pelanggan tidak dapat dihubungi atau tidak ada di tempat saat teknisi tiba di lokasi.

---

## 2. Diagram Transisi Status

```
   [Pelanggan / Admin Input]
               │
               ▼
           (PENDING) ───────────► (REJECTED)
            │      │
            │      └────────────► (EXPIRED)
            │
      [Konfirmasi]
            │
            ▼
       (CONFIRMED) ─────────────► (CANCELLED)
            │
      [Tugaskan Teknisi]
            │
            ▼
        (ASSIGNED) ─────────────► (CANCELLED)
            │
      [Mulai Pengerjaan]
            │
            ▼
       (IN_PROGRESS) ───────────► (CANCELLED / NO_SHOW)
            │
      [Selesai & Bayar]
            │
            ▼
       (COMPLETED)
```

---

## 3. Matriks Transisi yang Diizinkan

| Dari Status | Beralih Ke | Pemicu (Trigger) |
| :--- | :--- | :--- |
| `PENDING` | `CONFIRMED` | Admin menyetujui pemesanan tanpa memilih teknisi langsung |
| `PENDING` | `ASSIGNED` | Admin menyetujui pemesanan sekaligus memilih teknisi |
| `PENDING` | `REJECTED` | Admin menolak pemesanan dengan alasan tertentu |
| `PENDING` | `CANCELLED` | Pelanggan atau admin membatalkan sebelum konfirmasi |
| `CONFIRMED` | `ASSIGNED` | Admin mengalokasikan teknisi lapangan |
| `CONFIRMED` | `CANCELLED` | Pembatalan pemesanan |
| `CONFIRMED` | `REJECTED` | Pembatalan administratif sebelum pengerjaan |
| `ASSIGNED` | `IN_PROGRESS` | Teknisi / Admin menandai dimulainya servis di lokasi |
| `ASSIGNED` | `CANCELLED` | Pembatalan pemesanan (melepaskan teknisi & membatalkan SPK) |
| `IN_PROGRESS` | `COMPLETED` | Pekerjaan selesai dan SPK dinyatakan selesai |
| `IN_PROGRESS` | `CANCELLED` | Pembatalan khusus di lapangan |
