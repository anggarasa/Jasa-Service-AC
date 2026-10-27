# Knowledge Base: UI/UX Design

## Section A — Aturan Permanen (Level Enterprise)

### Teori Warna & Palet
- Gunakan prinsip **60-30-10**: 60% warna netral/dominan (background), 30% warna sekunder, 10% warna aksen (CTA, elemen penting).
- Pilih skema warna berdasarkan roda warna:
  - **Analogous** (warna bersebelahan di roda warna) → kesan harmonis, tenang.
  - **Complementary** (warna berlawanan) → kesan kontras, enerjik, cocok untuk aksen/CTA.
  - **Triadic** (tiga warna berjarak sama di roda warna) → kesan playful tapi tetap seimbang kalau proporsinya dijaga.
- Selalu sediakan skala netral (grayscale/neutral) minimal 5-7 tingkat (dari nyaris putih sampai nyaris hitam) untuk teks, border, dan background — jangan cuma hitam-putih polos.
- Warna semantik wajib konsisten di seluruh produk: hijau untuk sukses, merah untuk error/bahaya, kuning/oranye untuk peringatan, biru untuk informasi.
- **Aksesibilitas warna**: rasio kontras teks-background minimal 4.5:1 untuk teks normal (WCAG AA). Hindari kombinasi merah-hijau sebagai satu-satunya pembeda status (pertimbangkan buta warna) — tambahkan ikon/label teks juga.
- Hindari memilih warna brand HANYA karena "kelihatan modern" tanpa alasan — kaitkan pemilihan warna dengan karakter/emosi yang ingin disampaikan produk (contoh: biru tua = terpercaya/korporat, hijau = segar/sehat/finansial-positif, oranye = hangat/energik/ramah, ungu = premium/kreatif).

### Tipografi
- Maksimal 2 keluarga font dalam satu produk (1 untuk heading, 1 untuk body — boleh sama asal punya variasi weight yang cukup).
- Tentukan type scale yang konsisten (rasio umum: 1.2–1.333) untuk H1-H6, body, caption — jangan pilih ukuran font asal-asalan per halaman.
- Line-height body text idealnya 1.4–1.6x ukuran font untuk keterbacaan optimal.
- Ukuran teks body minimal 16px untuk web/mobile agar nyaman dibaca tanpa zoom.

### Spacing, Grid & Layout
- Gunakan skala spacing konsisten kelipatan 4px atau 8px (4, 8, 12, 16, 24, 32, 48, 64) — jangan pakai angka acak seperti 13px atau 27px.
- Grid system responsif (umumnya 12-kolom untuk web) dengan breakpoint jelas (mobile/tablet/desktop).
- Manfaatkan whitespace secara sengaja untuk membangun hierarki visual — elemen penting diberi ruang lebih, bukan dipadatkan.
- Hierarki visual dibangun lewat kombinasi ukuran, warna, dan posisi — elemen paling penting harus paling menonjol tanpa harus paling besar.

### Design Tokens & Tema
- Definisikan semua nilai visual (warna, spacing, radius, shadow, font) sebagai **token**, bukan nilai mentah yang ditulis ulang di banyak tempat — ini yang membuat dark mode/rebranding jadi gampang.
- Sediakan minimal dua tema: Light & Dark, dengan token semantik yang sama (`color-background`, `color-text-primary`, dst) tapi nilai berbeda — jangan hardcode warna literal di komponen.
- Border radius & shadow harus konsisten di seluruh komponen sejenis (semua button pakai radius yang sama, semua card pakai elevation yang sama).

### Menghindari Tampilan Generik
- Jangan otomatis pakai kombinasi "gradient ungu-ke-biru" khas template AI kecuali memang cocok dengan brand — cari kombinasi warna yang mencerminkan karakter produk secara spesifik.
- Beri identitas lewat detail kecil yang konsisten: gaya ikon (outline vs filled), gaya ilustrasi, micro-interaction (animasi hover/transisi singkat), bukan cuma warna.
- Pertimbangkan kompetitor/produk sejenis di brief PM — kalau semua kompetitor pakai warna biru korporat, pertimbangkan diferensiasi lewat warna lain (asalkan tetap masuk akal untuk industrinya).

### Komponen & Konsistensi
- Gunakan pola design system yang sudah teruji (Material Design 3, Human Interface Guidelines, atau library seperti Shadcn/Radix) sebagai KERANGKA, tapi kustomisasi token warna/tipografi supaya tetap terasa unik — jangan pakai default theme mentah-mentah.
- Semua state interaktif (default, hover, focus, active, disabled, loading, error) harus didesain eksplisit, bukan dibiarkan default browser/OS.

### Motion & Micro-interaction
- Animasi/transisi sebaiknya singkat (150–300ms) dan punya tujuan (memberi feedback, mengarahkan perhatian) — bukan sekadar hiasan yang memperlambat interaksi.
- Hormati preferensi `prefers-reduced-motion` untuk user yang sensitif terhadap animasi.

### Mobile vs Web
- Target area sentuh (tap target) minimal 44x44px di mobile untuk kenyamanan jari.
- Perhatikan safe area (notch, home indicator) di desain mobile.
- Web punya keleluasaan hover state; mobile harus punya alternatif untuk interaksi yang biasanya bergantung ke hover (mis. long-press, tap-to-reveal).

## Section B — Pembelajaran Dinamis (diisi otomatis oleh @curator)
> Format: `- [YYYY-MM-DD] [Kategori] Deskripsi pelajaran & cara mencegahnya.`

_(Belum ada entry.)_
