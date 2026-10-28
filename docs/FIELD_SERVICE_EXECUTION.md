# Dokumen Spesifikasi: Field Service Execution & State Machine

## 1. Alur Transisi Status Surat Perintah Kerja (SPK)

State machine SPK teknisi berjalan berurutan dengan validasi logis ketat:

```
[ASSIGNED]
   │
   ├── (Teknisi mulai perjalanan) ──> [ON_THE_WAY]
   │                                     │
   │                                     ├── (Teknisi check-in tiba) ──> [ARRIVED]
   │                                     │                                  │
   │                                     │                                  ├── (Mulai pengerjaan) ──> [IN_PROGRESS]
   │                                     │                                  │                             │
   │                                     │                                  │                             ├── (Semua validasi gate lolos) ──> [COMPLETED]
   │                                     │                                  │                             │
   │                                     │                                  │                             └── (Ada kendala/sparepart) ────> [FOLLOW_UP_REQUIRED]
```

## 2. Rincian Titik Transisi

### A. Mulai Perjalanan (`POST /technician/work-orders/:id/start-journey`)
- **Syarat**: Status SPK adalah `ASSIGNED`.
- **Dampak**: Status berubah menjadi `ON_THE_WAY`. Riwayat status dicatat.

### B. Check-in Kedatangan (`POST /technician/work-orders/:id/arrive`)
- **Syarat**: Status SPK adalah `ON_THE_WAY` atau `ASSIGNED`.
- **Dampak**: 
  - Status berubah menjadi `ARRIVED`.
  - Waktu `arrivedAt` dicatat secara presisi di server.
  - Catatan kedatangan teknisi dan koordinat GPS opsional disimpan ke riwayat.

### C. Mulai Pengerjaan (`POST /technician/work-orders/:id/start`)
- **Syarat**: Status SPK adalah `ARRIVED` (atau transisi langsung dari perjalanan).
- **Dampak**:
  - Status berubah menjadi `IN_PROGRESS`.
  - Waktu `startedAt` dicatat.
  - Pemesanan (`Booking`) yang terhubung disinkronkan menjadi `IN_PROGRESS`.

### D. Pengajuan Kunjungan Lanjutan (`POST /technician/work-orders/:id/follow-up`)
- **Syarat**: Status SPK adalah `IN_PROGRESS` atau `ARRIVED`.
- **Input Wajib**: Alasan tindak lanjut (`reason` min 3 karakter, maks 500) dan catatan teknis (`notes`).
- **Dampak**: Status SPK berubah menjadi `FOLLOW_UP_REQUIRED`, tercatat alasan dan catatan suku cadang.

### E. Penyelesaian SPK (`POST /technician/work-orders/:id/complete`)
- **Syarat**: Status SPK harus `IN_PROGRESS` dan memenuhi seluruh **Validation Gate**.
- **Dampak**:
  - Status SPK berubah menjadi `COMPLETED` dengan timestamp `completedAt`.
  - Pemesanan (`Booking`) terkait otomatis disinkronkan ke status `COMPLETED`.
  - Riwayat status dan audit log pemesanan dibuat otomatis.

## 3. Integrasi Pintas Lapangan
- **Telepon**: Tautan langsung dengan skema `tel:<nomor_hp>` untuk panggilan suara cepat.
- **WhatsApp**: Prefilled message otomatis dengan nomor telepon pelanggan yang dinormalisasi (`https://wa.me/<normalized_phone>?text=...`).
- **Navigasi Peta**: Tautan langsung Google Maps Search & Directions (`https://www.google.com/maps/search/?api=1&query=...`).
