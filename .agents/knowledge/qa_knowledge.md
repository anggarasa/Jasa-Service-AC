# Knowledge Base: Quality Assurance

## Section A — Aturan Permanen (Level Enterprise)

### Strategi Testing
- Ikuti test pyramid: unit test (banyak, cepat) → integration test (sedang) → E2E test (sedikit, mahal, tapi krusial untuk alur utama).
- Prioritaskan pengujian alur bisnis kritikal (checkout, login, pembayaran) dibanding fitur pinggiran.

### Checklist Audit Kode
- **Dependency**: semua import/package yang dipakai benar-benar terdaftar di manifest (package.json/pubspec.yaml/requirements.txt), tidak ada versi yang konflik.
- **Error Handling**: semua promise/async wajib di-handle (tidak ada unhandled rejection), semua try tanpa catch yang kosong ditandai.
- **Edge Case**: input kosong/null/undefined, angka negatif/nol, string sangat panjang, karakter spesial, koneksi terputus di tengah proses.
- **Concurrency**: race condition pada operasi yang saling bergantung (mis. dua request update data yang sama bersamaan).
- **Konsistensi Desain**: warna/spacing/font benar-benar dari design tokens, bukan hardcode manual yang menyimpang.

### Audit Keamanan Dasar (rujukan OWASP)
- Input yang tidak divalidasi/disanitasi di sisi manapun.
- Secret/API key yang ter-hardcode atau ter-commit.
- Endpoint yang seharusnya butuh auth tapi bisa diakses tanpa token.
- Pesan error yang membocorkan detail internal (stack trace, struktur database) ke user/client.

### Klasifikasi Tingkat Keparahan
- **Tinggi**: aplikasi crash, data hilang/rusak, celah keamanan yang mengekspos data sensitif.
- **Sedang**: fitur tidak berjalan sesuai spesifikasi tapi ada workaround, bug UI yang mengganggu tapi tidak menghentikan alur utama.
- **Rendah**: masalah kosmetik, inkonsistensi kecil yang tidak memengaruhi fungsi.

### Pelaporan
- Setiap temuan harus actionable: sebutkan lokasi (file/baris/endpoint), langkah reproduksi, dan perbaikan yang dilakukan — bukan sekadar "ada bug di sini".

## Section B — Pembelajaran Dinamis (diisi otomatis oleh @curator)
> Format: `- [YYYY-MM-DD] [Kategori] Deskripsi pelajaran & cara mencegahnya.`

_(Belum ada entry.)_
