# Dokumen Spesifikasi: Work Order AC Unit Inspection

## 1. Arsitektur Inspeksi Unit AC
Dalam layanan servis pendingin udara, setiap unit AC memiliki karakteristik teknis dan kondisi fisik tersendiri. Sistem menyediakan model `WorkOrderUnitInspection` yang memiliki relasi 1-to-1 dengan setiap `WorkOrderItem`.

## 2. Struktur Data `WorkOrderUnitInspection`
| Field | Tipe Data | Deskripsi |
|---|---|---|
| `id` | UUID | Primary Key |
| `workOrderId` | UUID | Relasi ke `WorkOrder` |
| `workOrderItemId` | UUID (Unique) | Relasi ke `WorkOrderItem` |
| `acUnitId` | UUID (Nullable) | Relasi ke inventaris `AcUnit` |
| `inspectionStatus` | Enum | `GOOD`, `NEEDS_SERVICE`, `REPAIR_REQUIRED`, `CRITICAL`, `NOT_INSPECTED` |
| `reportedComplaint` | String (Nullable) | Keluhan yang disampaikan pelanggan |
| `observedCondition` | String (Nullable) | Kondisi fisik dan kebersihan unit yang diamati teknisi |
| `diagnosis` | String (Nullable) | Diagnosa teknis lapangan |
| `recommendedAction` | String (Nullable) | Tindakan yang dianjurkan (mis. cuci steam, ganti kapasitor) |
| `requiresFollowUp` | Boolean | Menandai apakah unit membutuhkan perbaikan lanjutan |
| `inspectedAt` | DateTime | Waktu pencatatan inspeksi |
| `inspectedByUserId`| UUID | Teknisi pelaksana inspeksi |

## 3. Alur Kerja Inspeksi di Frontend
- Navigasi melalui `/technician/jobs/[id]/inspection`.
- Tersedia tab per unit AC.
- Teknisi memilih status kondisi (Baik, Servis Ringan, Perlu Perbaikan, Kritis) dengan umpan balik visual instan.
- Setiap unit dapat disimpan secara independen melalui endpoint `PUT /api/v1/technician/work-orders/:id/items/:itemId/inspection`.
- Sistem memvalidasi bahwa seluruh unit AC yang terdaftar pada SPK wajib telah diinspeksi (`inspectionStatus !== NOT_INSPECTED`) sebelum SPK diizinkan untuk diselesaikan (`COMPLETED`).
