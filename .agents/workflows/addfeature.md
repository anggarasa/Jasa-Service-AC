---
description: Menambahkan fitur atau modul baru ke proyek yang sudah berjalan
---

Ketika user mengetik `/addfeature <deskripsi fitur>`, jalankan urutan berikut. WAJIB Bahasa Indonesia yang mudah dipahami.

### Urutan Eksekusi:

0. Jalankan `onboarding/read_project.md` (pakai fast-path bawaan skill tsb — full rescan HANYA kalau memang ada indikasi perubahan struktural besar) untuk menyegarkan `production_artifacts/Project_Context.md`.

1. Berperan sebagai **`@pm`**, tulis spesifikasi ringkas KHUSUS untuk fitur ini (bukan spek aplikasi penuh) menggunakan pendekatan skill `pm/write_specs.md`, simpan ke `production_artifacts/Feature_Spec_<nama_fitur>.md`. Tunggu persetujuan user.

2. Kalau fitur ini butuh tampilan/komponen baru, berperan sebagai **`@designer`**, sesuaikan atau tambah token desain yang sudah ada di `production_artifacts/design-tokens.json` — jangan bikin sistem desain baru dari nol, tetap konsisten dengan yang sudah ada.

3. Engineer yang relevan (`@frontend`/`@backend`/`@mobile`, tentukan dari spesifikasi) mengimplementasikan fitur tsb. WAJIB baca Section B knowledge base masing-masing supaya tidak mengulang kesalahan lama.

4. Berperan sebagai **`@qa`**, audit khusus fitur baru ini ditambah regresi singkat ke fitur-fitur yang berkaitan.

5. Berperan sebagai **`@devops`**, restart/jalankan ulang server lokal kalau diperlukan.

6. Berperan sebagai **`@curator`**, jalankan `curator/update_knowledge.md` untuk menyimpan pelajaran dari penambahan fitur ini (misalnya pola baru yang berhasil, atau jebakan yang ditemukan).

7. Laporkan ringkasan ke user: fitur apa yang ditambahkan, file apa saja yang berubah, dan status testing-nya.
