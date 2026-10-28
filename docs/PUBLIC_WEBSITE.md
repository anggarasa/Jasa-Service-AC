# Arsitektur Website Publik & Pengalaman Pengguna (Phase 04)

## 1. Ikhtisar

Website publik TampilKit AC Service Booking System dirancang khusus untuk mempresentasikan layanan servis AC profesional (*CoolCare AC Service*) dengan prinsip transparansi harga, informasi jangkauan wilayah yang jelas, dan kemudahan reservasi.

Seluruh data yang ditampilkan di halaman publik diambil secara dinamis dari **NestJS Public REST API** yang terhubung langsung ke **PostgreSQL** dan **MinIO Object Storage**, tanpa menggunakan mock data statis.

---

## 2. Struktur Rute Publik (Next.js App Router)

Semua rute publik diorganisasikan di bawah Route Group `(public)` sehingga URL publik tetap bersih dan tidak tercemar oleh nama folder:

| Rute URL | Tipe Rendering | Deskripsi & Komponen Utama |
|---|---|---|
| `/` | Server Component (`revalidate: 60s`) | **Beranda**: Hero dengan CTA ganda, Katalog Layanan Terpopuler, Keunggulan, 4 Langkah Pelayanan, Pratinjau Area, Pratinjau Galeri, Kontak CTA. |
| `/services` | Server Component + Client Filter | **Katalog Lengkap**: Filter kategori, pencarian teks, kartu layanan, indikator tipe harga, dan paginasi. |
| `/services/[slug]` | Dynamic Route (`generateMetadata`) | **Detail Layanan**: Foto cover, deskripsi lengkap, batas unit, estimasi durasi, harga transparan, pengingat area layanan, tombol booking, dan daftar layanan terkait. |
| `/service-areas` | Server Component (`revalidate: 60s`) | **Cakupan Wilayah**: Daftar area operasional dikelompokkan per Kota/Provinsi, ongkos kunjungan terpisah, dan estimasi waktu perjalanan teknisi. |
| `/gallery` | Server Component + Client Lightbox | **Galeri Dokumentasi**: Grid foto pengerjaan servis AC dengan lightbox interaktif beraksesibilitas tinggi (keyboard nav, prev/next, alt text). |
| `/about` | Server Component (`revalidate: 60s`) | **Tentang Kami**: Profil bisnis, spesialisasi kategori nyata, prinsip pengerjaan, dan pratinjau galeri. |
| `/contact` | Server Component (`revalidate: 60s`) | **Kontak & Jam Kerja**: Alamat operasional, peta Google Maps, tautan WhatsApp terenkode, dan jadwal jam kerja 7 hari lengkap dengan jeda istirahat dan hari libur. |
| `/booking` | Server Component + Param Inspector | **Reservasi / Booking Entry**: Membaca parameter query `?service={id}`, menampilkan ringkasan layanan yang dipilih, dan menyediakan tombol pemesanan langsung via WhatsApp / telepon menjelang Phase 07. |
| `/sitemap.xml` | Metadata Route | Sitemap XML dinamis yang mencakup seluruh halaman publik dan detail layanan aktif. |
| `/robots.txt` | Metadata Route | Konfigurasi perayap mesin pencari dengan proteksi direktori privat (`/dashboard/`, `/technician/`, `/api/`). |

---

## 3. Komponen Desain & Konsistensi UI

Sistem menggunakan sistem desain yang selaras dengan tema CoolCare:
- **Primary Color**: `#142C52` (Deep Navy) — Mencerminkan kestabilan, profesionalitas, dan kepercayaan.
- **Accent Color**: `#0891B2` (Cool Cyan) — Mencerminkan udara sejuk, kesegaran, dan teknologi modern.
- **Background**: `#F8FAFC` (Slate 50) dengan kartu putih bersih (`#FFFFFF`).
- **Tipografi**: Font sans-serif Geist yang modern dan mudah dibaca pada berbagai resolusi.
- **Aksesibilitas (WCAG 2.2 AA)**: Kontras warna teruji, navigasi keyboard penuh pada menu dan lightbox, label aria pada tombol interaktif, dan teks alternatif pada seluruh gambar.
