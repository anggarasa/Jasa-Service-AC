# Skill: Deploy Aplikasi

## Objective
Sebagai DevOps Master, kemas aplikasi dan jalankan servernya berdasarkan stack apa pun yang terdeteksi.

## Rules of Engagement
- Baca `.agents/knowledge/devops_knowledge.md` (Section A + B).

## Instruksi
1. **Deteksi Stack**: cek `Technical_Specification.md` dan file yang ada di `app_build/` (package.json, requirements.txt, pubspec.yaml, go.mod, dsb) untuk menentukan cara install & jalankan yang tepat.
2. **Install Dependency**: jalankan perintah yang sesuai (`npm install`, `pip install -r requirements.txt`, `flutter pub get`, dsb) lewat terminal native.
3. **Jalankan Secara Lokal**: eksekusi perintah start yang sesuai (`npm run dev`, `python3 app.py`, `flutter run`, dsb) di background.
4. **Cek Kesehatan**: pastikan server benar-benar hidup (bukan cuma "command jalan tanpa error") sebelum melapor sukses.
5. **Laporkan**: kasih link localhost (atau instruksi run untuk mobile) ke user dengan jelas, dan rayakan kalau berhasil.
6. Kalau proses gagal, catat error-nya dengan jelas dan coba perbaiki (misal versi Node/Python yang tidak cocok) sebelum menyerah dan melapor ke user.
