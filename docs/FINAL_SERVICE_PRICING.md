# Kalkulasi Biaya Layanan Akhir (Final Service Pricing)

## 1. Ikhtisar & Prinsip Finansial
Dalam sistem operasional CoolCare AC Service, biaya pemesanan awal (`Booking`) bersifat estimasi indikatif. Saat teknisi bekerja di lokasi, kondisi riil unit AC (seperti kebocoran pipa, kerusakan kapasitor, kekurangan freon, atau medan kerja sulit di lantai tinggi) dapat menimbulkan biaya tenaga kerja tambahan atau penggunaan material/suku cadang.

Kalkulasi biaya layanan akhir memastikan:
1. **Imutabilitas Estimasi Awal**: Nilai `estimatedTotal`, `estimatedServicePrice`, dan `visitFeeSnapshot` pada model `Booking` tidak pernah diubah atau ditimpa oleh data pelaksanaan lapangan.
2. **Pencatatan Rinci (Itemized)**: Tenaga kerja tambahan dicatat di model `WorkOrderCharge`, sedangkan suku cadang dicatat di model `WorkOrderMaterial`.
3. **Penyimpanan Angka Presisi Tinggi**: Menggunakan tipe data PostgreSQL `Decimal(12, 2)` dan serialisasi string desimal di API contract untuk mencegah floating-point drift.
4. **Penguncian Faktur (Invoice Freezing)**: Begitu faktur resmi berstatus `ISSUED`, seluruh rincian kalkulasi biaya SPK dikunci dan tidak dapat diubah tanpa prosedur pembatalan (VOID) resmi.

---

## 2. Struktur Data Kalkulasi

### A. WorkOrderCharge
Model yang merekam biaya tenaga kerja atau biaya khusus di luar estimasi awal:
- `workOrderId`: Relasi ke SPK.
- `workOrderItemId`: Opsional, relasi ke unit AC tertentu yang dikerjakan.
- `lineType`: Tipe beban (`ADDITIONAL_LABOR`, `CUSTOM_CHARGE`, `EMERGENCY_FEE`).
- `description`: Uraian pengerjaan (contoh: "Bongkar pasang outdoor unit lantai 2").
- `quantity`: Jumlah satuan pekerjaan (desimal).
- `unitPrice`: Tarif per unit pekerjaan (desimal).
- `lineAmount`: Total baris (`quantity * unitPrice`).
- `status`: Status persetujuan (`DRAFT`, `APPROVED`, `REJECTED`).

### B. WorkOrderMaterial
Model yang merekam suku cadang atau konsumabel yang dipakai:
- `workOrderId`: Relasi ke SPK.
- `materialName`: Nama material (contoh: "Freon R32", "Kapasitor 35uF").
- `quantity`: Jumlah pemakaian.
- `unit`: Satuan (kg, pcs, meter, set).
- `unitPrice`: Harga jual per unit.
- `totalAmount`: Nilai total pemakaian material.
- `notes`: Catatan teknisi terkait penggunaan.

---

## 3. Rumus Kalkulasi Biaya Akhir
$$\text{Gross Subtotal} = \text{Visit Fee} + \text{Base Services} + \sum \text{Additional Charges} + \sum \text{Materials}$$
$$\text{Grand Total} = \text{Gross Subtotal} - \text{Discount} + \text{Tax}$$

Kalkulasi dilakukan secara otomatis dan transparan di `PricingService.getWorkOrderPricing(workOrderId)`.
