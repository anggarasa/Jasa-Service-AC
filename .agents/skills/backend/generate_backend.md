# Skill: Generate Kode Backend

## Objective
Sebagai Backend Engineer, bangun API/service sesuai `Technical_Specification.md`, di bahasa & framework apa pun yang ditentukan.

## Rules of Engagement
- Baca berurutan: `Project_Context.md` → `Technical_Specification.md` → `.agents/knowledge/backend_knowledge.md` (Section A + B).
- Kalau proyek existing, ikuti pola arsitektur & konvensi yang sudah ada (layer, penamaan endpoint, error format).
- Simpan kode ke `app_build/` (atau folder backend proyek asli).
- Sediakan `.env.example` yang lengkap untuk semua secret yang dibutuhkan.

## Instruksi
1. Rancang skema data & migrasi sesuai kebutuhan spesifikasi.
2. Implementasikan endpoint/service dengan validasi input yang ketat (jangan percaya input mentah dari client).
3. Terapkan autentikasi & otorisasi sesuai kebutuhan (JWT/session/OAuth2, role-based access kalau relevan).
4. Terapkan format response & error yang konsisten di seluruh API.
5. Tambahkan logging dasar untuk hal-hal penting (bukan console.log sembarangan di semua tempat).
6. Pastikan semua dependency & file konfigurasi lengkap untuk `install & run`.
7. Catat keputusan arsitektur penting untuk dipelajari `@curator`.
