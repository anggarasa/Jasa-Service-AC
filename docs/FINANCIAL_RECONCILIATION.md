# Rekonsiliasi Finansial & Audit Trail (Financial Reconciliation)

## 1. Konsep Rekonsiliasi Saldo
Sistem menerapkan kalkulasi saldo deterministik berbasis event:
- Setiap pembayaran yang terverifikasi menambah `verifiedPaidTotal` faktur secara atomik.
- `outstandingBalance` dihitung ulang sebagai $\max(0, \text{grandTotal} - \text{verifiedPaidTotal})$.
- Status faktur tidak diubah secara manual, melainkan turunan langsung dari kalkulasi saldo tersebut.

---

## 2. Append-Only Financial Audit Log
Seluruh kejadian keuangan dicatat secara permanen pada model `FinancialAuditLog`:
- `businessId`: Entitas pemilik data transaksi.
- `aggregateType`: Tipe entitas (`INVOICE`, `PAYMENT`, `WORK_ORDER`).
- `aggregateId`: ID unik entitas target.
- `action`: Tindakan yang dieksekusi (`DRAFT_INVOICE_CREATED`, `INVOICE_ISSUED`, `INVOICE_VOIDED`, `PAYMENT_RECORDED`, `PAYMENT_VERIFIED`, `PAYMENT_REJECTED`, `CHARGE_APPROVED`).
- `performedByUserId`: ID pengguna penanggung jawab tindakan.
- `previousState`: Snapshot keadaan data sebelum mutasi.
- `newState`: Snapshot keadaan data setelah mutasi.
- `metadata`: Informasi kontekstual tambahan (misalnya alasan pembatalan atau nomor transaksi bank).
- `createdAt`: Waktu kejadian pencatatan (UTC/ISO-8601).

Log ini bersifat append-only: tidak ada API yang mengizinkan pembaruan atau penghapusan data log audit keuangan.
