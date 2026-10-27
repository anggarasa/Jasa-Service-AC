# Skill: Baca Struktur & Aturan Proyek

## Objective
Sebelum agen mana pun bekerja, pipeline ini harus paham dulu proyek yang sedang dihadapi: apakah proyek baru (greenfield) atau proyek yang sudah berjalan (brownfield), teknologi apa yang dipakai, bagaimana struktur foldernya, dan aturan kerja apa yang sudah ada. Ini yang membuat pipeline ini bisa dipakai untuk teknologi apa pun.

## Hemat Token: Fast-Path Kalau Context Masih Segar
Sebelum melakukan full scan (langkah 1-3 di bawah), cek dulu `production_artifacts/Project_Context.md`:
- Kalau file itu ADA dan ditulis di siklus sebelumnya, DAN belum ada indikasi perubahan besar (mis. `package.json`/manifest dependency lain tidak berubah, tidak ada folder baru di level atas), maka LEWATI full re-read semua file. Cukup baca ringkas `Project_Context.md` yang sudah ada, konfirmasi masih relevan, lalu lanjut — jangan buka ulang semua file dokumentasi/config/konvensi dari nol.
- Kalau ragu perubahan besar terjadi atau belum pernah dijalankan sama sekali, baru lakukan full scan penuh (langkah 1-4 di bawah).
- Ini fast-path hemat token untuk `/addfeature` dan `/fixbug` yang sering dipanggil berkali-kali di proyek yang sama tanpa perubahan struktural.

## Instruksi (Full Scan)

1. **Deteksi jenis proyek**: Cek apakah `app_build/` (atau folder proyek utama) berisi file selain kosong/placeholder. Kalau kosong → proyek baru. Kalau ada isi → proyek existing.

2. **Kalau proyek existing, baca file-file kunci berikut kalau ada**:
   - Dokumentasi: `README.md`, `CONTRIBUTING.md`, `docs/`
   - Manifest dependency: `package.json`, `pubspec.yaml`, `requirements.txt`, `pyproject.toml`, `composer.json`, `pom.xml`, `go.mod`, `Cargo.toml`
   - Konfigurasi linter/format: `.eslintrc*`, `.prettierrc*`, `analysis_options.yaml`, `.editorconfig`
   - Konfigurasi environment: `.env.example` (JANGAN pernah baca isi `.env` asli yang berisi secret)
   - Struktur folder utama (`src/`, `lib/`, `app/`, `features/`, `modules/`, dst) — pahami pola arsitektur yang sudah dipakai (mis. feature-first, layer-first, MVC, Clean Architecture).
   - Konvensi commit (`commitlint.config.js`, riwayat commit terakhir kalau ada akses git).

3. **Deteksi tech stack** dari kombinasi file di atas (bahasa, framework, package manager, database, state management library, dsb). Jangan menebak — kalau ambigu, catat sebagai "perlu dikonfirmasi ke user" alih-alih asal pilih.

4. **Rangkum semua temuan** ke `production_artifacts/Project_Context.md` dengan format:
   - **Status Proyek**: Baru / Existing
   - **Tech Stack Terdeteksi**: (bahasa, framework, versi kalau ada)
   - **Struktur Folder**: pohon direktori ringkas + penjelasan singkat pola arsitekturnya
   - **Konvensi yang Teramati**: penamaan file/variabel, gaya coding, aturan linter
   - **Dependency Utama**: daftar library penting yang sudah dipakai
   - **Catatan untuk Tim**: hal-hal yang harus diikuti (misal: "proyek ini sudah pakai Shadcn UI, jangan install UI library lain")

5. **Perbarui juga** `.agents/knowledge/project_context.md` — ini versi jangka panjang yang terus diperbarui tiap siklus (update bagian yang berubah, jangan timpa total riwayat penting yang masih relevan).

6. Kalau proyek baru (kosong), cukup catat "Belum ada context sebelumnya, seluruh keputusan stack mengikuti hasil spesifikasi PM" — jangan mengarang struktur yang belum ada.
