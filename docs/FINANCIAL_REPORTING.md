# Laporan Keuangan, Arus Kas & Ekspor CSV Aman (Financial Reporting)

## 1. Pemisahan KPI Billed vs Verified Received
Prinsip utama laporan keuangan CoolCare AC Service adalah memisahkan dengan tegas antara:
1. **Pendapatan yang Ditagihkan (Total Invoiced / Billed)**:
   Jumlah seluruh nilai `grandTotal` dari faktur yang berstatus `ISSUED`, `PARTIALLY_PAID`, dan `PAID` dalam periode terkait.
2. **Kas Riil Terverifikasi (Total Verified Revenue / Received)**:
   Total dana yang benar-benar telah divalidasi masuk ke rekening bank atau diterima kasir (`Payment.status = 'VERIFIED'`).
3. **Piutang Belum Tertagih (Outstanding Receivables)**:
   Selisih saldo tagihan yang masih harus dibayarkan pelanggan (`Invoice.outstandingBalance`).
4. **Volume Menunggu Verifikasi (Pending Verification)**:
   Klaim pembayaran dari teknisi atau pelanggan yang belum dicek oleh bagian keuangan.

---

## 2. Distribusi Metode Pembayaran
Laporan menyajikan agregasi frekuensi dan volume rupiah per metode bayar:
- `CASH`: Total transaksi dan nilai uang tunai.
- `BANK_TRANSFER`: Total transaksi dan nilai transfer bank.
- `EXTERNAL_QRIS`: Total transaksi dan nilai QRIS toko.
- `OTHER_MANUAL`: Total pembayaran alternatif.

---

## 3. Ekspor CSV dengan Perlindungan Formula Injection (CWE-1236)
Ekspor data ke file CSV (`GET /api/v1/admin/reports/export`) dilindungi secara ketat oleh `CsvExportService`:
- Setiap nilai sel yang diawali dengan karakter pengeksekusi formula spreadsheet (`=`, `+`, `-`, `@`, `\t`, `\r`) secara otomatis diprefiks tanda petik tunggal (`'`).
- Tanda kutip ganda dan karakter koma di-escape dengan standar RFC-4180.
- Melindungi staf admin dari serangan eksekusi perintah arbitrer saat membuka CSV di Microsoft Excel atau Google Sheets.
