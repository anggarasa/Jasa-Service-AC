---
description: Mulai siklus pengembangan penuh dari sebuah ide baru (bisa web, backend, mobile, atau kombinasinya)
---

Ketika user mengetik `/startcycle <ide>`, orkestrasikan proses berikut secara ketat menggunakan `.agents/agents.md` dan skill-skill di `.agents/skills/`. WAJIB gunakan Bahasa Indonesia yang sederhana dan mudah dipahami di semua komunikasi ke user.

### Urutan Eksekusi:

0. Jalankan skill `onboarding/read_project.md` (ikuti fast-path di skill tsb — cukup full scan kalau memang perlu) untuk memahami struktur folder & aturan proyek yang sudah ada (kalau proyek baru/kosong, catat itu sebagai "greenfield project"). Simpan hasilnya ke `production_artifacts/Project_Context.md`.

1. Berperan sebagai **Product Manager (`@pm`)**, jalankan skill `pm/write_specs.md` menggunakan `<ide>`.
   *(WAJIB berhenti dan tunggu persetujuan user. Kalau user memberi komentar/revisi langsung di file Markdown atau di chat, baca ulang dokumen, terapkan perubahan, lalu minta persetujuan lagi. Ulangi sampai user bilang "Setuju"/"Approved".)*

2. Berperan sebagai **UI/UX Designer (`@designer`)**, jalankan skill `design/design_system.md` berdasarkan spesifikasi yang sudah disetujui.
   *(Tunggu persetujuan singkat user terhadap Design_System.md, kecuali user sudah bilang "lanjut tanpa review desain".)*

3. Berdasarkan bagian "Tech Stack" di spesifikasi, jalankan engineer yang relevan (boleh lebih dari satu, berurutan sesuai dependency — biasanya backend dulu baru frontend kalau frontend butuh kontrak API):
   - Ada frontend web → berperan sebagai **Frontend Engineer (`@frontend`)**, jalankan `frontend/generate_frontend.md`.
   - Ada backend/API → berperan sebagai **Backend Engineer (`@backend`)**, jalankan `backend/generate_backend.md`.
   - Ada aplikasi mobile → berperan sebagai **Mobile Engineer (`@mobile`)**, jalankan `mobile/generate_mobile.md`.

4. Berperan sebagai **QA Engineer (`@qa`)**, jalankan `qa/audit_code.md`. Catat semua temuan bug/celah keamanan secara terstruktur ke `production_artifacts/QA_Findings.md`, lalu perbaiki langsung.

5. Berperan sebagai **DevOps Master (`@devops`)**, jalankan `devops/deploy_app.md`.

6. Berperan sebagai **Knowledge Curator (`@curator`)**, jalankan `curator/update_knowledge.md` untuk mempelajari seluruh siklus ini (terutama temuan `@qa` dan keputusan penting `@pm`/`@designer`), lalu perbarui Section B knowledge base yang relevan.

7. Tutup dengan ringkasan akhir ke user dalam Bahasa Indonesia: apa yang berhasil dibangun, di mana lokasinya, cara menjalankannya/link lokalnya, dan pelajaran baru apa yang baru saja disimpan `@curator`.
