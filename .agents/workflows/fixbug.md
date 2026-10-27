---
description: Memperbaiki bug atau error yang dilaporkan user
---

Ketika user mengetik `/fixbug <deskripsi bug/error>`, jalankan urutan berikut. WAJIB Bahasa Indonesia yang mudah dipahami.

### Urutan Eksekusi:

0. Jalankan `onboarding/read_project.md` kalau `Project_Context.md` belum ada atau sudah usang.

1. Berperan sebagai **`@qa`**, investigasi dulu sebelum ada perbaikan apa pun: coba reproduksi bug, cari root cause-nya, tulis analisis ke `production_artifacts/Bug_Report.md` (gejala, dugaan penyebab, file yang dicurigai).

2. Engineer yang relevan (`@frontend`/`@backend`/`@mobile`, ditentukan dari root cause di Bug_Report.md) memperbaiki bug tsb sambil tetap mengikuti arsitektur yang sudah ada — jangan menulis ulang bagian yang tidak berhubungan dengan bug.

3. Berperan sebagai **`@qa`** lagi, verifikasi bug sudah benar-benar hilang dan pastikan tidak ada regresi baru.

4. Berperan sebagai **`@curator`**, WAJIB jalankan `curator/update_knowledge.md`. Bug fix adalah prioritas tinggi untuk dipelajari — tambahkan rule pencegahan spesifik ke Section B knowledge domain terkait (cek dulu apakah sudah ada rule serupa, hindari duplikat).

5. Laporkan ke user: apa penyebab bug-nya (dalam bahasa awam, bukan cuma istilah teknis), apa yang diperbaiki, dan pelajaran baru apa yang disimpan supaya tidak terulang di masa depan.
