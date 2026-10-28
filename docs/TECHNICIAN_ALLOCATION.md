# Alokasi Kapasitas Teknisi & Ketersediaan Dinamis

## 1. Kebijakan Alokasi Kapasitas (Provisional Capacity Allocation)
Pada pemesanan publik (*guest booking*), identitas pribadi teknisi (nama, jadwal pribadi, alasan cuti) **tidak pernah diekspos ke publik** demi alasan privasi dan keamanan operasional.

Sistem bekerja berdasarkan alokasi kapasitas (*capacity hold*):
1. Sistem mencari seluruh teknisi berstatus `isActive: true` yang terdaftar pada bisnis yang sama.
2. Untuk setiap slot waktu kandidat, sistem memeriksa apakah ada teknisi yang bebas dari reservasi aktif (`ResourceOccupancy`) dan blokir non-servis (`TechnicianBlock`).
3. Selama proses checkout, backend mengalokasikan satu teknisi yang memenuhi syarat secara atomik di dalam transaksi database Prisma.
4. Admin dapat meninjau dan mengubah penugasan teknisi (*reassignment*) sebelum atau saat konfirmasi jadwal.

---

## 2. Fondasi Dependensi Phase 06 yang Diintegrasikan
Sebagai bagian dari penyempurnaan dependensi Phase 06, fondasi teknisi yang dibangun mencakup:
- **Model `ResourceOccupancy`**: Menyimpan blok waktu okupansi teknisi dengan `status` (`ACTIVE`, `RELEASED`, `CANCELLED`).
- **Model `TechnicianBlock`**: Menyimpan blokir waktu non-booking teknisi (istirahat terjadwal, cuti, atau pelatihan).
- **Integrasi `BusinessOperatingHour` & `BusinessClosure`**: Menghitung ketersediaan berdasarkan jam buka-tutup mingguan dan jadwal libur bisnis.

---

## 3. Pencegahan Deadlock pada Alokasi Teknisi Konkuren
Untuk mencegah *deadlock* saat beberapa pengguna memesan slot yang sama secara bersamaan:
1. Digunakan **Transaction-Level Advisory Locks** PostgreSQL:
   ```sql
   SELECT pg_try_advisory_xact_lock(hashtext(technician_id)) as locked;
   ```
2. Transaksi A mengunci hak alokasi teknisi 1; jika transaksi B mencoba di milidetik yang sama, transaksi B melewati teknisi 1 dan langsung memeriksa teknisi 2.
3. Kunci ini dilepaskan secara otomatis saat transaksi database di-commit atau di-rollback.
