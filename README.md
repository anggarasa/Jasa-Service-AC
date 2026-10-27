# 🚀 Pipeline Developer Otonom Multi-Role (Tech-Agnostic) — untuk Antigravity IDE

Pipeline ini adalah tim development AI otonom yang bisa dipakai untuk **teknologi apa pun** — web (frontend/backend), mobile, atau kombinasi fullstack — dan **belajar dari setiap siklus kerja** supaya kesalahan yang sama tidak terulang.

## Struktur Folder

```
.agents/
├── agents.md              # Definisi 8 persona tim
├── workflows/              # Perintah garis miring (slash command)
│   ├── startcycle.md       # /startcycle <ide>      -> mulai proyek/fitur besar dari nol
│   ├── addfeature.md       # /addfeature <deskripsi> -> tambah fitur ke proyek existing
│   └── fixbug.md           # /fixbug <deskripsi>     -> perbaiki bug yang dilaporkan
├── skills/                 # Manual kerja tiap peran
│   ├── onboarding/read_project.md
│   ├── pm/write_specs.md
│   ├── design/design_system.md
│   ├── frontend/generate_frontend.md
│   ├── backend/generate_backend.md
│   ├── mobile/generate_mobile.md
│   ├── qa/audit_code.md
│   ├── devops/deploy_app.md
│   └── curator/update_knowledge.md
└── knowledge/               # Basis pengetahuan level enterprise per domain
    ├── project_context.md   # Riwayat konteks proyek (auto-update)
    ├── frontend_knowledge.md
    ├── backend_knowledge.md
    ├── mobile_knowledge.md
    ├── qa_knowledge.md
    ├── devops_knowledge.md
    └── design_knowledge.md  # Termasuk teori warna, tipografi, tema

production_artifacts/   # Dokumen hasil kerja tiap agent (spec, design system, QA findings, dll)
app_build/                # Lokasi kode aplikasi yang dihasilkan (untuk proyek baru)
```

## Cara Pakai

1. **Copy folder `.agents/`** ini ke root proyek Anda di Antigravity IDE (baik proyek baru maupun proyek yang sudah berjalan). Kalau proyek Anda sudah punya folder sendiri untuk kode (misalnya `src/`), Anda tetap bisa pakai folder itu — pipeline akan mendeteksinya lewat `onboarding/read_project.md`, tidak harus pakai `app_build/`.
2. Buka Agent Manager di Antigravity, mulai percakapan baru di workspace project Anda.
3. Gunakan salah satu perintah berikut sesuai kebutuhan:

   - **Proyek baru / fitur besar dari nol**:
     ```
     /startcycle "Saya butuh aplikasi kasir untuk toko retail, ada web admin dan aplikasi mobile untuk kasir"
     ```
   - **Menambah fitur ke proyek yang sudah ada**:
     ```
     /addfeature "Tambahkan fitur export laporan penjualan ke Excel"
     ```
   - **Memperbaiki bug**:
     ```
     /fixbug "Tombol checkout tidak merespon saat keranjang lebih dari 10 item"
     ```

4. Ikuti alurnya: **@pm** akan menyusun spesifikasi dan minta persetujuan Anda dulu (Anda bisa komentar langsung di file `Technical_Specification.md`), lalu **@designer** menyiapkan tema visual, baru engineer yang relevan (**@frontend/@backend/@mobile**) membangun kodenya, **@qa** mengaudit, **@devops** menjalankannya, dan **@curator** menyimpan pelajaran baru dari siklus tersebut.

## Bagaimana Pipeline Ini "Belajar" (Self-Learning)

Setiap knowledge base di `.agents/knowledge/` punya dua bagian:

- **Section A** — aturan permanen level enterprise (sudah diisi lengkap di pipeline ini: arsitektur, keamanan, performa, UI/UX, dst). Bagian ini hanya boleh diubah manual oleh Anda.
- **Section B** — pelajaran dinamis yang otomatis bertambah setiap kali `@curator` menjalankan `curator/update_knowledge.md` di akhir siklus `/startcycle`, `/addfeature`, atau `/fixbug`. Isinya adalah pola kesalahan nyata yang pernah terjadi beserta cara mencegahnya — dan `@curator` selalu cek duplikasi dulu sebelum menambah entry baru, supaya knowledge base tidak berantakan.

Semakin sering pipeline ini dipakai, semakin "pintar" tim AI ini terhadap gaya kerja & jebakan-jebakan spesifik di proyek Anda.

## Optimasi Hemat Token (Update)

Pipeline ini sudah disesuaikan supaya lebih hemat penggunaan token model AI, terutama untuk pemakaian jangka panjang di proyek yang sama:

- **Tidak ada lagi aturan yang diulang-ulang**: aturan clean-code, no-hardcode-secret, dsb dulu ditulis ulang di `agents.md` DAN di tiap file skill. Sekarang cukup sekali di `agents.md`.
- **`onboarding/read_project.md` punya fast-path**: kalau `Project_Context.md` sudah ada dan tidak ada indikasi perubahan besar, pipeline tidak lagi membaca ulang semua file config/dokumentasi dari nol setiap `/startcycle` atau `/addfeature` — cukup pakai context yang sudah ada.
- **QA audit lebih terarah**: untuk `/addfeature` dan `/fixbug`, `@qa` hanya mengaudit file yang benar-benar berubah (plus yang langsung bergantung padanya), bukan menyisir ulang seluruh `app_build/` setiap kali.
- **Section B knowledge base dijaga tetap ringkas**: `@curator` sekarang wajib menjaga entry tetap padat (±25 kata) dan memadatkan/menggabungkan entry lama begitu satu domain sudah punya >20 entry — supaya knowledge base yang dibaca ulang di setiap siklus tidak membengkak tanpa batas seiring waktu.
- **Dokumen antar-agent (`Technical_Specification.md`, dst) ditulis lebih padat**: tidak lagi menempel ulang isi knowledge base secara penuh, cukup dirujuk.

## Prinsip Utama yang Dipegang Semua Agent

- Selalu komunikasi ke Anda dalam Bahasa Indonesia yang sederhana.
- Selalu baca struktur folder & aturan proyek yang ada dulu sebelum kerja (tidak asal timpa kode).
- Clean code: komentar hanya di bagian penting/kompleks/sensitif, bukan di setiap baris.
- Tidak pernah hardcode secret/credential.
- Konsisten pakai design tokens untuk semua elemen visual (bukan warna/spacing hardcode sembarangan).
