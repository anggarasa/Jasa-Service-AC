# Estimasi Harga Pemesanan Servis AC

## 1. Aturan Kalkulasi Harga Server-Authoritative
Backend NestJS memegang kendali penuh atas kalkulasi harga. Klien tidak diizinkan mengirimkan harga sepihak.

| Tipe Harga (`PriceType`) | Metode Perhitungan | Nilai Estimasi Servis | Total Estimasi | Label UI |
|---|---|---|---|---|
| `FIXED` | $\text{basePrice} \times \text{unitCount}$ | Angka pasti | Servis + Ongkos Kunjungan | "Total Biaya" |
| `STARTING_FROM` | $\text{basePrice} \times \text{unitCount}$ | Estimasi batas bawah | Servis + Ongkos Kunjungan | "Estimasi Mulai Dari" |
| `INSPECTION_REQUIRED` | Unknown (biaya riil setelah dicek fisik) | `null` | `null` | "Perlu Pengecekan Fisik" |

---

## 2. Ongkos Kunjungan Wilayah (`visitFee`)
- Setiap wilayah operasional (`ServiceArea`) memiliki konfigurasi `visitFee` (misal: Jakarta Selatan Rp 0, Depok Rp 20.000, Bogor Rp 35.000).
- Ongkos kunjungan selalu ditampilkan terpisah dari biaya pengerjaan unit agar transparan bagi pelanggan.

---

## 3. Snapshot Data Historis Pemesanan
Perubahan harga layanan atau ongkos wilayah di masa depan tidak akan memengaruhi pemesanan yang sudah dibuat. Entitas `Booking` dan `BookingItem` menyimpan snapshot:
- `serviceNameSnapshot`
- `priceTypeSnapshot`
- `unitPriceSnapshot`
- `estimatedServicePrice`
- `visitFeeSnapshot`
- `estimatedTotal`
