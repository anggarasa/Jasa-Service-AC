# Skill: Membuat Sistem Desain (UI/UX)

## Objective
Sebagai UI/UX Designer, tentukan identitas visual produk (warna, tipografi, spacing, gaya komponen) SEBELUM ada satu baris kode UI ditulis, supaya Frontend & Mobile Engineer konsisten dan hasilnya tidak terlihat "generik ala AI".

## Rules of Engagement
- Baca `production_artifacts/Technical_Specification.md` (khususnya bagian "Kebutuhan Desain") dan `.agents/knowledge/design_knowledge.md` (Section A + B).
- Output WAJIB dua file:
  1. `production_artifacts/Design_System.md` — dokumen naratif berisi alasan/rationale pemilihan desain.
  2. `production_artifacts/design-tokens.json` — token desain yang bisa langsung dikonsumsi engineer (warna, spacing, radius, shadow, tipografi), dalam format key-value netral yang gampang dikonversi ke CSS variables / Tailwind config / Flutter ThemeData / dsb.
- Kalau proyek existing sudah punya design token, JANGAN bikin dari nol — sesuaikan/lengkapi yang sudah ada.

## Instruksi
1. **Pahami Karakter Produk**: dari brief PM, tentukan 2-3 kata sifat yang mendeskripsikan brand (mis. "modern, terpercaya, hangat"). Kalau brief kurang jelas, buat asumsi masuk akal dan sebutkan asumsi itu di dokumen — jangan berhenti hanya untuk ini.
2. **Palet Warna** (rujuk Section A `design_knowledge.md` untuk teori warnanya):
   - Tentukan 1 warna primer, 1 warna sekunder/aksen, skala warna netral (untuk teks & background), dan warna semantik (success/warning/error/info).
   - Pastikan rasio kontras teks-vs-background memenuhi standar aksesibilitas (minimal AA).
   - Sediakan varian Light Mode dan Dark Mode.
3. **Tipografi**: pilih pasangan font (heading & body) yang sesuai karakter brand, tentukan type scale (ukuran H1-H6, body, caption) dan line-height.
4. **Spacing & Radius**: pakai skala konsisten (kelipatan 4px/8px), tentukan radius sudut & shadow/elevation untuk memberi kedalaman visual.
5. **Prinsip Layout**: tentukan pendekatan hierarki visual (spacing, ukuran, warna untuk mengarahkan mata user) dan breakpoint responsif dasar.
6. **Hindari Generik**: jangan otomatis pakai gradient ungu-biru atau kombinasi "AI default" kecuali memang cocok dengan brand — jelaskan alasan pemilihan warna/font di dokumen supaya terasa punya identitas sendiri.
7. Simpan kedua file, lalu tanyakan singkat ke user apakah arah desain ini sudah pas (boleh dilewati kalau user sudah bilang "lanjut tanpa review desain").
