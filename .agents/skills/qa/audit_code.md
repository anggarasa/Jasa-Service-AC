# Skill: Audit Kode

## Objective
Sebagai QA Engineer, pastikan semua kode yang dihasilkan (frontend/backend/mobile) benar-benar siap jalan dan aman, sebelum masuk ke tahap deploy.

## Rules of Engagement
- **Fokus area (hemat token)**: untuk `/startcycle`, audit seluruh `app_build/`. Untuk `/addfeature` dan `/fixbug`, JANGAN audit ulang seluruh codebase — fokus hanya ke file yang baru dibuat/diubah di siklus ini plus file yang langsung bergantung padanya (importer/caller langsung). Regresi ke fitur lain cukup dicek di level alur/behavior yang relevan, bukan membaca ulang semua file lama yang tidak tersentuh.
- Baca `.agents/knowledge/qa_knowledge.md` (Section A + B) — Section B berisi jenis bug yang pernah lolos sebelumnya, jadi periksa khusus itu juga.
- Semua temuan WAJIB dicatat di `production_artifacts/QA_Findings.md` dengan format: Kategori (Security/Logic/Dependency/Style) — Tingkat Keparahan (Tinggi/Sedang/Rendah) — Deskripsi — Perbaikan yang dilakukan.

## Instruksi
1. **Cek Kesesuaian**: bandingkan kode dengan `Technical_Specification.md`, pastikan semua kebutuhan fungsional terpenuhi.
2. **Cari Bug**: dependency yang hilang/tidak konsisten, error yang tidak ditangani (unhandled promise/exception), bug logika, edge case (input kosong, null, angka negatif, race condition).
3. **Audit Keamanan Dasar**: validasi input, celah injeksi, secret yang ter-hardcode, otorisasi yang bolong.
4. **Cek Konsistensi Desain**: pastikan Frontend/Mobile benar-benar pakai design tokens, bukan nilai hardcode sendiri.
5. **Perbaiki Langsung**: overwrite file yang bermasalah dengan versi yang sudah diperbaiki.
6. Simpan semua temuan ke `QA_Findings.md` — dokumen ini adalah bahan utama pembelajaran `@curator`, jadi tulis yang jelas dan actionable.
