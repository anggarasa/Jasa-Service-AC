# Keamanan Pengiriman Media Publik & MinIO Storage (Phase 04)

## 1. Arsitektur Penyimpanan Privat

Bucket MinIO (`tampilkit-ac-booking`) dikonfigurasi berstatus **Private Bucket**. Klien peramban tidak dapat melakukan listing objek sembarangan atau mengakses objek tanpa otorisasi.

Seluruh berkas gambar diunggah ke path yang aman dan terisolasi:
- `business/logos/{uuid}.webp`
- `services/images/{uuid}.webp`
- `gallery/images/{uuid}.webp`

Nama berkas asli klien **tidak pernah** digunakan langsung sebagai nama objek di storage guna mencegah *Path Traversal* dan *Unrestricted File Upload Vulnerability*.

---

## 2. Validasi Berkas Unggahan

Sebelum sebuah gambar diterima oleh sistem:
1. **Pemeriksaan Ukuran**: Maksimal 5 MB per berkas.
2. **Pemeriksaan Magic Bytes**: Validasi tanda tangan biner file untuk memastikan bahwa berkas benar-benar berformat JPEG (`FF D8 FF`), PNG (`89 50 4E 47...`), atau WebP (`RIFF ... WEBP`).
3. **Penolakan Format Berbahaya**: Berkas SVG, berkas biner tereksekusi (.exe, .sh), skrip PHP/JS, atau dokumen yang memuat tag `<svg` atau `<?xml` otomatis ditolak untuk mencegah serangan Cross-Site Scripting (XSS).

---

## 3. Kontrol Akses Media Publik (`GET /api/v1/public/media/:id`)

Endpoint `/api/v1/public/media/:id` menerapkan verifikasi ketat sebelum melayani permintaan berkas:
1. Sistem mencari record `MediaAsset` berdasarkan UUID.
2. Sistem memverifikasi apakah media tersebut terhubung dengan aset publik yang aktif:
   - Apakah media tersebut merupakan `logoObjectKey` dari bisnis yang aktif?
   - Apakah media tersebut merupakan `imageObjectKey` dari layanan AC yang aktif?
   - Apakah media tersebut terdaftar di dalam item `BusinessGallery` yang berstatus `isActive: true`?
3. Jika media tersebut tidak memenuhi salah satu kriteria di atas (misalnya: foto unit AC pelanggan atau bukti pengerjaan teknisi di fase mendatang), sistem langsung mengembalikan `HTTP 403 Forbidden`.
4. Berkas yang lolos verifikasi dikirimkan langsung menggunakan stream biner Fastify dengan header `Content-Type` yang sesuai dan header caching:
   ```http
   Cache-Control: public, max-age=86400, stale-while-revalidate=43200
   ```
