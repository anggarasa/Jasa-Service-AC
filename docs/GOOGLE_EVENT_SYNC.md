# Siklus Sinkronisasi Event Google Calendar (CoolCare AC)

Dokumen ini mendokumentasikan pemetaan status pemesanan lokal ke siklus hidup event Google Calendar.

---

## 1. Pemetaan Siklus Hidup Transaksi

| Kejadian Lokal di CoolCare | Status Pemesanan | Operasi Outbox | Efek di Google Calendar |
|---|---|---|---|
| Admin mengonfirmasi pesanan | `CONFIRMED` | `CREATE_EVENT` | Event baru dibuat di kalender terpilih. ID event Google dicatat ke `CalendarEventMapping`. |
| Admin membuat pesanan manual | `CONFIRMED` / `ASSIGNED` | `CREATE_EVENT` | Event langsung dibuat di Google Calendar. |
| Admin menugaskan teknisi | `ASSIGNED` | `UPDATE_EVENT` | Deskripsi dan ringkasan event diperbarui memuat nama teknisi & nomor kontak. |
| Admin menjadwalkan ulang | `RESCHEDULED` | `UPDATE_EVENT` | Rentang waktu `start.dateTime` dan `end.dateTime` event diperbarui. |
| Admin / Pelanggan membatalkan | `CANCELLED` | `DELETE_EVENT` | Event dihapus dari Google Calendar, status mapping diubah menjadi `DELETED`. |

---

## 2. Struktur Format Event Google Calendar

Setiap event pemesanan diformat dengan standar profesional:

- **Summary (Judul)**:
  - Format: `[CoolCare AC] {Service Name} - {Booking Code} ({Customer Name})`
  - Contoh: `[CoolCare AC] Cuci AC Split 1 PK - CC-20261028-001 (Bpk. Hendra)`
- **Description (Deskripsi)**:
  - Memuat rincian terstruktur:
    - Kode Pemesanan & Status
    - Data Pelanggan (Nama, Telepon, Alamat Lengkap)
    - Teknisi Penanggung Jawab
    - Catatan Khusus Pelanggan
    - Tautan Cepat ke Dashboard Manajemen CoolCare
- **Metadata Privat (`extendedProperties.private`)**:
  - `source`: `"TampilKit-AC"`
  - `bookingId`: UUID pemesanan di PostgreSQL
  - `businessId`: UUID bisnis pemilik
  - `aggregateVersion`: Nomor versi transaksi untuk mencegah *stale overwrite*.
