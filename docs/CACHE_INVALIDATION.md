# Kebijakan Cache & Kesegaran Data Publik (Phase 04)

## 1. Model Kesegaran Data (Incremental Static Regeneration)

Untuk memastikan bahwa website publik berkinerja tinggi, mampu menangani lonjakan lalu lintas pengunjung (*traffic spike*), namun tetap mencerminkan perubahan yang dilakukan administrator secara cepat, sistem menerapkan model **Time-To-Live (TTL) Revalidation**:

- **Frekuensi Kesegaran (`revalidate = 60`)**:
  Halaman publik utama (`/`, `/services`, `/service-areas`, `/gallery`, `/about`, `/contact`) dikonfigurasi dengan interval revalidasi 60 detik (1 menit).
- **Mekanisme Stale-While-Revalidate**:
  Pengunjung disajikan halaman yang telah di-prerender secara instan dari cache edge/server. Pada saat bersamaan, request pertama yang datang setelah lewat batas 60 detik akan memicu regenerasi halaman di latar belakang menggunakan data terbaru dari PostgreSQL.

---

## 2. Propagasi Perubahan Admin ke Halaman Publik

Alur konsistensi admin-to-public telah diuji dan diverifikasi secara otomatis:
1. **Pembaruan Harga / Layanan**:
   Ketika OWNER atau ADMIN memperbarui harga dasar layanan atau menonaktifkan layanan di dashboard `/dashboard/services`, perubahan tersebut seketika tersimpan di PostgreSQL.
2. **Refleksi pada API Publik**:
   Panggilan ke endpoint `GET /api/v1/public/services` seketika menyaring layanan yang dinonaktifkan atau merefleksikan harga baru secara langsung tanpa jeda database.
3. **Refleksi pada Tampilan Publik**:
   Dalam jendela maksimal 60 detik (atau saat server Next.js di-deploy/restart), halaman publik `/services` dan `/services/[slug]` menyajikan data termutakhir.
4. **Isolasi Cache Autentikasi**:
   Data sesi staf, header token, dan rute dashboard `/dashboard/*` bersifat `dynamic` dan **TIDAK PERNAH** disimpan di dalam cache publik.
