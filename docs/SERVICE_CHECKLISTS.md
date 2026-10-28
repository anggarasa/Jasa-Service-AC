# Dokumen Spesifikasi: Service Checklists & Quality Assurance

## 1. Arsitektur Snapshot Template Checklist
Untuk memastikan keutuhan data historis dan kepatuhan standar SOP, sistem memisahkan **Master Template Checklist** dengan **Item Checklist pada SPK**:

1. **`ServiceChecklistTemplate` & `ServiceChecklistTemplateItem`**:
   - Dikelola oleh Bisnis/Admin.
   - Dapat dikhususkan per `serviceId` atau berlaku global sebagai default bisnis.
   - Memiliki label, deskripsi panduan, indikator `isRequired`, dan urutan `displayOrder`.

2. **`WorkOrderChecklistItem` (Immutable Snapshot)**:
   - Saat SPK dibuka oleh teknisi, item checklist di-snapshot dari template aktif ke setiap `WorkOrderItem`.
   - Mengabadikan `labelSnapshot`, `descriptionSnapshot`, dan `isRequiredSnapshot`.
   - Perubahan template di masa depan tidak akan merusak atau mengubah riwayat pengerjaan SPK yang sudah lampau.

## 2. Standar Item Checklist AC Maintenance (Default System)
Jika belum ada template khusus yang dikonfigurasi, sistem secara otomatis menginisialisasi standar 8 langkah pemeliharaan AC profesional:
1. Pemeriksaan fungsi remote & kelistrikan unit indoor (Wajib)
2. Pembersihan filter udara & penutup (cover) indoor unit (Wajib)
3. Pembersihan evaporator, blower fan & talang air (Wajib)
4. Pembersihan kondensor outdoor unit & kisi-kisi pendingin (Wajib)
5. Pemeriksaan & pengukuran tekanan freon (refrigerant PSI) (Wajib)
6. Pengukuran arus kerja kompresor (Ampere) (Wajib)
7. Pemeriksaan kelancaran jalur pipa pembuangan air (drainase) (Wajib)
8. Uji performa pendinginan & suhu hembusan udara (Delta T) (Wajib)

## 3. Status Item Checklist
- `NOT_STARTED`: Item belum dikerjakan.
- `DONE`: Item telah selesai dilaksanakan sesuai SOP.
- `NEEDS_ATTENTION`: Item memerlukan perhatian khusus dari pelanggan atau teknisi.
- `NOT_APPLICABLE`: Item tidak relevan untuk tipe unit ini (mis. unit jenis tertentu tanpa komponen terkait).
