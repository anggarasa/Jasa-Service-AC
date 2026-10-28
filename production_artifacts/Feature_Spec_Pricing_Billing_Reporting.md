# Spesifikasi Fitur Phase 11 — Final Service Pricing, Billing, On-Site Payment & Operational Reporting

**Dokumen**: `production_artifacts/Feature_Spec_Pricing_Billing_Reporting.md`  
**Peran**: Lead Architect & Product Manager (`@pm`)  
**Tanggal**: 28 Oktober 2026  
**Status**: Disetujui untuk Implementasi  

---

## 1. Latar Belakang & Tujuan Bisnis

Setelah pekerjaan fisik di lapangan diselesaikan oleh teknisi (Phase 09) dan jadwal terintegrasi dengan Google Calendar (Phase 10), CoolCare AC membutuhkan sistem penagihan (*billing*) dan penyelesaian finansial (*settlement*) yang akurat, terpisah dari domain pemesanan (*Booking*) dan surat perintah kerja (*WorkOrder*).

Tujuan utama Phase 11:
1. **Pemisahan Domain Finansial**: Membedakan secara tegas antara Booking (estimasi awal), WorkOrder (eksekusi riil), Invoice (kewajiban tagihan resmi), dan Payment (uang yang dilaporkan/diterima).
2. **Kalkulasi Biaya Riil (Actual Pricing)**: Mendukung penetapan tarif akhir, mencakup layanan pokok, biaya visit, tenaga kerja tambahan (*additional labor*), suku cadang/material (*materials & parts*), potongan harga (*discount*), dan pajak terkonfigurasi.
3. **Persetujuan Biaya Tambahan (Charge Approval Workflow)**: Biaya tambahan yang melampaui estimasi awal wajib disetujui pelanggan dengan bukti otentik (tatap muka atau unggahan bukti persetujuan di MinIO).
4. **Penerbitan Faktur (Invoice Issuance)**: Penomoran faktur unik sekuensial (format `INV-YYYYMM-XXXXX`), status faktur (*DRAFT, ISSUED, PARTIALLY_PAID, PAID, VOID*), serta perlindungan baris tagihan beku (*frozen lines*).
5. **Pencatatan Pembayaran Manual di Tempat (On-Site Payment)**: Mendukung metode pembayaran Tunai (*CASH*), Transfer Bank (*BANK_TRANSFER*), QRIS Eksternal (*EXTERNAL_QRIS*), dan manual lainnya.
6. **Verifikasi Pembayaran & Pembayaran Bertahap (Partial Payments)**:
   - Tunai dapat diverifikasi oleh staf berwenang.
   - Transfer/QRIS berstatus `PENDING_VERIFICATION` sampai diverifikasi oleh `OWNER` terhadap rekening bank dengan bukti mutasi di MinIO.
   - Pelunasan bertahap menghitung sisa tagihan (*outstanding balance*) secara transaksional di PostgreSQL.
7. **Kuitansi Resmi (Receipt) & Berkas PDF**: Pembuatan kuitansi untuk setiap pembayaran terverifikasi dan pembuatan berkas PDF untuk faktur dan kuitansi.
8. **Pelaporan Operasional & Keuangan**: Dashboard analitik terpadu (`/dashboard/reports`) yang memisahkan jumlah yang ditagihkan (*billed total*) dari kas yang terverifikasi diterima (*verified received*), disertai ekspor CSV aman anti-formula injection.

---

## 2. Invarian & Prinsip Kunci

1. **WorkOrder COMPLETED ≠ Invoice PAID**: Status pengerjaan teknisi selesai tidak berarti pelanggan telah melunasi tagihan.
2. **Estimasi Awal Imutabel**: Nilai `estimatedTotal` dan `visitFeeSnapshot` dari Phase 07 tidak pernah di-overwrite oleh penagihan akhir.
3. **Presisi Finansial**: Menggunakan tipe data `Decimal` (PostgreSQL `NUMERIC(12,2)`) dan representasi string desimal dalam JSON. Tidak menggunakan operasi floating-point JavaScript yang rentan pembulatan.
4. **Idempotensi & Anti-Double Invoicing**: Satu WorkOrder hanya dapat memiliki satu Faktur aktif primer. Dua request penerbitan simultan tidak boleh menghasilkan dua faktur berbeda.
5. **Anti-Overpayment**: Pembayaran tidak boleh melebihi sisa tagihan yang belum terbayar dalam transaksi konkurensi.
6. **Privasi Bukti Pembayaran**: Berkas bukti transfer disimpan di MinIO privat (`PAYMENT_PROOF`) dan hanya dapat diakses oleh peran berwenang.
7. **Ketidaktergantungan Google Calendar**: Seluruh operasional finansial dan pelaporan tetap berfungsi penuh bahkan jika koneksi Google Calendar sedang luring (*offline*).

---

## 3. Rencana Arsitektur & Perubahan Database (Prisma)

### Model Baru:
1. `WorkOrderCharge`: Baris penetapan harga akhir (tipe: `SERVICE`, `VISIT_FEE`, `ADDITIONAL_LABOR`, `ADDITIONAL_SERVICE`, `MATERIAL`, `DISCOUNT`, `TAX`).
2. `WorkOrderMaterial`: Dokumentasi pemakaian suku cadang/material di lapangan.
3. `ServiceChargeApproval`: Jejak persetujuan pelanggan atas biaya tambahan dengan bukti provenance.
4. `Invoice`: Dokumen faktur resmi.
5. `InvoiceItem`: Salinan baris tagihan yang dibekukan saat faktur diterbitkan.
6. `Payment`: Transaksi pembayaran dengan status verifikasi.
7. `PaymentReceipt`: Bukti penerimaan pembayaran sah bernomor unik (`REC-YYYYMM-XXXXX`).
8. `FinancialAuditLog`: Buku catatan audit mutasi keuangan (*append-only*).

---

## 4. Antarmuka Pengguna (Next.js)

1. `/dashboard/work-orders/[id]/pricing`: Panel kalkulasi harga riil, perbandingan estimasi vs aktual, dan rekaman persetujuan biaya.
2. `/dashboard/invoices`: Daftar faktur dengan filter tanggal, status, pelanggan, dan pencarian.
3. `/dashboard/invoices/[id]`: Rincian faktur, rincian pembayaran, tombol terbitkan, batalkan (*void*), unduh PDF, dan catat pembayaran.
4. `/dashboard/payments`: Monitoring pembayaran masuk dan antrean verifikasi kasir/owner.
5. `/technician/jobs/[id]/payment`: Form pencatatan tagihan di lokasi oleh teknisi lapangan (tanpa hak verifikasi sepihak).
6. `/booking/manage`: Ringkasan tagihan aman untuk pelanggan dengan token kapabilitas.
7. `/dashboard/reports`: Laporan operasional & finansial dengan visualisasi KPI, grafik tren, dan unduh CSV.
