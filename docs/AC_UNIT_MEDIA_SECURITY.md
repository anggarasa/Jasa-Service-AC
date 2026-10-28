# Keamanan Media Dokumentasi Unit AC (AC Unit Media Security)

Dokumen ini menjelaskan arsitektur penyimpanan privat MinIO, validasi berkas multipart, dan mekanisme pengaliran (*streaming*) berotorisasi untuk foto unit AC.

---

## 1. Isolasi Bucket & Tujuan Penyimpanan
1. Foto unit AC dikategorikan sebagai aset operasional privat dengan nilai enum `MediaPurpose`: `AC_UNIT_PHOTO`.
2. Foto disimpan pada direktori terisolasi di MinIO:
   `ac-units/photos/{random-uuid}.webp` (atau `.jpg`/`.png`).
3. Bucket MinIO `tampilkit-ac-booking` berstatus privat dan tidak dapat diakses tanpa autentikasi. Kredensial root MinIO tidak pernah diekspos ke antarmuka publik atau browser.

---

## 2. Validasi Berkas Unggahan
Unggahan diproses menggunakan Fastify multipart (`@fastify/multipart`):
- **Batas Ukuran**: Maksimal 5 MB per berkas.
- **Tipe MIME Sah**: Hanya JPEG (`image/jpeg`), PNG (`image/png`), dan WebP (`image/webp`).
- **Pemeriksaan Tanda Tangan Berkas (Magic Bytes)**:
  - Header berkas diperiksa di level byte buffer (`0xFFD8FF` untuk JPEG, `0x89504E47` untuk PNG, `RIFF/WEBP` untuk WebP).
  - Berkas SVG, HTML, skrip, dan executable langsung ditolak demi mencegah serangan Stored XSS.
- **Penamaan Aman**: Nama berkas asli ditransformasi menjadi UUID acak untuk mencegah eksploitasi jalur direktori (*path traversal*).

---

## 3. Akses & Pengaliran Berkas Berotorisasi
Foto dokumentasi unit AC hanya boleh diakses oleh pengguna terautentikasi dengan peran `OWNER` atau `ADMIN`:
- Endpoint: `GET /api/v1/admin/ac-units/:id/photos/:photoId/content`
- Mekanisme:
  1. Guard memeriksa sesi JWT aktif pengguna.
  2. Service memverifikasi relasi kepemilikan unit AC terhadap bisnis aktif.
  3. Server mengalirkan stream byte langsung dari MinIO ke respon HTTP klien.
  4. Header keamanan yang disematkan:
     - `Content-Type`: MIME asli berkas.
     - `Cache-Control`: `private, max-age=3600` (mencegah caching di public proxy).
     - `X-Content-Type-Options`: `nosniff`.

---

## 4. Penghapusan Aman (*Safe Deletion*)
Ketika foto unit AC dihapus melalui `DELETE /api/v1/admin/ac-units/:id/photos/:photoId`:
1. Sistem menghapus relasi pada tabel `AcUnitMedia`.
2. Sistem memeriksa apakah `MediaAsset` terkait masih dirujuk oleh entitas lain.
3. Jika tidak ada referensi lain, berkas fisik dihapus dari MinIO bucket dan baris `MediaAsset` dihapus dari database.
4. Mutasi dicatat pada log audit dengan aksi `AC_UNIT_PHOTO_REMOVED`.
