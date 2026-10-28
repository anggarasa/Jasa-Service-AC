# Technician Assignment & Scheduling Engine — CoolCare AC Service

Dokumen ini menjelaskan strategi alokasi teknisi, validasi ketersediaan, pencegahan *double-booking*, dan pengalihan teknisi (*reassignment*) pada sistem CoolCare AC Service.

---

## 1. Model Okupansi Teknisi (`ResourceOccupancy`)

Setiap penugasan teknisi pada janji temu servis memicu pembuatan rekaman di tabel `ResourceOccupancy`.
- Jendela okupansi dihitung dari:
  $$\text{Waktu Okupansi} = \text{Durasi Servis (Per Unit $\times$ Jumlah Unit)} + \text{Buffer Servis} + \text{Buffer Perjalanan}$$
- **PostgreSQL GiST Exclusion Constraint** memastikan tidak ada dua rekaman aktif (`status = 'ACTIVE'`) untuk teknisi yang sama dengan rentang waktu yang saling beririsan:
  ```sql
  ALTER TABLE "ResourceOccupancy"
  ADD CONSTRAINT "no_overlapping_technician_occupancy"
  EXCLUDE USING gist (
    "technicianId" WITH =,
    tstzrange("startsAt", "endsAt", '[)') WITH &&
  ) WHERE ("status" = 'ACTIVE');
  ```

---

## 2. Alur Penugasan Awal (`assign-technician`)

1. Operator memilih teknisi dari daftar teknisi aktif.
2. Sistem mengeksekusi `pg_try_advisory_xact_lock(hashtext(technicianId))` untuk mengunci alokasi teknisi secara atomik.
3. Melakukan pengecekan benturan jadwal terhadap tabel `ResourceOccupancy` dan `TechnicianBlock`.
4. Jika slot bebas:
   - Membuat `ResourceOccupancy` baru berstatus `ACTIVE` yang terhubung ke `bookingId`.
   - Mengubah status reservasi dari `PENDING` atau `CONFIRMED` menjadi `ASSIGNED`.
   - Memperbarui `technicianId` pada SPK terkait bila SPK sudah diterbitkan.
   - Mencatat peristiwa di `BookingStatusHistory` dan `BookingAuditLog`.

---

## 3. Alur Pengalihan Teknisi (`reassign-technician`)

Ketika teknisi berhalangan hadir atau terjadi perubahan penugasan operasional:
1. Operator memilih teknisi pengganti dan mengisi alasan pengalihan (`reason`).
2. Okupansi aktif teknisi lama pada booking ini diubah menjadi `CANCELLED`.
3. Teknisi pengganti divalidasi ketersediaannya dan okupansi baru dibuat.
4. SPK aktif diperbarui dan sistem mencatat riwayat mutasi pada `WorkOrderAssignmentHistory`:
   - `fromTechnicianId`: Teknisi lama
   - `toTechnicianId`: Teknisi pengganti
   - `reason`: Alasan pengalihan
   - `actorUserId`: Identitas admin/operator yang memutasi
5. Booking audit log mencatat aksi `REASSIGN_TECHNICIAN`.
