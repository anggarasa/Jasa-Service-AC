# 📖 Panduan Penggunaan & Alur Sistem: CoolCare AC Service Platform

Dokumen ini merupakan panduan komprehensif mengenai **arsitektur, alur operasional bisnis end-to-end, panduan penggunaan per peran (Pelanggan, Admin/Owner, Teknisi Lapangan)**, serta tata cara instalasi dan pengujian sistem **CoolCare AC Service**.

---

## 📌 Daftar Isi
1. [Gambaran Umum Sistem](#1-gambaran-umum-sistem)
2. [Arsitektur & Tech Stack](#2-arsitektur--tech-stack)
3. [Alur Bisnis End-to-End (Diagram Visual)](#3-alur-bisnis-end-to-end-diagram-visual)
4. [Panduan Penggunaan Berdasarkan Peran](#4-panduan-penggunaan-berdasarkan-peran)
   - [A. Pelanggan (Customer / Tamu)](#a-pelanggan-customer--tamu)
   - [B. Admin & Pemilik Bisnis (Owner)](#b-admin--pemilik-bisnis-owner)
   - [C. Teknisi Lapangan (Technician)](#c-teknisi-lapangan-technician)
5. [Integrasi Google Calendar (Otomatis & Direct)](#5-integrasi-google-calendar-otomatis--direct)
6. [Panduan Menjalankan Sistem Secara Lokal](#6-panduan-menjalankan-sistem-secara-lokal)
7. [Daftar Akun Demo & Uji Coba](#7-daftar-akun-demo--uji-coba)
8. [Tanya Jawab & Penanganan Masalah (Troubleshooting)](#8-tanya-jawab--penanganan-masalah-troubleshooting)

---

## 1. Gambaran Umum Sistem

**CoolCare AC Service** adalah platform web terpadu untuk penyedia jasa servis, cuci rutin, perbaikan freon, dan instalasi AC berbasis monorepo. Sistem ini mengintegrasikan 3 pilar utama:
1. **Portal Publik Pelanggan**: Pemesanan layanan instan (*multi-step wizard*), estimasi biaya transparan, direct Google Calendar bookmark, dan pelacakan status tanpa wajib registrasi akun (*secure token-based*).
2. **Dashboard Operasional Kantor (Owner/Admin)**: Manajemen reservasi, penerbitan Surat Perintah Kerja (SPK / *Work Order*), alokasi teknisi, manajemen master data (pelanggan, unit AC, layanan), integrasi Google Calendar 2 arah, penagihan (*invoices*), dan laporan laba-rugi.
3. **Workspace Teknisi Lapangan (Mobile-First)**: Halaman responsif untuk teknisi memeriksa daftar pekerjaan hari ini, navigasi peta Google Maps, cek list checklist inspeksi unit AC, pengunggahan foto sebelum/sesudah pengerjaan ke MinIO Object Storage, dan konfirmasi pembayaran di tempat.

---

## 2. Arsitektur & Tech Stack

```mermaid
graph TD
    ClientBrowser["Peramban Klien (Desktop / Smartphone)"]
    
    subgraph FrontendApp ["Frontend Application (Port 3000)"]
        PublicRoutes["Portal Publik (App Router)<br/>/, /booking, /services, /booking/manage"]
        DashboardRoutes["Admin Dashboard<br/>/dashboard/*"]
        TechRoutes["Technician Workspace<br/>/technician/*"]
        BFFProxy["BFF API Proxy Handler<br/>/api/admin/*, /api/public/*"]
    end

    subgraph BackendApp ["Backend API Service (Port 3001)"]
        NestFastify["NestJS + Fastify Engine"]
        AuthModule["Auth & RBAC Module (JWT + HttpOnly Cookie)"]
        BookingModule["Booking Engine & Capacity Slot Scheduler"]
        WorkOrderModule["Work Order & Technician Lifecycle"]
        BillingModule["Invoice & Payment Reconciliation"]
        GCalModule["Google Calendar OAuth2 & Background Worker"]
    end

    subgraph StorageInfra ["Database & Storage Infrastructure"]
        PostgresDB[("PostgreSQL Database<br/>Prisma ORM")]
        MinIOBucket[("MinIO S3 Object Storage<br/>Foto Dokumentasi & Media")]
        GoogleCloudAPI["Google Calendar API (Cloud)"]
    end

    ClientBrowser --> FrontendApp
    FrontendApp --> BFFProxy
    BFFProxy --> NestFastify
    NestFastify --> PostgresDB
    NestFastify --> MinIOBucket
    GCalModule --> GoogleCloudAPI
```

- **Frontend**: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Lucide Icons, Shadcn UI.
- **Backend**: NestJS 11 dengan Fastify Adapter, Prisma ORM 6, Zod Validation.
- **Database**: PostgreSQL 16.
- **Media Storage**: MinIO Object Storage (S3-compatible).
- **Integrasi**: Google Calendar API v3 (OAuth2 & Public Event Direct URL).

---

## 3. Alur Bisnis End-to-End (Diagram Visual)

Berikut adalah perjalanan lengkap pesanan dari awal diajukan pelanggan hingga selesai diservis dan dibayar:

```mermaid
sequenceDiagram
    autonumber
    actor C as Pelanggan (Customer)
    participant W as Portal Booking Publik
    participant S as Backend API & DB
    actor A as Admin Kantor
    participant G as Google Calendar
    actor T as Teknisi Lapangan

    Note over C,W: 1. Pemesanan Servis
    C->>W: Pilih Layanan, Jumlah Unit, & Jadwal Servis
    C->>W: Masukkan Alamat & Kontak (+ Idempotency Key)
    W->>S: POST /api/v1/public/bookings
    S-->>W: Kembalikan Booking Code & Token Akses (64 Hex)
    W-->>C: Tampilkan Halaman Konfirmasi + Tombol Simpan ke GCal

    Note over A,G: 2. Verifikasi & Terbitkan SPK
    S->>G: Buat Event Antrean di Google Calendar (Sync Worker)
    A->>S: Admin buka /dashboard/bookings (Lihat daftar booking baru)
    A->>S: Konfirmasi Jadwal & Terbitkan Work Order (Pilih Teknisi)
    S-->>G: Update Event Google Calendar (Teknisi Assigned)

    Note over T,S: 3. Eksekusi Lapangan
    T->>S: Login /technician (Lihat Daftar Tugas Hari Ini)
    T->>S: Update Status: Menuju Lokasi -> Tiba di Lokasi
    T->>S: Isi Lembar Ceklis & Unggah Foto AC Sebelum Pengerjaan (MinIO)
    T->>S: Selesaikan Pengerjaan, Ceklis Akhir, & Foto Sesudah Pengerjaan
    T->>S: Input Rincian Tambahan (cth: Tambah Freon/Pipa) jika ada

    Note over C,T: 4. Penagihan & Selesai
    T->>C: Tunjukkan Ringkasan Biaya di Layar Ponsel Teknisi
    C->>T: Bayar Tunai / Transfer
    T->>S: Konfirmasi Penerimaan Pembayaran & Tanda Tangan Selesai
    S->>S: Terbitkan Invoice Lunas & Tutup Status Tiket
    C->>W: Cek /booking/manage (Lihat status LUNAS & Unduh Rincian)
```

---

## 4. Panduan Penggunaan Berdasarkan Peran

### A. Pelanggan (Customer / Tamu)
Pelanggan tidak perlu repot membuat akun atau mengingat password. Semua interaksi berjalan melalui *token rahasia* yang aman.

1. **Membuat Pemesanan Baru**:
   - Buka halaman utama `http://localhost:3000` dan klik tombol **Booking Service Sekarang**.
   - Pilih jenis layanan yang dibutuhkan (contoh: *Cuci AC Inverter 1 PK*).
   - Masukkan rincian unit AC (Merek, Tipe PK, Lokasi Ruangan).
   - Tentukan tanggal dan jam kedatangan teknisi yang masih tersedia pada slot kalender.
   - Isi formulir nama pemesan, nomor WhatsApp (+62), dan alamat lengkap servis.
   - Periksa rincian ringkasan biaya (harga servis + ongkos kunjungan), lalu tekan tombol **Ajukan Pemesanan**.

2. **Halaman Konfirmasi & Simpan Jadwal**:
   - Setelah sukses, sistem menampilkan kode pemesanan unik (contoh: `ACB-20261029-001F`).
   - Terdapat tombol **"+ Simpan ke Google Calendar"**: Klik tombol ini untuk langsung memasukkan jadwal servis ke Google Calendar pribadi di ponsel/laptop Anda tanpa perlu login akun Google tambahan.
   - Simpan tautan halaman atau token akses untuk melacak status teknisi.

3. **Melacak Status Servis (`/booking/manage`)**:
   - Kapan saja pelanggan ingin mengetahui perkembangan teknisi, buka tautan `http://localhost:3000/booking/manage?token=...`.
   - Di sini Anda dapat melihat status terkini (*Menunggu Konfirmasi*, *Teknisi Ditugaskan*, *Sedang Dikerjakan*, *Selesai*), rincian teknisi yang datang, serta rincian pembayaran.

---

### B. Admin & Pemilik Bisnis (Owner)
Dashboard Admin dapat diakses melalui `http://localhost:3000/login` (masuk dengan tombol cepat **Owner** atau **Admin**).

1. **Memantau & Mengonfirmasi Pemesanan (`/dashboard/bookings`)**:
   - Masuk ke menu **Pemesanan Servis**.
   - Klik pada tiket pemesanan yang berstatus *PENDING*.
   - Verifikasi kesesuaian alamat dan jam slot jadwal.
   - Klik tombol **Konfirmasi Pemesanan** atau pilih **Terbitkan Work Order (SPK)** untuk menugaskan teknisi lapangan tertentu.

2. **Manajemen Work Order / SPK (`/dashboard/work-orders`)**:
   - Pantau progress pengerjaan teknisi secara real-time.
   - Cek foto dokumentasi AC yang diunggah teknisi dari lapangan.
   - Sesuaikan *pricing adjustment* jika di lapangan ditemukan kendala tambahan (contoh: kebocoran pipa atau kapasitor rusak).

3. **Sinkronisasi Google Calendar (`/dashboard/integrations/google-calendar`)**:
   - Buka menu **Integrasi Google Calendar** untuk menghubungkan kalender bisnis dengan akun Google Workspace/Gmail CoolCare.
   - Setiap ada pemesanan baru atau penugasan teknisi, sistem secara otomatis membuat *calendar event* di Google Calendar kantor untuk mencegah jadwal bentrok.

4. **Laporan & Penagihan (`/dashboard/invoices` & `/dashboard/reports`)**:
   - Terbitkan invoice tagihan resmi ke pelanggan.
   - Catat verifikasi pembayaran manual (Tunai/Transfer Bank).
   - Akses grafik performa pendapatan bulanan, jumlah unit yang diservis, dan utilisasi teknisi.

---

### C. Teknisi Lapangan (Technician)
Dirancang khusus dengan antarmuka ramah ponsel (*mobile-first*) yang dapat dioperasikan langsung dengan satu tangan saat teknisi berada di atas tangga servis.

1. **Melihat Jadwal Pekerjaan Hari Ini (`/technician`)**:
   - Buka `http://localhost:3000/login` lalu klik tombol cepat **Teknisi**.
   - Pada halaman utama teknisi, akan muncul kartu daftar pekerjaan hari ini yang diurutkan berdasarkan jam janji temu.
   - Terdapat tombol cepat:
     - 📞 **Hubungi WhatsApp Pelanggan** (membuka WhatsApp dengan pesan otomatis).
     - 📍 **Peta Lokasi** (membuka rute navigasi Google Maps ke rumah pelanggan).

2. **Langkah Pengerjaan di Lapangan**:
   - **Tombol Mulai Berangkat / Tiba**: Update status agar admin kantor dan pelanggan mengetahui posisi teknisi.
   - **Inspeksi Awal & Ceklis**: Buka tab *Inspeksi*, centang kondisi awal AC (kondisi dingin, suara bising, kebocoran air, tekanan freon psi awal).
   - **Unggah Foto Sebelum Pengerjaan**: Ambil foto kondisi filter/evaporator yang kotor dan unggah ke sistem.
   - **Pelaksanaan Servis**: Lakukan pencucian/perbaikan.
   - **Unggah Foto Selesai**: Ambil foto evaporator yang sudah bersih berkilau.
   - **Catat Material Tambahan**: Masukkan jika ada penggantian sparepart atau penambahan freon.

3. **Penyelesaian & Pembayaran**:
   - Tampilkan ringkasan total tagihan ke pelanggan.
   - Pilih metode pembayaran (*Cash* atau *Transfer*).
   - Tekan tombol **Selesaikan Pekerjaan & Terbitkan Tanda Terima**.

---

## 5. Integrasi Google Calendar (Otomatis & Direct)

Sistem CoolCare memiliki 2 lapisan integrasi kalender:

1. **Untuk Pelanggan (Tanpa OAuth)**:
   - Menggunakan URL Template resmi Google Calendar.
   - Jadwal servis langsung tersimpan di akun Google pribadi pelanggan hanya dengan 1 klik tanpa meminta hak akses akun.
2. **Untuk Operasional Kantor (Dengan OAuth2 & Worker)**:
   - Terhubung dengan akun Google Calendar perusahaan.
   - **Calendar Worker** berjalan di latar belakang secara otomatis setiap 30 detik untuk membaca antrean pekerjaan (*job queue*), membuat event jadwal teknisi, dan memvalidasi jika ada jadwal bentrok (*conflict detection*).

---

## 6. Panduan Menjalankan Sistem Secara Lokal

### Prasyarat:
- Node.js versi 20+
- PostgreSQL (aktif di port 5432)
- MinIO Object Storage (aktif di port 9000 untuk S3 API dan 9001 untuk Console)

### Langkah Instalasi:

1. **Clone & Pasang Dependensi**:
   ```bash
   git clone https://github.com/anggarasa/Jasa-Service-AC.git
   cd Jasa-Service-AC
   npm install
   ```

2. **Konfigurasi Environment (`.env`)**:
   Pastikan file `.env` di root telah terisi (dapat menyalin dari `.env.example`):
   ```env
   DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/ac_service_db?schema=public"
   JWT_SECRET="coolcare-super-secret-jwt-token-key-2026"
   MINIO_ENDPOINT="127.0.0.1"
   MINIO_PORT="9000"
   MINIO_ACCESS_KEY="minioadmin"
   MINIO_SECRET_KEY="minioadmin"
   MINIO_BUCKET="coolcare-media"
   NEXT_PUBLIC_SITE_URL="http://localhost:3000"
   BACKEND_PORT=3001
   ```

3. **Migrasi & Seed Database**:
   ```bash
   npm run prisma:migrate --workspace=apps/backend
   npm run prisma:seed --workspace=apps/backend
   ```

4. **Jalankan Aplikasi Development**:
   ```bash
   npm run dev
   ```
   - Portal Web Frontend aktif di: `http://localhost:3000`
   - Backend Fastify API aktif di: `http://localhost:3001`
   - Dokumentasi Swagger API aktif di: `http://localhost:3001/api/docs`
   *(Catatan: Worker Google Calendar otomatis aktif bersamaan dengan dev server).*

---

## 7. Daftar Akun Demo & Uji Coba

Pada halaman login (`http://localhost:3000/login`), tersedia tombol **1-Click Quick Login** untuk langsung masuk tanpa mengetik:

| Role | Email | Password | URL Akses Default | Hak Akses |
|---|---|---|---|---|
| 👑 **Owner** | `owner@coolcare.id` | `OwnerSecurePass123!` | `/dashboard` | Akses penuh seluruh sistem, pengaturan bisnis, finansial, dan audit log. |
| 🛡️ **Admin** | `admin@coolcare.id` | `AdminSecurePass123!` | `/dashboard` | Konfirmasi reservasi, alokasi teknisi, manajemen master data, invoice. |
| 🔧 **Teknisi** | `technician@coolcare.id` | `TechSecurePass123!` | `/technician` | Daftar SPK harian, checklist inspeksi, upload foto MinIO, status servis. |

---

## 8. Tanya Jawab & Penanganan Masalah (Troubleshooting)

### Q1: Muncul `ChunkLoadError` pada browser saat navigasi halaman utama?
- **Penyebab**: Hash bundle di browser berbeda dengan hasil build baru di server lokal.
- **Solusi**: Sistem sudah dilengkapi `ChunkErrorListener` yang otomatis me-refresh halaman. Jika masih muncul, cukup tekan **`Ctrl + F5`** (atau `Cmd + Shift + R`) untuk hard refresh cache browser.

### Q2: Mengapa status Google Calendar di dashboard berstatus "Belum Terhubung"?
- **Solusi**: Buka menu **Pengaturan > Integrasi Google Calendar** (`/dashboard/settings/integrations/google`). Klik tombol **Hubungkan Google Calendar**, login dengan akun Google Anda, dan pilih kalender utama untuk sinkronisasi.

### Q3: Foto dokumentasi teknisi gagal diunggah?
- **Solusi**: Pastikan layanan MinIO aktif pada port `9000` dan bucket `coolcare-media` telah dibuat. Sistem backend akan otomatis mengonfigurasi bucket saat pertama kali dijalankan.

---
*Dokumen ini dibuat secara resmi untuk tim operasional, pengembang, dan teknisi CoolCare AC Service.*
