# Manajemen Alamat Servis & Area Pelanggan (Customer Address Management)

Dokumen ini menjelaskan arsitektur data alamat pelanggan, aturan alamat utama transaksional, penjaminan konkurensi di tingkat PostgreSQL, dan validasi area servis pada CoolCare AC Service Booking System.

---

## 1. Arsitektur Multi-Alamat per Pelanggan
Satu pelanggan dapat memiliki banyak alamat lokasi pengerjaan AC (misalnya: Rumah Tinggal, Rumah Orang Tua, Kantor, Ruko Usaha, Apartemen Sewaan).
Model `CustomerAddress` menyimpan:
- `id`: UUID unik.
- `customerId`: Relasi ke pelanggan pemilik.
- `label`: Label deskriptif (Rumah, Kantor, Ruko).
- `recipientName`: Nama kontak penerima teknisi di lokasi.
- `recipientPhone`: Nomor kontak penerima di lokasi.
- `fullAddress`: Alamat detail (jalan, nomor, RT/RW).
- `province`, `city`, `district`, `subdistrict`, `postalCode`.
- `landmark`: Patokan lokasi (misalnya "Sebelah minimarket").
- `serviceAreaId`: Relasi ke master data `ServiceArea` aktif.
- `isPrimary`: Penanda alamat utama (boolean).
- `isActive`: Status aktif/arsip.

---

## 2. Aturan Invarian Alamat Utama (*Primary Address*)
1. Setiap pelanggan berhak memiliki tepat **satu alamat utama** di antara alamat-alamat yang berstatus aktif (`isActive: true`).
2. Saat pelanggan pertama kali menambahkan alamat servis aktif, alamat tersebut secara otomatis ditetapkan sebagai `isPrimary = true`.
3. Ketika pengguna menetapkan alamat lain sebagai alamat utama (`POST /api/v1/admin/customers/:id/addresses/:addressId/set-primary`), sistem menjalankan transaksi atomik (`Prisma.$transaction`):
   - Seluruh alamat aktif milik pelanggan terkait di-demote menjadi `isPrimary = false`.
   - Alamat target dipromosikan menjadi `isPrimary = true`.
   - Perubahan dicatat pada tabel audit dengan aksi `PRIMARY_ADDRESS_CHANGED`.
4. Jika alamat utama diarsipkan, sistem secara otomatis mencari alamat aktif berikutnya yang terdaftar paling awal dan mempromosikannya sebagai alamat utama baru, sehingga pelanggan tidak tertinggal tanpa alamat utama yang valid.

---

## 3. Penjaminan Konkurensi Database PostgreSQL
Untuk mencegah kondisi balapan (*race condition*) ketika dua request `set-primary` berjalan bersamaan, PostgreSQL dilengkapi dengan **Partial Unique Index**:
```sql
CREATE UNIQUE INDEX "customer_address_one_active_primary_idx"
ON "CustomerAddress" ("customerId")
WHERE "isPrimary" = true AND "isActive" = true;
```
Index ini menjamin di level engine database bahwa tidak ada baris ganda dengan `customerId` sama yang keduanya memiliki `isPrimary: true` dan `isActive: true`.

---

## 4. Validasi Cakupan Area Servis (*Service Area Validation*)
Sebelum menjadwalkan kunjungan teknisi, alamat diverifikasi terhadap konfigurasi `ServiceArea`:
- Endpoint: `POST /api/v1/admin/customers/:customerId/addresses/validate-area`
- Parameter input: `{ "city": "Jakarta Selatan", "district": "Kebayoran Baru" }`
- Logika pencocokan:
  1. Jika ditemukan area aktif yang cocok:
     Status `SERVICEABLE`, mengembalikan ID area, estimasi waktu tempuh (*travel minutes*), dan ongkos kunjungan (*visit fee*).
  2. Jika ditemukan area namun sedang non-aktif:
     Status `NOT_SERVICEABLE`, memberi tahu bahwa area tersebut sedang tidak melayani kunjungan baru.
  3. Jika tidak ditemukan:
     Status `UNVERIFIED`, memberi peringatan bahwa lokasi berada di luar jangkauan standar.
