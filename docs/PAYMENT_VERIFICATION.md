# Alur Kerja Verifikasi Pembayaran (Payment Verification)

## 1. Antrean & Pemisahan Wewenang (Segregation of Duties)
Untuk mencegah penggelapan kas (cash skimming) atau penerimaan bukti transfer palsu:
- **Teknisi di Lapangan**: Hanya berwenang merekam klaim pembayaran (`PENDING_VERIFICATION`) dan mengunggah foto bukti.
- **Kasir / Admin Keuangan / Owner**: Memiliki hak akses eksklusif (`Roles(OWNER, ADMIN)`) untuk memvalidasi mutasi bank atau penerimaan setoran kas fisik sebelum menandai status pembayaran sebagai `VERIFIED`.

---

## 2. Prosedur Verifikasi
Ketika endpoint `POST /api/v1/admin/payments/:id/verify` dipanggil:
1. Sistem membuka transaksi database atomik dengan penguncian baris (`tx`).
2. Melakukan verifikasi ulang terhadap status faktur (tidak boleh `VOID`).
3. Memastikan bahwa penjumlahan nominal pembayaran dengan total terbayar saat ini tidak melebihi `grandTotal`:
   $$\text{verifiedPaidTotal} + \text{amount} \le \text{grandTotal}$$
4. Mengubah status pembayaran menjadi `VERIFIED`, mengisi `verifiedAt` dan `verifiedByUserId`.
5. Menerbitkan kuitansi resmi (`PaymentReceipt`) dengan nomor seri `REC-YYYYMM-XXXXX`.
6. Menghitung ulang saldo faktur (`verifiedPaidTotal` dan `outstandingBalance`).
7. Jika `outstandingBalance` bernilai 0, status faktur bertransisi otomatis menjadi `PAID`.
8. Jika `outstandingBalance` masih lebih dari 0, status faktur menjadi `PARTIALLY_PAID`.
9. Mencatat entri riwayat pada `FinancialAuditLog`.

---

## 3. Penolakan Pembayaran
Jika bukti transfer tidak valid atau uang kas tidak diserahkan:
- Admin memanggil `POST /api/v1/admin/payments/:id/reject` dengan parameter `rejectionReason` wajib.
- Pembayaran bertransisi menjadi `REJECTED`, saldo faktur tidak berkurang, dan alasan penolakan tersimpan di audit trail.
