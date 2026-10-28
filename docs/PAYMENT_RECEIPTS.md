# Penerbitan Kuitansi Resmi (Payment Receipts)

## 1. Aturan Penerbitan Kuitansi
Kuitansi (`PaymentReceipt`) adalah bukti penerimaan uang yang sah secara hukum:
1. **Hanya Diterbitkan Setelah Verifikasi**: Kuitansi tidak akan pernah dibentuk untuk transaksi yang masih berstatus `PENDING_VERIFICATION` atau `REJECTED`.
2. **Keterikatan 1-ke-1**: Setiap rekaman pembayaran terverifikasi memiliki tepat satu relasi dengan `PaymentReceipt`.
3. **Format Nomor Kuitansi**:
   $$\text{REC-YYYYMM-XXXXX}$$
   Contoh: `REC-202610-00001`

---

## 2. Format & Isi Dokumen PDF Kuitansi
Dokumen PDF kuitansi dihasilkan langsung secara dinamis menggunakan engine `pdfkit` melalui endpoint `GET /api/v1/admin/payments/:id/receipt-pdf`.

Komponen dokumen meliputi:
- Identitas Resmi CoolCare AC Service (Nama Bisnis, Alamat, Nomor Telepon, Email).
- Judul Dokumen: "KUITANSI PEMBAYARAN RESMI".
- Nomor Kuitansi & Nomor Referensi Pembayaran Sistem.
- Nama Pembayar ("Telah Diterima Dari: ...").
- Peruntukan Pembayaran ("Untuk Pembayaran Faktur: ...").
- Metode Pembayaran & Tanggal Verifikasi.
- Kotak Nominal Terbilang dan Angka Rupiah resmi.
- Ruang Tanda Tangan Kasir / Bagian Keuangan.
- Catatan hukum keabsahan dokumen.
