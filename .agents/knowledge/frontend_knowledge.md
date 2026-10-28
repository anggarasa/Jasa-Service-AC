# Knowledge Base: Frontend Engineering

## Section A — Aturan Permanen (Level Enterprise)
> Bagian ini tidak boleh diubah oleh `@curator`. Hanya diedit manual oleh manusia.

### Arsitektur & Struktur
- Gunakan pola **Feature-First** (kelompokkan file per fitur, bukan per tipe file) untuk aplikasi menengah-besar; pola sederhana (per tipe file) cukup untuk proyek kecil.
- Pisahkan layer: UI Components (dumb/presentational) ↔ Hooks/Composables (logic) ↔ Services/API client (data fetching) ↔ Store/State.
- Satu komponen = satu tanggung jawab. Kalau sebuah komponen sudah > ~200 baris, pertimbangkan untuk dipecah.

### State Management
- Gunakan local state (`useState`/setup ref) untuk state yang hanya dipakai satu komponen.
- Gunakan global store (Zustand/Redux/Pinia) hanya untuk state yang benar-benar dibagi lintas fitur (auth, tema, cart).
- Gunakan server-state library (TanStack Query/SWR) untuk data dari API — jangan simpan hasil fetch API di global store manual, biarkan library yang urus cache & refetch.

### Performa
- Lazy-load route/komponen besar (code splitting).
- Gunakan memoization (`useMemo`/`useCallback`/`memo`) hanya kalau terbukti perlu (ada re-render mahal), bukan default di semua tempat.
- Virtualisasi untuk list panjang (>100 item).
- Optimasi gambar: format modern (WebP/AVIF), lazy loading, ukuran sesuai kebutuhan tampilan.

### Aksesibilitas (WCAG AA minimum)
- Semua elemen interaktif harus bisa diakses keyboard (tab order jelas, focus state terlihat).
- Kontras warna teks vs background minimal 4.5:1 untuk teks normal.
- Gunakan semantic HTML (`<button>`, `<nav>`, `<main>`) dan atribut ARIA hanya kalau semantic HTML tidak cukup.
- Semua gambar informatif wajib punya `alt text`.

### Keamanan
- Sanitasi semua konten yang dirender dari input user (cegah XSS) — jangan pakai `dangerouslySetInnerHTML`/`v-html` untuk konten mentah dari user tanpa sanitasi.
- Simpan token auth di memory/httpOnly cookie, hindari `localStorage` untuk data sensitif.
- Validasi input di client TETAP harus dibarengi validasi di server (client-side validation bisa dilewati).

### Kualitas Kode
- Konsisten satu gaya penamaan (camelCase untuk variabel/fungsi, PascalCase untuk komponen/class).
- Komentar hanya untuk logic kompleks/tidak intuitif — bukan menjelaskan hal yang sudah jelas dari kode itu sendiri.
- Error boundary/global error handler wajib ada, jangan biarkan aplikasi blank putih saat error.
- Environment config (URL API, feature flag) lewat `.env`, bukan hardcode.

### Testing
- Ikuti test pyramid: banyak unit test, sedang integration test, sedikit E2E test (mahal & lambat).
- Prioritaskan test untuk logic bisnis kritikal & komponen yang sering berubah.

## Section B — Pembelajaran Dinamis (diisi otomatis oleh @curator)
> Format: `- [YYYY-MM-DD] [Kategori] Deskripsi pelajaran & cara mencegahnya.`

- [2026-10-28] [Monorepo & Bundler] Jangan gunakan ekstensi file eksplisit (`./auth.js`) saat me-re-export modul TypeScript di paket monorepo bersama (`packages/api-contract/src/index.ts`). Next.js App Router Webpack bundler akan mencari file literal `.js` alih-alih `.ts` yang ada di source code internal workspace. Gunakan ekstensi bare `./auth` dengan `moduleResolution: "bundler"`.
- [2026-10-28] [API Client Security] Pada arsitektur HttpOnly cookie dengan Access Token pendek, tangani error 401 menggunakan antrean *single-flight refresh promise*. Ini mencegah peramban mengirimkan belasan panggilan `/refresh` secara bersamaan ketika beberapa komponen dashboard melakukan fetch paralel saat sesi kedaluwarsa.
- [2026-10-28] [App Router Layout Scoping & SEO] Jangan meletakkan Navbar atau Footer publik di root `app/layout.tsx` karena akan bocor ke layout halaman terproteksi (`/dashboard` dan `/technician`). Gunakan Route Group `app/(public)/layout.tsx` untuk membungkus halaman publik. Untuk dynamic SEO metadata dan JSON-LD Structured Data (`LocalBusiness`, `Service`), manfaatkan `generateMetadata` dengan fallback `notFound()` jika slug layanan tidak ditemukan di API.
- [2026-10-28] [BFF Proxy & HttpOnly Cookie Forwarding] Komponen client dashboard Next.js tidak dapat membaca cookie HttpOnly untuk otentikasi. Sediakan route handler proxy `/api/admin/[...path]` yang meneruskan header `cookie` dan mendukung payload `multipart/form-data` (upload file foto MinIO) langsung ke backend Fastify secara transparan tanpa mengekspos token ke JavaScript client.
- [2026-10-28] [Form UX & Debounced Duplicate Check] Pada pendaftaran entitas penting seperti Customer, terapkan pengecekan duplikasi nomor telepon secara *debounced* (400-500ms) menggunakan nomor yang telah dinormalisasi (+62). Tampilkan kandidat duplikat sebagai dialog konfirmasi informasi tanpa melakukan merger diam-diam (*silent merge*) yang berpotensi merusak data historis pelanggan.
- [2026-10-28] [Public Booking Wizard & Idempotency Key] Pada formulir wizard pemesanan publik multi-langkah (6-8 langkah), hasilkan `idempotencyKey` acak sekali saat komponen pertama kali dimuat (`useEffect`). Teruskan kunci tersebut saat submit transaksi ke backend guna mencegah reservasi ganda akibat lag koneksi atau double click pengguna. Untuk halaman konfirmasi dan pelacakan status tamu (`/booking/confirmation` dan `/booking/manage`), simpan token akses rahasia (64 karakter hex) yang diteruskan lewat parameter URL atau state peramban untuk otorisasi tanpa perlu akun login.
- [2026-10-28] [Admin Booking & Work Order Reactive State] Pada modul dashboard manajemen reservasi dan SPK lapangan (`/dashboard/bookings` dan `/dashboard/work-orders`), sediakan modal dialog aksi transaksional (konfirmasi, tolak, alihkan teknisi, reschedule, terbitkan SPK) dengan feedback interaktif langsung dan pembaruan data reaktif (`useCallback`). Gunakan URLSearchParams pada filter dan paginasi untuk memastikan navigasi antartabel tetap responsif dan konsisten saat berpindah halaman atau menyegarkan data.
- [2026-10-28] [Mobile-First Field Service & Multipart FormData Handling] Pada antarmuka teknisi lapangan (`/technician/*`), gunakan pendekatan mobile-first dengan sticky bottom navigation bar (`TechnicianBottomNav`) dan tautan langsung ke aplikasi native ponsel (`tel:`, WhatsApp prefilled URL, Google Maps search/directions). Pada `ApiClient`, deteksi apakah body request berupa `FormData` (`customConfig.body instanceof FormData`); jika ya, jangan set `Content-Type: application/json` agar peramban dapat menyetel boundary multipart secara otomatis untuk pengunggahan foto dokumentasi ke MinIO.
