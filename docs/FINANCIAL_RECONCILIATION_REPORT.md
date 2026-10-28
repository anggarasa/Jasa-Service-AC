# Financial Reconciliation & Billing Integrity Assessment
**Project**: TampilKit Studio — AC Service Booking System  
**Edition**: Basic Field Service (CoolCare AC Service)  
**Date**: 2026-10-28  

---

## 1. Prinsip & Invarian Keuangan

Sistem mematuhi aturan integritas keuangan yang ketat:
1. **WorkOrder COMPLETED $\neq$ Invoice PAID**: Penyelesaian pekerjaan fisik oleh teknisi lapangan tidak pernah secara otomatis menganggap tagihan telah lunas.
2. **Invoice Grand Total $\neq$ Verified Received Money**: Total nominal faktur adalah piutang yang ditagihkan (*Billed Amount*), sedangkan kas nyata dihitung murni dari pembayaran yang telah diverifikasi kasir/admin (*Verified Received Cash*).
3. **Payment PENDING_VERIFICATION $\neq$ Payment VERIFIED**: Bukti transfer atau klaim bayar di tempat tidak dihitung sebagai kas masuk sebelum verifikasi fisik/mutasi bank dilakukan.
4. **Estimasi Awal Immutable**: Nilai estimasi reservasi pelanggan (`Booking.estimatedTotal`) bersifat kekal untuk menjaga riwayat perbandingan estimasi vs realisasi.

---

## 2. Rumus Rekonsiliasi Matematis Deterministik

Dalam basis data PostgreSQL:
$$\text{grandTotal} = \text{subtotal} - \text{discountTotal} + \text{taxTotal}$$
$$\text{verifiedPaidTotal} = \sum (\text{Payment.amount} \mid \text{status} = \text{'VERIFIED'})$$
$$\text{outstandingBalance} = \text{grandTotal} - \text{verifiedPaidTotal}$$

Transisi status faktur dihitung secara eksak matematis:
- Jika $\text{verifiedPaidTotal} = 0 \rightarrow \text{status} = \text{'ISSUED'}$
- Jika $0 < \text{verifiedPaidTotal} < \text{grandTotal} \rightarrow \text{status} = \text{'PARTIALLY\_PAID'}$
- Jika $\text{outstandingBalance} = 0 \rightarrow \text{status} = \text{'PAID'}$ (Lunas)

---

## 3. Hasil Pengujian Rekonsiliasi Otomatis (E2E)

Pengujian pada `billing-invoices-payments.e2e-spec.ts` dan `full-customer-to-payment-lifecycle.e2e-spec.ts` memverifikasi skenario nyata:

| Langkah Pengujian Finansial | Input / Aksi | Kondisi Saldo Faktur | Status Faktur | Status Pengujian |
|---|---|---|---|---|
| **Penerbitan Faktur** | Grand Total: Rp 250.000 | Paid: Rp 0, Sisa: Rp 250.000 | `ISSUED` | **PASS** |
| **Uji Freeze Invariant** | Mencoba ubah biaya SPK | Ditolak HTTP 403 Forbidden | Tetap Rp 250.000 | **PASS** |
| **Uji Anti-Overpayment** | Input bayar Rp 500.000 | Ditolak HTTP 400 Bad Request | Tidak ada mutasi | **PASS** |
| **Pembayaran Parsial 1** | Setor Tunai: Rp 100.000 | Paid: Rp 100.000, Sisa: Rp 150.000 | `PARTIALLY_PAID` | **PASS** |
| **Pelunasan Transfer 2** | Transfer Bank: Rp 150.000 | Paid: Rp 250.000, Sisa: Rp 0 | `PAID` (Lunas) | **PASS** |
| **Penerbitan Kuitansi** | Pembayaran 2 terverifikasi | Nomor Kuitansi `REC-YYYYMM-XXXXX` | Diterbitkan | **PASS** |
| **Uji Anti-Void** | Mencoba batalkan faktur lunas | Ditolak HTTP 400 Bad Request | Tidak dapat di-void | **PASS** |
| **Ekspor CSV Laporan** | Mengunduh laporan keuangan | Karakter formula diproteksi `'` | Sanitasi CWE-1236 | **PASS** |

---

## 4. Format Dokumen Finansial
- **Faktur Penagihan Resmi**: Format nomor `INV-YYYYMM-XXXXX` (contoh: `INV-202610-00001`). Dilengkapi rincian biaya pengerjaan, biaya penambahan jasa/freon, material, dan instruksi rekening bank tujuan.
- **Kuitansi Pembayaran**: Format nomor `REC-YYYYMM-XXXXX` (contoh: `REC-202610-00001`). Memuat referensi transaksi, metode pembayaran, nama penyetor, dan nama verifikator kasir.
- **PDF Generator**: Dibuat menggunakan pustaka `pdfkit` dengan format A4 rapi, logo bisnis, kop surat resmi, dan rincian lengkap dalam Bahasa Indonesia.
