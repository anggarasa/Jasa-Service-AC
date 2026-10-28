# Manajemen Inventaris Unit AC (AC Unit Management)

Dokumen ini menjelaskan struktur data unit pendingin ruangan, relasi integritas komposit, dukungan kapasitas PK pecahan, pemindahan lokasi instalasi unit, dan histori servis.

---

## 1. Model Data Unit AC (`AcUnit`)
Setiap unit AC yang dimiliki pelanggan dicatat secara mendetail:
- `id`: UUID unik.
- `customerId`: Relasi ke pelanggan pemilik.
- `customerAddressId`: Relasi ke alamat spesifik tempat unit terpasang.
- `unitCode`: Kode aset unik (format: `AC-000001`), dibuat secara deterministik dan aman terhadap konkurensi di server.
- `unitLabel`: Penamaan unit ramah pengguna (contoh: "AC Kamar Utama", "AC Ruang Server").
- `brand`: Merk AC (Daikin, Panasonic, LG, Sharp, Gree, dll).
- `model`: Nomor seri model atau tipe produk.
- `type`: Enum `AcType` (`SPLIT`, `CASSETTE`, `FLOOR_STANDING`, `CENTRAL`, `WINDOW`, `PORTABLE`, `OTHER`).
- `capacityPk`: Kapasitas pendinginan dalam format angka desimal presisi (`Decimal(4, 2)`).
- `serialNumber`: Nomor seri pabrikan (barcode mesin outdoor/indoor).
- `installationRoom`: Deskripsi letak ruangan ("Kamar Depan Lantai 2").
- `installationDate`: Tanggal pemasangan unit AC.
- `notes`: Catatan teknis (letak outdoor, panjang pipa, kebutuhan tangga khusus).
- `isActive`: Status operasional unit.

---

## 2. Integritas Relasi Komposit Database
Sebuah unit AC tidak boleh terdaftar di alamat milik orang lain. Untuk menjamin kepemilikan yang sah:
1. Skema Prisma menerapkan relasi komposit:
   ```prisma
   model CustomerAddress {
     id         String
     customerId String
     @@unique([id, customerId])
   }

   model AcUnit {
     customerId        String
     customerAddressId String
     customerAddress   CustomerAddress @relation(fields: [customerAddressId, customerId], references: [id, customerId], onDelete: Restrict)
   }
   ```
2. Database PostgreSQL menegakkan *Composite Foreign Key*:
   `FOREIGN KEY ("customerAddressId", "customerId") REFERENCES "CustomerAddress"("id", "customerId")`.
   Hal ini menjamin di level database bahwa `customerAddressId` yang dipilih oleh sebuah unit AC wajib memiliki `customerId` yang sama persis dengan unit tersebut.

---

## 3. Kapasitas PK Pecahan (*Fractional PK*)
Kapasitas pendingin ruangan di Indonesia dihitung dalam Horsepower / Paardekracht (PK):
- `0.5 PK` (1/2 PK)
- `0.75 PK` (3/4 PK)
- `1.0 PK` (1 PK)
- `1.5 PK` (1 1/2 PK)
- `2.0 PK` (2 PK)
- `2.5 PK` (2 1/2 PK)

Kolom database menggunakan tipe `Decimal(4, 2)` pada PostgreSQL untuk menghindari ketidakakuratan konversi floating-point dan menjamin perhitungan tarif kalkulasi gas freon / pembersihan di masa depan tetap eksak.

---

## 4. Pemindahan Unit Antar Alamat (*Move AC Unit*)
Pelanggan yang pindah rumah atau memindahkan unit AC ke kantor/ruko dapat diproses melalui rute khusus:
- Endpoint: `POST /api/v1/admin/ac-units/:id/move-address`
- Validasi:
  - Alamat tujuan baru (`newCustomerAddressId`) wajib berstatus aktif dan dimiliki oleh pelanggan yang sama.
  - Percobaan memindahkan unit ke alamat pelanggan lain akan langsung ditolak dengan pesan `400 Bad Request`.
  - Mutasi pemindahan dicatat pada tabel audit: `AC_UNIT_MOVED` dengan mencantumkan alamat asal, alamat tujuan, dan alasan pemindahan.

---

## 5. Kesiapan Histori Servis
Histori pengerjaan servis unit AC ditarik secara dinamis dari tabel pesanan riil (`BookingAcUnit` -> `Booking` -> `WorkOrder`):
- Endpoint: `GET /api/v1/admin/ac-units/:id/history`
- Mengembalikan daftar pesanan riil, diagnosis teknisi, catatan pengerjaan, dan tanggal penyelesaian.
- Jika belum ada servis yang dilakukan, sistem mengembalikan status kosong netral:
  `{ "acUnitId": "...", "services": [], "totalServices": 0, "lastServiceDate": null }`
  tanpa pernah memalsukan riwayat fiktif.
