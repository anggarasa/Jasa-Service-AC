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

_(Belum ada entry. Akan terisi otomatis seiring pipeline dipakai untuk membangun fitur & memperbaiki bug.)_
