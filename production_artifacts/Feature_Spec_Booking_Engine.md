# Spesifikasi Fitur: Phase 07 — Booking Engine, Technician Availability & Customer Reservation

## 1. Ringkasan Fitur
Fitur ini mengimplementasikan alur pemesanan publik (*Public Booking Wizard*) tanpa login (guest booking) untuk layanan servis AC pada brand CoolCare AC Service, kalkulasi ketersediaan kapasitas teknisi secara dinamis, penentuan durasi dan estimasi harga server-authoritative, pencegahan pemesanan ganda di tingkat database (*PostgreSQL Exclusion Constraint* / transactional locking), idempoten submission, serta akses konfirmasi dan manajemen pemesanan publik yang aman.

## 2. Status Dependensi Phase 06 (Temuan & Perbaikan)
- **Status Sebelumnya**: Phase 06 belum dieksekusi secara independen. Model `Technician` telah ada di Prisma, namun belum memiliki model `TechnicianSchedule`, `TechnicianLeave`, `TechnicianBlock`, dan `ResourceOccupancy`.
- **Fondasi Minimal Phase 06 yang Dibangun**:
  - Model `ResourceOccupancy` untuk melacak blok waktu teknisi aktif (reservasi pemesanan, cuti, atau waktu istirahat/blokir).
  - Model `TechnicianBlock` untuk pemblokiran waktu teknisi non-booking.
  - Fallback jadwal kerja teknisi terintegrasi dengan `BusinessOperatingHour` dan hari/jam kerja bisnis.
  - Pemeriksaan kelayakan teknisi aktif di bawah bisnis yang sama.

## 3. Desain Model Data & Migrasi Database
1. **Ekstensi `Booking`**:
   - `serviceAreaId`: Relasi ke `ServiceArea` untuk tracking wilayah.
   - `bookingSource`: `WEBSITE` (default), `ADMIN`, `WHATSAPP`.
   - `occupancyStartAt` & `occupancyEndAt`: Rentang waktu okupansi teknisi penuh (termasuk buffer servis dan buffer perjalanan).
   - `serviceNameSnapshot`, `priceTypeSnapshot`, `unitCount`, `estimatedServicePrice`, `visitFeeSnapshot`, `estimatedTotal`, `estimatedDurationMinutes`.
   - `expiresAt`: Waktu kedaluwarsa penahanan kapasitas untuk status `PENDING` (default: 120 menit).
2. **Model `BookingItem`**:
   - Mendukung multi-unit AC per reservasi (misal: 3 unit Cuci AC).
   - Menyimpan snapshot detail unit AC (brand, model, type, PK, ruangan, catatan kerusakan).
   - Menyimpan `unitPriceSnapshot` dan `estimatedDurationMinutes`.
   - Menghubungkan secara opsional ke `acUnitId` jika terverifikasi di inventaris.
3. **Model `ResourceOccupancy`**:
   - Menghubungkan `technicianId`, `bookingId`, `startsAt`, `endsAt`, dan `status` (`ACTIVE`, `RELEASED`, `CANCELLED`).
   - Dilindungi oleh PostgreSQL Exclusion Constraint menggunakan `tstzrange` dan `btree_gist`:
     `EXCLUDE USING gist (technicianId WITH =, tstzrange("startsAt", "endsAt", '[)') WITH &&) WHERE (status = 'ACTIVE')`
     menjamin secara mutlak di tingkat engine PostgreSQL bahwa satu teknisi tidak dapat memiliki 2 jadwal okupansi yang bertubrukan (*double-booking impossible*).
4. **Model `BookingStatusHistory`**:
   - Melacak transisi status pemesanan (`PENDING` -> `CONFIRMED`, `CANCELLED`, `EXPIRED`, dsb).
5. **Model `BookingAccessToken`**:
   - Token acak aman (disimpan dalam bentuk hash SHA-256) untuk akses guest ke halaman detail/konfirmasi pemesanan tanpa membocorkan data pribadi atau mengizinkan enumerasi sequential code.
6. **Model `BookingIdempotency`**:
   - Kunci idempotensi unik (`idempotencyKey` + `keyHash`) untuk mencegah submit ganda akibat lag jaringan atau double click.

## 4. Alur & Kebijakan Bisnis
1. **Public Booking Wizard (8 Langkah UX)**:
   - Langkah 1: Pilih Layanan (ambil dari katalog aktif NestJS).
   - Langkah 2: Detail Unit AC (jumlah unit, merk, tipe, PK, lokasi ruangan, keluhan).
   - Langkah 3: Alamat Servis (jalan, kota, kecamatan, verifikasi area jangkauan).
   - Langkah 4: Pilih Tanggal (kalender dinamis, memperhitungkan libur bisnis).
   - Langkah 5: Pilih Jam/Slot (kalkulasi dinamis kapasitas teknisi aktif).
   - Langkah 6: Data Kontak Pemesan (Nama, No WhatsApp, Email opsional, Catatan).
   - Langkah 7: Tinjauan & Estimasi Biaya (rincian biaya servis, ongkos kunjungan, bayar di tempat).
   - Langkah 8: Konfirmasi & Submit (dengan kunci idempotensi).
2. **Kalkulasi Slot & Okupansi Waktu**:
   - Durasi Servis = `estimatedDurationMinutes × unitCount`
   - Buffer Servis = `defaultServiceBufferMinutes` (dari BusinessSetting)
   - Buffer Perjalanan = `estimatedTravelMinutes` (dari ServiceArea atau default)
   - Rentang Okupansi = `[startAt, startAt + durasi + bufferServis + bufferPerjalanan)`
3. **Pemberian Status Awal**:
   - Jika `autoConfirmBooking = false`: Status awal `PENDING` dengan reservasi kapasitas teknisi selama `pendingHoldMinutes = 120`.
   - Jika `autoConfirmBooking = true`: Status awal `CONFIRMED`.

## 5. Keamanan & Privasi
- Data jadwal/informasi pribadi teknisi tidak pernah diekspos ke publik; API ketersediaan hanya mengembalikan slot jam (`09:00`, `11:00`, dst) yang tersedia.
- Booking code (`ACB-YYYYMMDD-XXXX`) bukan kredensial akses; akses guest diamankan oleh token akses kriptografis.
- Validasi ketat DTO dengan class-validator di sisi backend.
- Rate limiting pada endpoint publik.
