# Panduan Setup Monorepo — TampilKit AC Booking

## 1. Prasyarat Lingkungan
- Node.js >= 22.0.0 (Disarankan Node.js 22 LTS atau 24 LTS)
- npm >= 10.0.0
- npm Workspaces (bukan Yarn, pnpm, atau Bun)
- PostgreSQL Server lokal
- MinIO Object Storage (Docker Desktop)

## 2. Struktur Monorepo
```text
tampilkit-ac-booking/
├── apps/
│   ├── frontend/         # Next.js App Router (@tampilkit-ac/frontend)
│   └── backend/          # NestJS Fastify (@tampilkit-ac/backend)
├── packages/
│   └── api-contract/     # Shared DTOs, Zod & Types (@tampilkit-ac/api-contract)
├── docs/                 # Dokumentasi arsitektur & panduan teknis
├── package.json          # Root npm workspaces
└── package-lock.json     # Single root lockfile
```

## 3. Instalasi Dependensi
Jalankan di root repositori:
```bash
npm install
```
Semua dependensi monorepo akan diinstal dan di-hoist secara otomatis dengan satu `package-lock.json` di root.

## 4. Perintah Operasional
| Perintah | Deskripsi |
|---|---|
| `npm run dev` | Menjalankan frontend (port 3000) dan backend (port 3001) secara bersamaan |
| `npm run dev:frontend` | Menjalankan frontend Next.js saja |
| `npm run dev:backend` | Menjalankan backend NestJS Fastify saja |
| `npm run build` | Melakukan build pada shared contract, backend, dan frontend |
| `npm run lint` | Menjalankan audit linter di seluruh workspace |
| `npm run typecheck` | Menjalankan pemeriksaan tipe TypeScript di seluruh workspace |
| `npm run test` | Menjalankan unit test di backend dan frontend |
| `npm run db:generate` | Menghasilkan Prisma Client |
| `npm run db:migrate` | Menjalankan migrasi database PostgreSQL |
| `npm run db:seed` | Menjalankan data seed awal yang idempoten |
