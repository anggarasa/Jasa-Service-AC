# Knowledge Base: DevOps

## Section A — Aturan Permanen (Level Enterprise)

### Deteksi & Instalasi
- Selalu deteksi package manager yang benar dari lockfile yang ada (`package-lock.json` → npm, `yarn.lock` → yarn, `pnpm-lock.yaml` → pnpm) — jangan asal pakai satu tool untuk semua proyek.
- Cek versi runtime yang dibutuhkan (engines di package.json, `.python-version`, dsb) sebelum install, supaya tidak salah versi.

### Environment
- Pisahkan konfigurasi dev/staging/production lewat file `.env` berbeda, jangan pernah commit `.env` asli ke repo (pastikan ada di `.gitignore`).
- Sediakan `.env.example` yang lengkap sebagai dokumentasi variabel yang dibutuhkan.

### Containerization (kalau relevan)
- Gunakan multi-stage build di Dockerfile untuk memperkecil image final.
- Jangan jalankan proses sebagai root user di dalam container kalau bisa dihindari.

### Deployment
- Pilih strategi deploy yang sesuai skala (rolling update untuk kebanyakan kasus; blue-green/canary untuk aplikasi kritikal berskala besar).
- Selalu punya rencana rollback yang jelas kalau deployment baru bermasalah.

### Observability
- Pastikan ada health check endpoint yang dicek sebelum traffic diarahkan ke instance baru.
- Kumpulkan log secara terpusat (bukan tersebar di tiap server) kalau skala sudah lebih dari satu instance.

### Keamanan Infrastruktur
- Prinsip least privilege: service account/API key hanya diberi akses yang benar-benar dibutuhkan.
- Tutup port yang tidak dipakai, jangan expose database langsung ke internet publik.

## Section B — Pembelajaran Dinamis (diisi otomatis oleh @curator)
> Format: `- [YYYY-MM-DD] [Kategori] Deskripsi pelajaran & cara mencegahnya.`

- [2026-10-28] [Windows / NPM Workspace] Pada environment Windows, skrip package.json yang menggunakan `|| true` akan gagal karena command `true` tidak dikenali oleh cmd.exe. Konfigurasikan ESLint 9 flat config (`eslint.config.mjs`) secara eksplisit di tiap workspace agar linter berjalan deterministik tanpa bergantung pada trik fallback shell.
- [2026-10-28] [TypeScript Monorepo Resolution] Pada NestJS backend CommonJS, `"moduleResolution": "node"` wajib didefinisikan di tsconfig agar resolusi internal workspace symlink `@tampilkit-ac/api-contract` dapat menemukan declaration file (`.d.ts`) setelah paket shared dibangun (`tsc -b`).
