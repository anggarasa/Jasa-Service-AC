# Manajemen Faktur & Penagihan (Invoice Management)

## 1. Arsitektur & Siklus Hidup Faktur
Faktur (`Invoice`) adalah dokumen komersial dan penagihan resmi yang diterbitkan berdasarkan Surat Perintah Kerja (SPK) yang telah disepakati atau diselesaikan.

### Status Siklus Hidup Faktur:
- `DRAFT`: Draf faktur baru dibentuk, item tagihan disalin menjadi snapshot, namun faktur belum resmi mengikat atau ditagihkan ke pelanggan.
- `ISSUED`: Faktur diterbitkan secara resmi dengan tanggal jatuh tempo (`dueAt`, default 7 hari). Seluruh baris tagihan (`InvoiceItem`) dibekukan secara permanen.
- `PARTIALLY_PAID`: Faktur telah menerima sebagian pembayaran yang telah diverifikasi oleh kasir, namun masih memiliki saldo sisa tagihan (`outstandingBalance > 0`).
- `PAID`: Faktur lunas penuh setelah seluruh pembayaran yang diverifikasi sama dengan `grandTotal` (`outstandingBalance = 0`).
- `VOID`: Faktur dibatalkan dengan pencatatan alasan resmi (`voidReason`). Hanya diizinkan jika faktur tidak memiliki pembayaran yang berstatus terverifikasi.

---

## 2. Format Penomoran Faktur Resmi
Nomor faktur mengadopsi pola standar akuntansi Indonesia:
$$\text{INV-YYYYMM-XXXXX}$$
Contoh: `INV-202610-00001`
- `INV`: Prefiks dokumen faktur tagihan.
- `YYYYMM`: Tahun dan bulan penerbitan (contoh: Oktober 2026 = `202610`).
- `XXXXX`: Nomor urut sekuensial 5 digit dengan zero-padding per entitas bisnis.

---

## 3. Snapshot Baris Tagihan (InvoiceItem)
Saat faktur diterbitkan, rincian biaya disalin ke tabel `InvoiceItem`:
- `lineType`: `VISIT_FEE`, `SERVICE_ITEM`, `ADDITIONAL_LABOR`, `MATERIAL`.
- `descriptionSnapshot`: Deskripsi teks beku pada saat penerbitan faktur.
- `quantity`: Kuantitas beku.
- `unitPrice`: Harga satuan beku.
- `lineTotal`: Nilai total baris beku.

Snapshot ini memastikan perubahan master harga atau katalog layanan di masa depan tidak akan memengaruhi laporan keuangan transaksi lama.
