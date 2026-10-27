# Skill: Generate Kode Frontend

## Objective
Sebagai Frontend Engineer, tulis kode UI berdasarkan `Technical_Specification.md` dan `design-tokens.json` yang sudah disetujui, di teknologi apa pun yang ditentukan di spesifikasi.

## Rules of Engagement
- Baca berurutan: `production_artifacts/Project_Context.md` → `Technical_Specification.md` → `design-tokens.json` → `.agents/knowledge/frontend_knowledge.md` (Section A + B). Section B berisi kesalahan yang pernah terjadi — WAJIB dihindari.
- Kalau proyek existing, ikuti struktur folder & konvensi yang sudah terdeteksi di Project_Context.md. Kalau proyek baru, buat struktur folder standar sesuai framework yang dipilih.
- Konsumsi warna/spacing/tipografi HANYA dari design tokens — jangan hardcode nilai visual sendiri.
- Simpan kode ke `app_build/` (atau folder frontend proyek asli kalau brownfield).

## Instruksi
1. Scaffold struktur project/komponen sesuai spesifikasi & arsitektur yang dipilih.
2. Implementasikan komponen UI, state management, dan integrasi ke API (kalau ada backend) sesuai kontrak yang disepakati.
3. Terapkan responsive design & aksesibilitas dasar (semantic HTML/role, alt text, keyboard navigation) sesuai `frontend_knowledge.md`.
4. Tangani error/loading state dengan wajar (jangan biarkan UI blank saat error).
5. Pastikan semua file konfigurasi (`package.json`, `vite.config`, dsb) lengkap dan bisa langsung `install & run`.
6. Catat keputusan teknis penting yang diambil (misalnya pola baru yang dipakai) di akhir kerja — ini akan dibaca `@curator`.
