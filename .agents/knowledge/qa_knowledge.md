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

### 2026-10-28 — Validasi Rilis, Integritas Relasional & Exclusion Constraints (Phase 12)
- **Konteks**: Eksekusi pengujian komprehensif release readiness (238 automated tests), pengujian konkurensi database PostgreSQL GiST, dan audit keamanan OWASP ASVS 5.0.0.
- **Pelajaran**:
  1. **Integritas Alokasi Ulang Teknisi**: Saat melakukan penetapan ulang teknisi (`assignTechnician` / `reassignTechnician`) pada jadwal yang telah memiliki okupansi teknisi sebelumnya (misalnya dari alokasi awal tamu), okupansi aktif lama untuk booking tersebut WAJIB dibatalkan (`status = 'CANCELLED'`) di dalam transaksi atomik sebelum membuat okupansi baru, guna mencegah pelanggaran kernel PostgreSQL exclusion constraint `no_overlapping_technician_occupancy`.
  2. **Urutan Cascading Teardown Pengujian**: Saat membersihkan data fixture pengujian relasional dengan constraint `RESTRICT`, urutan pembersihan wajib mengikuti hierarki dependensi terbalik: `PaymentReceipt` $\rightarrow$ `Payment` $\rightarrow$ `Invoice` $\rightarrow$ `WorkOrder` $\rightarrow$ `Booking` $\rightarrow$ `CustomerAddress` $\rightarrow$ `Customer`.
  3. **Tiga Dimensi Keputusan Rilis**: Selalu pisahkan keputusan `TECHNICAL_READINESS` (berbasis bukti uji teknis), `BUSINESS_ACCEPTANCE` (berbasis sign-off stakeholder nyata), dan `PRODUCTION_AUTHORIZATION` (izin deployment eksplisit). Kesiapan teknis tidak boleh otomatis dianggap sebagai izin rilis ke server produksi live.
