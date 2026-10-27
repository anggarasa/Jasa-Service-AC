# Skill: Perbarui Knowledge Base (Self-Learning)

## Objective
Ini adalah inti dari kemampuan belajar pipeline ini. Setiap kali sebuah siklus (`/startcycle`, `/addfeature`, `/fixbug`) selesai, `@curator` bertugas mengekstrak pelajaran baru dari siklus tersebut dan menyimpannya supaya kesalahan yang sama tidak terulang lagi di masa depan — tanpa pernah menduplikasi rule yang sudah ada.

## Rules of Engagement
- Sumber utama pembelajaran: `production_artifacts/QA_Findings.md`, `production_artifacts/Bug_Report.md` (kalau ada), dan keputusan penting dari `@pm`/`@designer` selama siklus berjalan.
- Setiap knowledge base (`frontend_knowledge.md`, `backend_knowledge.md`, `mobile_knowledge.md`, `qa_knowledge.md`, `devops_knowledge.md`, `design_knowledge.md`) punya dua bagian:
  - **Section A**: aturan permanen level enterprise — TIDAK PERNAH diubah oleh `@curator`.
  - **Section B**: pelajaran dinamis hasil belajar dari siklus nyata — ini yang di-update `@curator`.
- TIDAK PERNAH menyimpan data sensitif (password, API key, PII user) ke knowledge base.

## Instruksi
1. **Kumpulkan Temuan**: baca semua temuan QA dan keputusan penting dari siklus yang baru selesai.
2. **Generalisasi**: ubah temuan yang sifatnya spesifik-proyek jadi pelajaran yang berlaku umum. Contoh: bukan "lupa validasi field `nama_lengkap` di form booking", tapi "form dengan field wajib harus divalidasi di sisi client DAN server, jangan andalkan salah satu saja".
3. **Cek Duplikasi**: untuk tiap pelajaran, scan Section B knowledge base yang relevan — kalau sudah ada rule yang mirip, perjelas/perkuat rule lama itu (bukan menambah entry baru). Kalau benar-benar baru, baru tambahkan entry baru.
4. **Format Entry Baru** di Section B:
   `- [YYYY-MM-DD] [Kategori] Deskripsi pelajaran singkat & cara mencegahnya di masa depan.`
5. **Prioritaskan** pelajaran dari `/fixbug` — itu adalah bukti nyata sebuah kesalahan terjadi di production/development, jadi harus benar-benar dicatat rule pencegahannya.
6. Setelah update, laporkan singkat ke user (2-3 kalimat) pelajaran baru apa yang baru saja disimpan, ke domain knowledge base mana.

## Hemat Token: Jaga Ukuran Section B
Section B dibaca ULANG SECARA PENUH oleh agent terkait di SETIAP siklus berikutnya — kalau dibiarkan tumbuh terus, ini jadi biaya token tetap yang membengkak selamanya. Jadi:
- **Entry wajib padat**: satu baris, maksimal ~25 kata, tanpa contoh kode/log panjang. Detail teknis lengkap cukup ada di `QA_Findings.md`/`Bug_Report.md` siklus terkait (arsipnya tetap ada di riwayat/git), Section B hanya menyimpan intisari rule-nya.
- **Batas jumlah entry aktif**: kalau satu knowledge base sudah punya > 20 entry di Section B, JANGAN cuma menambah — lakukan pemadatan dulu: gabungkan entry-entry dengan tema/kategori yang sama jadi satu poin ringkasan (mis. 4 entry soal "validasi form" jadi satu bullet gabungan), baru tambahkan pelajaran baru. Entry yang sudah tercakup rule Section A (jadi berulang/tidak perlu lagi) dihapus.
- Jangan tambahkan entry yang sifatnya sangat spesifik-sekali-pakai (nama variabel/file spesifik proyek ini) kalau tidak ada nilai generalisasi ke proyek lain — itu menambah token tanpa manfaat jangka panjang.
