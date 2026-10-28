# Konfigurasi Database PostgreSQL & Prisma — TampilKit AC Booking

## 1. Spesifikasi Koneksi
- **RDBMS**: PostgreSQL
- **Database**: `tampilkit_ac_booking`
- **Default Port**: `5432`
- **Contoh Connection String**:
  ```env
  DATABASE_URL="postgresql://postgres:anggara-sa@localhost:5432/tampilkit_ac_booking?schema=public"
  ```

## 2. Model Entitas (Phase 01)
1. **User**: Akun pengguna sistem dengan enum peran `OWNER`, `ADMIN`, `TECHNICIAN`.
2. **Business**: Profil bisnis penyedia jasa (nama, slug, kontak, alamat, logo, timezone).
3. **BusinessSetting**: Pengaturan operasional booking (interval menit, buffer, batas pemesanan).
4. **ServiceCategory**: Kategori layanan (Cuci AC, Freon, Perbaikan, Instalasi).
5. **Service**: Rincian layanan AC, tipe harga (`FIXED`, `STARTING_FROM`, `INSPECTION_REQUIRED`), durasi estimasi.
6. **ServiceArea**: Wilayah jangkauan teknisi per kelurahan/kecamatan/kota beserta ongkos kunjungan.
7. **Customer & CustomerAddress**: Data pelanggan dan alamat kunjungan multi-alamat.
8. **AcUnit**: Data unit AC milik pelanggan (merek, tipe, kapasitas PK pecahan seperti 0.5, 0.75, 1.0, 1.5, 2.0 PK).
9. **Technician**: Profil teknisi lapangan terkait dengan User dan Business.
10. **Booking & BookingAcUnit**: Janji temu pemesanan servis dengan dukungan unit AC majemuk.
11. **WorkOrder**: Surat perintah kerja teknisi lapangan yang mencatat diagnosa dan penyelesaian servis.
12. **CalendarConnection**: Skema persiapan koneksi sinkronisasi kalender Google (Phase 10).

## 3. Langkah Migrasi & Seed
```bash
# Generate Prisma Client
npm run db:generate

# Terapkan migrasi ke database
npm run db:migrate

# Jalankan data seed (idempoten)
npm run db:seed
```
Seed data bersifat idempoten menggunakan Prisma `upsert`, aman dijalankan berulang kali tanpa menciptakan data duplikat.
