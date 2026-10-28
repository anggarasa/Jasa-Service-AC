# Booking Engine & Customer Reservation — TampilKit Studio

## 1. Ikhtisar Arsitektur
Booking Engine pada CoolCare AC Service dirancang untuk menyediakan alur pemesanan servis AC lapangan (*field service*) yang cepat, transparan, dan dapat diakses oleh pelanggan publik tanpa kewajiban registrasi atau login (*guest checkout*). Seluruh kalkulasi harga, durasi pengerjaan, buffer perjalanan, dan alokasi kapasitas teknisi sepenuhnya dikendalikan oleh backend NestJS Fastify (*server-authoritative*).

---

## 2. Alur Multi-Langkah Wizard Pemesanan (8 Langkah UX)

1. **Langkah 1 — Pilih Layanan Servis**:
   - Menampilkan katalog layanan AC aktif (`Cuci AC Standar`, `Cuci AC Inverter`, `Bongkar Pasang`, `Pengecekan & Servis Kerusakan`).
   - Menampilkan tipe harga (`FIXED`, `STARTING_FROM`, `INSPECTION_REQUIRED`) dan estimasi durasi dasar per unit.
2. **Langkah 2 — Rincian Unit AC (Multi-Unit AC)**:
   - Pelanggan dapat mendaftarkan 1 s/d 10 unit AC dalam satu kali pemesanan (misal: 3 unit Cuci AC).
   - Data per unit mencakup: Merk, Tipe AC (`SPLIT`, `CASSETTE`, `FLOOR_STANDING`, dsb), Kapasitas PK desimal (`0.50`, `0.75`, `1.00`, `1.50`, `2.00`), Lokasi Ruangan, dan Catatan keluhan khusus.
3. **Langkah 3 — Alamat Pengerjaan & Wilayah Jangkauan**:
   - Memilih wilayah jangkauan operasional aktif (`ServiceArea`).
   - Menampilkan ongkos kunjungan wilayah secara transparan.
   - Input alamat lengkap, patokan lokasi (*landmark*), kota, kecamatan, dan kode pos.
4. **Langkah 4 — Pilih Tanggal Kunjungan**:
   - Kalender interaktif yang memblokir tanggal masa lalu, hari libur bisnis (`BusinessClosure`), dan hari ketika bisnis tutup operasional.
5. **Langkah 5 — Pilih Slot Waktu Ketersediaan Teknisi**:
   - Slot waktu dihitung secara dinamis via `GET /api/v1/public/availability`.
   - Menguji kelayakan jam operasional, waktu istirahat teknisi, dan ketersediaan kapasitas teknisi nyata.
6. **Langkah 6 — Informasi Kontak Pemesan**:
   - Nama lengkap, nomor WhatsApp seluler Indonesia (`08...`), email opsional, dan catatan operasional untuk teknisi.
7. **Langkah 7 — Tinjauan & Estimasi Biaya**:
   - Ringkasan total unit, biaya servis, ongkos kunjungan, dan estimasi total.
   - Penjelasan metode pembayaran: Pembayaran tunai/transfer di tempat setelah pengerjaan selesai.
8. **Langkah 8 — Konfirmasi & Submit (Idempotent)**:
   - Dikirim dengan `idempotencyKey` unik (UUIDv4/random hex) ke `POST /api/v1/public/bookings`.

---

## 3. Kalkulasi Durasi & Rentang Okupansi

$$\text{Durasi Servis} = \text{estimatedDurationMinutes} \times \text{unitCount}$$

$$\text{Buffer Servis} = \text{additionalBufferMinutes} \parallel \text{defaultServiceBufferMinutes (15 mnt)}$$

$$\text{Buffer Perjalanan} = \text{estimatedTravelMinutes (ServiceArea)} \parallel \text{defaultTravelBufferMinutes (30 mnt)}$$

$$\text{Total Okupansi} = \text{Durasi Servis} + \text{Buffer Servis} + \text{Buffer Perjalanan}$$

Rentang okupansi teknisi disimpan dalam interval setengah terbuka $[\text{startAt}, \text{occupancyEndAt})$. Dua reservasi dinyatakan tumpang tindih (*overlap*) jika:

$$\text{start}_A < \text{end}_B \quad \text{dan} \quad \text{start}_B < \text{end}_A$$

---

## 4. Siklus Hidup Status Pemesanan (Lifecycle)

| Status | Deskripsi | Okupansi Teknisi |
|---|---|---|
| `PENDING` | Status awal reservasi (jika `autoConfirmBooking = false`). Menunggu verifikasi admin CoolCare. | `ACTIVE` (Hold maksimal 120 menit) |
| `CONFIRMED` | Pemesanan telah diverifikasi admin atau otomatis (`autoConfirmBooking = true`). | `ACTIVE` |
| `ASSIGNED` | Teknisi tertentu telah ditugaskan secara final oleh admin. | `ACTIVE` |
| `IN_PROGRESS` | Teknisi telah tiba di lokasi dan sedang mengerjakan unit. | `ACTIVE` |
| `COMPLETED` | Pekerjaan selesai dan pembayaran diterima di lokasi. | `RELEASED` |
| `CANCELLED` | Pemesanan dibatalkan oleh admin atau pelanggan. | `RELEASED` |
| `EXPIRED` | Batas waktu hold 120 menit habis tanpa konfirmasi admin. | `RELEASED` |
