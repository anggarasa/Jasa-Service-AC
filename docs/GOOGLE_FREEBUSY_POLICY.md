# Kebijakan FreeBusy & Fail-Closed Availability (CoolCare AC)

Dokumen ini menjelaskan integrasi data waktu sibuk Google Calendar (FreeBusy) dengan Availability Engine CoolCare.

---

## 1. Klasifikasi Interval Waktu

Dalam sistem kalender, interval waktu diklasifikasikan ke dalam 2 kategori:

| Kategori | Asal Sumber | Properti Penanda | Perilaku terhadap Jadwal |
|---|---|---|---|
| `MANAGED_BOOKING` | Diproyeksikan otomatis oleh CoolCare | `source = 'TampilKit-AC'` | **Tidak memblokir slot teknisi lain**. Beban teknisi dihitung secara akurat lewat tabel `ResourceOccupancy` PostgreSQL. |
| `EXTERNAL_BUSY` | Dibuat manual di Google Calendar oleh admin/pemilik | Tidak ada metadata `TampilKit-AC` | **Memblokir seluruh teknisi**. Diperlakukan sebagai penutupan sementara atau kesibukan bersama seluruh armada teknisi. |

---

## 2. Kebijakan Ketersediaan Tertutup (Fail-Closed Availability Policy)

Untuk mencegah pemesanan ganda (overbooking) ketika terjadi gangguan koneksi atau token kedaluwarsa:

1. **Status `REAUTH_REQUIRED`**:
   - Jika refresh token kedaluwarsa atau dicabut oleh pemilik akun Google, koneksi masuk ke status `REAUTH_REQUIRED`.
   - `GoogleFreeBusyService` menandai bendera `isFailClosed = true`.
   - `AvailabilityService` secara otomatis **menolak pembukaan slot publik baru** (`slots: []`) untuk mencegah jadwal baru masuk tanpa validasi kalender Google.
   - Pemesanan yang sudah ada di database tetap aman dan tidak dihapus.
2. **Koneksi `DISCONNECTED`**:
   - Jika bisnis sengaja memutuskan integrasi atau belum menghubungkan akun Google, sistem berjalan dalam mode otonom murni mengandalkan database PostgreSQL lokal tanpa memicu fail-closed.
