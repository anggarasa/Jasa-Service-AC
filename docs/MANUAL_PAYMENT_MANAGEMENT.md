# Manajemen Penerimaan Pembayaran Manual di Lapangan & Transfer

## 1. Lingkup & Batasan Desain
TampilKit Basic Field Service edisi ini dirancang khusus untuk operasional **pembayaran manual dan on-site**, tanpa ketergantungan otomatis pada gateway pembayaran pihak ketiga (seperti Midtrans/Xendit) yang memotong komisi transaksi atau memerlukan koneksi API eksternal yang kompleks.

Metode pembayaran yang didukung:
1. `CASH`: Uang tunai yang diserahkan pelanggan langsung kepada teknisi di lokasi.
2. `BANK_TRANSFER`: Transfer manual melalui m-Banking / ATM ke rekening bank resmi CoolCare AC.
3. `EXTERNAL_QRIS`: Pembayaran menggunakan QRIS statis toko/bisnis yang dipindai pelanggan.
4. `OTHER_MANUAL`: Pembayaran manual lainnya dengan dokumentasi catatan.

---

## 2. Model Data Pembayaran (Payment)
Setiap transaksi pembayaran dicatat dengan atribut:
- `paymentReference`: Nomor referensi unik sistem, berformat `PAY-YYYYMM-XXXXX`.
- `invoiceId`: Relasi ke faktur yang ditagih.
- `method`: Pilihan metode (`CASH`, `BANK_TRANSFER`, `EXTERNAL_QRIS`, `OTHER_MANUAL`).
- `amount`: Nominal pembayaran (desimal, wajib positif dan $\le$ sisa tagihan).
- `status`: Status verifikasi (`PENDING_VERIFICATION`, `VERIFIED`, `REJECTED`, `VOID`).
- `paidAtClaimed`: Waktu pelanggan mengklaim telah membayar.
- `recordedAt`: Waktu pembayaran dicatat ke dalam database.
- `recordedByUserId`: Pengguna (teknisi atau admin) yang mencatat pembayaran.
- `proofMediaId`: Relasi ke media asset bukti transfer atau kuitansi fisik di MinIO (`payments/proofs/`).
- `idempotencyKeyHash`: Hash SHA-256 dari kunci idempotensi klien untuk mencegah pembayaran ganda saat koneksi jaringan terputus-putus.

---

## 3. Perlindungan Kelebihan Bayar (Overpayment Protection)
Sistem menerapkan validasi ketat:
$$\text{paymentAmount} \le \text{outstandingBalance}$$
Jika nominal pembayaran yang dimasukkan melebihi sisa tagihan faktur, API secara otomatis menolak permintaan dengan status `400 Bad Request`.
