# Konfigurasi MinIO Object Storage — TampilKit AC Booking

## 1. Prasyarat & Konfigurasi
Aplikasi memanfaatkan instance MinIO yang sudah berjalan di Docker Desktop lokal.

Variabel lingkungan yang digunakan:
```env
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=tampilkit-ac-booking
```

## 2. Struktur Folder & Jalur Akses Terkontrol
Penyimpanan berkas menggunakan jalur terkontrol:
- `business/logos/`: Logo dan branding entitas bisnis
- `services/images/`: Foto ilustrasi layanan AC
- `ac-units/photos/`: Foto fisik unit AC pelanggan
- `work-orders/before/`: Foto kondisi unit sebelum servis
- `work-orders/after/`: Foto hasil kerja teknisi dan kartu garansi

## 3. StorageService API (Backend)
- `ensureBucket()`: Membuat bucket privat jika belum tersedia
- `uploadObject(folder, buffer, filename, mimeType)`: Mengunggah berkas dengan nama acak aman UUID
- `getObjectMetadata(key)`: Membaca metadata berkas
- `deleteObject(key)`: Menghapus berkas
- `getPresignedDownloadUrl(key, expiry)`: Menghasilkan URL unduhan berbatas waktu
- `checkStorageHealth()`: Memverifikasi konektivitas MinIO secara transparan untuk endpoint `/api/v1/health`
