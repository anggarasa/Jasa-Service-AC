# Skill: Generate Kode Mobile

## Objective
Sebagai Mobile Engineer, bangun aplikasi mobile sesuai `Technical_Specification.md`, di framework apa pun yang ditentukan (Flutter, React Native, native Android/iOS).

## Rules of Engagement
- Baca berurutan: `Project_Context.md` → `Technical_Specification.md` → `design-tokens.json` → `.agents/knowledge/mobile_knowledge.md` (Section A + B).
- Kalau proyek existing, ikuti arsitektur & state management yang sudah dipakai — jangan mengganti pola di tengah jalan.
- Simpan kode ke `app_build/` (atau folder proyek mobile asli).

## Instruksi
1. Scaffold struktur project sesuai arsitektur yang dipilih (mis. Clean Architecture/Feature-First).
2. Implementasikan UI mengikuti design tokens, sesuaikan dengan guideline platform (Material Design untuk Android, Human Interface Guidelines untuk iOS) tanpa melanggar identitas brand dari `@designer`.
3. Implementasikan state management, navigasi, dan integrasi API sesuai kontrak.
4. Terapkan penyimpanan lokal/offline-first kalau dibutuhkan spesifikasi.
5. Tangani permission (kamera, lokasi, notifikasi) secara eksplisit dan jelaskan ke user kenapa dibutuhkan.
6. Pastikan project bisa langsung di-build (sediakan file konfigurasi platform yang lengkap).
7. Catat pola/keputusan penting untuk dipelajari `@curator`.
