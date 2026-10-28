# Dokumen Spesifikasi: Work Order Photo Documentation & Storage Security

## 1. Kategori Dokumentasi Foto Lapangan
Model `WorkOrderPhoto` mengelompokkan foto bukti pengerjaan ke dalam 4 kategori:
- `BEFORE`: Kondisi fisik unit AC sebelum diservis (kotor, filter tebal debu, rembesan).
- `DURING`: Dokumentasi proses pembongkaran, cuci steam, dan pengukuran tekanan/ampere.
- `AFTER`: Kondisi bersih evaporator, outdoor, dan hasil hembusan dingin.
- `ISSUE`: Dokumentasi kerusakan komponen (kapasitor terbakar, pipa bocor, kabel getas).

## 2. Penyimpanan & Isolasi di MinIO Object Storage
- Berkas disimpan di bucket pribadi MinIO `tampilkit-ac-booking`.
- Folder berstruktur rapi: `work-orders/photos/{category}/{uuid}.webp`.
- Seluruh berkas melalui validasi MIME type biner (`validateImage`) untuk format JPEG, PNG, dan WebP dengan ukuran maksimal 5 MB. Format berbahaya seperti SVG atau skrip dieleminasi.
- Berkas media dicatat dalam tabel `MediaAsset` dengan tujuan `MediaPurpose.WORK_ORDER_PHOTO`.

## 3. Kontrol Akses & Streaming Aman
Foto pengerjaan SPK bersifat **rahasia** (private) karena memuat area rumah/properti pelanggan.
- Endpoint streaming: `GET /api/v1/technician/work-orders/:id/photos/:photoId/content`.
- Otorisasi: Guard memeriksa bahwa pengguna yang meminta foto adalah **teknisi yang ditugaskan pada SPK tersebut** atau **Admin/Owner bisnis**.
- Berkas di-stream langsung dengan header `Content-Type` yang sesuai dan `Cache-Control: private, max-age=3600`.
