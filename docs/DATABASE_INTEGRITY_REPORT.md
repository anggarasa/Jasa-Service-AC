# Database Integrity & Schema Migration Report
**Project**: TampilKit Studio — AC Service Booking System  
**Edition**: Basic Field Service (CoolCare AC Service)  
**Database**: PostgreSQL 16 (Local) via Prisma ORM v6.19.3  
**Date**: 2026-10-28  

---

## 1. Riwayat Migrasi Prisma (Migration History)

Seluruh struktur database diatur secara deklaratif melalui migrasi Prisma terstruktur:

| No | Folder Migrasi | Tujuan & Model yang Ditambahkan | Status Deploy |
|---|---|---|---|
| 1 | `20261028000000_update_schema` | Skema dasar fondasi Phase 01: `User`, `Business`, `BusinessSetting`, `OperatingHour`, `Service`, `ServiceArea`, `MediaAsset`. | **DEPLOYED** |
| 2 | `20261028100000_auth_system` | Manajemen sesi & token Phase 02: `UserSession`, `RefreshTokenFamily`, indeks audit login. | **DEPLOYED** |
| 3 | `20261028170000_customer_address_ac_unit` | Phase 05: `Customer`, `CustomerAddress`, `AcUnit`, `AcUnitMedia`, `CustomerAuditLog`. | **DEPLOYED** |
| 4 | `20261028180000_booking_engine_occupancy` | Phase 07: `Booking`, `BookingItem`, `BookingAcUnit`, `BookingAccessToken`, `BookingIdempotency`, `ResourceOccupancy`, PostgreSQL GiST Exclusion Constraint. | **DEPLOYED** |
| 5 | `20261028190000_admin_booking_work_order` | Phase 08: `WorkOrder`, `WorkOrderItem`, `WorkOrderStatusHistory`, `WorkOrderAssignmentHistory`, `BookingAuditLog`. | **DEPLOYED** |
| 6 | `20261028200000_technician_workspace_execution` | Phase 09: `WorkOrderUnitInspection`, `ServiceChecklistTemplate`, `WorkOrderChecklistItem`, `WorkOrderPhoto`, `WorkOrderServiceReport`. | **DEPLOYED** |
| 7 | `20261028210000_google_calendar_integration` | Phase 10: `CalendarConnection`, `CalendarSyncJob`, `CalendarSyncConflict`, `ExternalCalendarEvent`. | **DEPLOYED** |
| 8 | `20261028220000_billing_invoice_payment` | Phase 11: `WorkOrderCharge`, `WorkOrderMaterial`, `ServiceChargeApproval`, `Invoice`, `InvoiceItem`, `Payment`, `PaymentReceipt`, `FinancialAuditLog`. | **DEPLOYED** |

---

## 2. Integritas Relasional & Constraint Utama

### A. Pencegahan Double-Booking (GiST Exclusion Constraint)
```sql
ALTER TABLE "ResourceOccupancy" 
ADD CONSTRAINT "no_overlapping_technician_occupancy" 
EXCLUDE USING gist (
  "technicianId" WITH =, 
  tsrange("startsAt", "endsAt", '[)') WITH =
) 
WHERE ("status" = 'ACTIVE');
```
- **Fungsi**: Memastikan di level kernel PostgreSQL bahwa seorang teknisi tidak dapat memiliki 2 jadwal okupansi bertatus `ACTIVE` yang saling beririsan (*time-interval overlap*), bahkan saat terjadi lonjakan konkurensi request tinggi.

### B. Foreign Key Komposit Kepemilikan Unit AC (Anti-IDOR)
```sql
ALTER TABLE "AcUnit"
ADD CONSTRAINT "AcUnit_customerAddressId_customerId_fkey"
FOREIGN KEY ("customerAddressId", "customerId")
REFERENCES "CustomerAddress"("id", "customerId")
ON DELETE RESTRICT;
```
- **Fungsi**: Mencegah serangan IDOR di mana penyerang mencoba memasang unit AC miliknya ke alamat milik pelanggan lain dengan nomor telepon atau ID alamat acak.

### C. Foreign Key Restrict Finansial
- Relasi `WorkOrder` $\rightarrow$ `Booking`: `onDelete: Restrict`.
- Relasi `Invoice` $\rightarrow$ `WorkOrder`: `onDelete: Restrict`.
- Relasi `Payment` $\rightarrow$ `Invoice`: `onDelete: Restrict`.
- Relasi `PaymentReceipt` $\rightarrow$ `Payment`: `onDelete: Restrict`.
- **Fungsi**: Mencegah penghapusan tidak sengaja (*accidental cascade deletion*) terhadap riwayat pesanan fisik dan transaksi kas yang telah dibukukan.

### D. Indeks Efisiensi Kueri
- Indeks komposit pada `Booking(businessId, status, scheduledStartAt)` untuk dasbor admin.
- Indeks pada `ResourceOccupancy(technicianId, status, startsAt, endsAt)` untuk kueri ketersediaan slot.
- Indeks pada `CalendarSyncJob(status, nextAttemptAt)` untuk daemon background worker.
- Indeks pada `Invoice(businessId, status)` dan `Payment(invoiceId)` untuk rekonsiliasi finansial cepat.
