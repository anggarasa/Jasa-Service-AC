# Template Reusability & White-Label Validation
**Project**: TampilKit Studio — AC Service Booking System  
**Edition**: Basic Field Service (Template Reusability Review)  
**Sample Rebrand Target**: *BreezeFix AC Service*  
**Date**: 2026-10-28  

---

## 1. Tujuan Validasi Reusability Template

TampilKit Studio dirancang sebagai **fondasi template sistem layanan lapangan siap pakai** (*starter kit / white-label software*), bukan sekadar situs web satu kali pakai untuk CoolCare AC.

Validasi ini membuktikan bahwa template dapat di-rebrand secara total menjadi entitas bisnis baru (misal: *BreezeFix AC Service*) tanpa mengubah arsitektur inti atau meninggalkan asumsi kode *hardcoded*.

---

## 2. Poin Konfigurasi Dinamis (Zero Hardcoding)

| Komponen Bisnis | Lokasi Konfigurasi Dinamis | Bukti Kemandirian Template |
|---|---|---|
| **Nama Bisnis & Branding** | Tabel `Business(name, slug, email, phone)` via Admin `/dashboard` | Tidak ada teks nama brand yang di-hardcode di backend engine atau model relasi. |
| **Logo & Galeri** | Tabel `MediaAsset` di MinIO Bucket terkonfigurasi via `.env` | Nama bucket dan endpoint dapat diubah per tenant via environment variable `MINIO_BUCKET`. |
| **Katalog Layanan & Harga** | Tabel `ServiceCategory` & `Service` via `/dashboard` | Bebas menambah, menghapus, atau mengubah harga (Fixed, Starting-From, Inspection-Required). |
| **Wilayah Jangkauan & Biaya** | Tabel `ServiceArea` via `/dashboard` | Biaya kunjungan (*visit fee*) dan estimasi perjalanan dapat disesuaikan per kota/kecamatan tenant. |
| **Jam & Hari Libur** | Tabel `BusinessOperatingHour` & `BusinessClosure` | Jadwal mingguan dan hari libur spesifik per tenant. |
| **Integrasi Kalender** | Tabel `CalendarConnection` per `businessId` | Setiap instalasi template menghubungkan akun Google miliknya sendiri secara independen. |
| **Format Dokumen** | Faktur & Kuitansi PDF | Kop surat dan nama toko diambil secara dinamis dari profil bisnis terdaftar saat PDF di-generate. |

---

## 3. Prosedur Pemasangan Bersih untuk Tenant Baru (Clean Installation)

Untuk menginstal template ini bagi klien baru (contoh: *BreezeFix AC Service*):
1. Gandakan repositori ke folder baru:
   ```bash
   git clone <template_repo> breezefix-ac
   cd breezefix-ac
   npm ci
   ```
2. Buat database PostgreSQL baru (misal: `breezefix_booking`) dan bucket MinIO baru (`breezefix-media`).
3. Konfigurasikan `.env` dengan kredensial database dan MinIO milik BreezeFix.
4. Terapkan migrasi:
   ```bash
   npx prisma migrate deploy --schema apps/backend/prisma/schema.prisma
   ```
5. Inisialisasi akun OWNER pertama:
   ```bash
   npm run auth
   ```
6. Login ke `/dashboard` sebagai OWNER, ubah nama bisnis menjadi **"BreezeFix AC Service"**, atur katalog layanan, masukkan area layanan, dan sistem langsung siap digunakan.
