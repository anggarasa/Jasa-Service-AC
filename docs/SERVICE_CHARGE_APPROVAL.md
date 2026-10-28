# Alur Kerja Persetujuan Biaya Tambahan (Service Charge Approval)

## 1. Latar Belakang & Kebutuhan Regulasi Lapangan
Sesuai standar operasional CoolCare AC Service, setiap biaya tambahan yang melebihi estimasi awal pemesanan **wajib mendapatkan persetujuan eksplisit dari pelanggan sebelum tindakan dilakukan**.

Hal ini mencegah sengketa biaya (billing dispute) saat teknisi menagih pembayaran di akhir pekerjaan.

---

## 2. Model ServiceChargeApproval
Setiap persetujuan dicatat dengan provenance yang jelas:
- `workOrderId`: Relasi ke SPK terkait.
- `pricingVersion`: Versi kenaikan kalkulasi biaya (dimulai dari versi 1).
- `proposedTotal`: Total biaya yang diajukan oleh teknisi/admin.
- `approvedTotal`: Total biaya yang disepakati pelanggan.
- `status`: Status persetujuan (`DRAFT`, `APPROVED`, `REJECTED`).
- `approvalMethod`: Metode konfirmasi pelanggan:
  - `IN_PERSON`: Konfirmasi lisan langsung kepada teknisi di rumah/kantor.
  - `VERBAL_PHONE`: Konfirmasi melalui panggilan suara/telepon.
  - `WHATSAPP_CHAT`: Konfirmasi tertulis melalui chat WhatsApp resmi.
  - `SIGNATURE_WRITTEN`: Tanda tangan fisik pada formulir kerja atau digital di aplikasi.
- `approvedByName`: Nama pelanggan atau perwakilan yang memberikan otorisasi.
- `approvedByContact`: Nomor telepon atau WhatsApp pihak yang menyetujui.
- `approvalEvidenceMediaId`: Relasi ke `MediaAsset` (kategori `APPROVAL_EVIDENCE`) yang tersimpan di bucket MinIO.
- `recordedByUserId`: ID teknisi atau admin yang merekam persetujuan.
- `approvedAt`: Timestamp persetujuan.

---

## 3. Efek Persetujuan terhadap Tagihan
Ketika persetujuan dicatat (`POST /admin/work-orders/:id/approvals` atau `/technician/work-orders/:id/approvals`):
1. Seluruh item `WorkOrderCharge` yang berstatus `DRAFT` secara otomatis dimutakhirkan menjadi `APPROVED`.
2. Versi kalkulasi harga (`pricingVersion`) dinaikkan secara berurutan.
3. Rekaman mutasi ditambahkan ke `FinancialAuditLog` secara permanen.
