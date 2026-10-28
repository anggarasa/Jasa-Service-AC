# Staging & Production Deployment Runbook
**Project**: TampilKit Studio — AC Service Booking System  
**Edition**: Basic Field Service (CoolCare AC Service)  
**Date**: 2026-10-28  

---

## 1. Prasyarat Infrastruktur & Lingkungan

- **Node.js**: v20.x LTS atau v22.x LTS (Terverifikasi kompatibel di Node v24.20.0).
- **npm**: Versi 10.x atau 11.x (HANYA npm, dilarang menggunakan pnpm/yarn/bun).
- **PostgreSQL**: PostgreSQL 15+ dengan ekstensi `btree_gist` aktif untuk GiST exclusion constraints.
- **MinIO / AWS S3**: Bucket privat (contoh: `tampilkit-ac-booking`) dengan kuota penyimpanan cukup.
- **Reverse Proxy**: NGINX atau Caddy dengan sertifikat SSL/TLS (HTTPS aktif).

---

## 2. Variabel Lingkungan Wajib (Environment Variables)

### Backend (`apps/backend/.env`)
```env
PORT=3001
NODE_ENV=production
DATABASE_URL="postgresql://user:secure_password@localhost:5432/tampilkit_ac_booking?schema=public"

# Enkripsi & Keamanan
JWT_ACCESS_SECRET="min-32-char-random-string-access-secret"
JWT_REFRESH_SECRET="min-32-char-random-string-refresh-secret"
APP_ENCRYPTION_KEY="32-char-hex-or-string-for-aes-256-gcm"
APP_ORIGIN="https://booking.coolcare.id"
COOKIE_DOMAIN=".coolcare.id"

# MinIO / S3 Object Storage
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="secure_minio_access_key"
MINIO_SECRET_KEY="secure_minio_secret_key"
MINIO_BUCKET="tampilkit-ac-booking"

# Integrasi Google Calendar (Opsional saat aktivasi)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REDIRECT_URI="https://api.coolcare.id/api/v1/admin/integrations/google/callback"
```

### Frontend (`apps/frontend/.env.production`)
```env
PORT=3000
NODE_ENV=production
NEXT_PUBLIC_API_URL="https://api.coolcare.id"
NEXT_PUBLIC_SITE_URL="https://booking.coolcare.id"
```

---

## 3. Urutan Langkah Deployment Produksi

### Langkah 1: Kloning & Pemasangan Dependensi Bersih
```bash
git clone <repository_url> /opt/coolcare-ac
cd /opt/coolcare-ac

# Gunakan npm ci untuk memastikan konsistensi lockfile
npm ci
```

### Langkah 2: Migrasi Database
> [!IMPORTANT]
> Dilarang menggunakan `prisma migrate dev` di server staging/produksi. Selalu gunakan `prisma migrate deploy` yang bersifat non-destruktif!

```bash
# Jalankan migrasi Prisma ke database PostgreSQL target
npx prisma migrate deploy --schema apps/backend/prisma/schema.prisma

# Generate Prisma Client
npm run db:generate -w @tampilkit-ac/backend
```

### Langkah 3: Bootstrap Akun Administrator Bawaan (Hanya Deployment Pertama)
```bash
npm run auth
```

### Langkah 4: Kompilasi Build Produksi
```bash
# Set memory limit Node.js untuk build Next.js yang optimal
export NODE_OPTIONS="--max-old-space-size=4096"

npm run build
```

### Langkah 5: Menjalankan Daemon Layanan Menggunakan Process Manager (PM2 / Systemd)

#### Contoh Konfigurasi PM2 (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [
    {
      name: 'tampilkit-backend',
      cwd: './apps/backend',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
    {
      name: 'tampilkit-calendar-worker',
      cwd: './apps/backend',
      script: 'node_modules/.bin/tsx',
      args: 'src/scripts/calendar-worker.ts',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'tampilkit-frontend',
      cwd: './apps/frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

Jalankan layanan:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 4. Uji Asap Pasca-Deployment (Post-Deployment Smoke Tests)

1. **Pemeriksaan Health Check API**:
   ```bash
   curl -i https://api.coolcare.id/api/v1/health
   # Respons yang diharapkan: HTTP 200 OK, {"status":"ok","database":"connected"}
   ```
2. **Pemeriksaan Halaman Utama Frontend**:
   ```bash
   curl -I https://booking.coolcare.id
   # Respons yang diharapkan: HTTP 200 OK
   ```
3. **Pemeriksaan Sitemap & SEO**:
   ```bash
   curl -s https://booking.coolcare.id/sitemap.xml | grep "urlset"
   ```
4. **Verifikasi Login Administrator**:
   Buka `https://booking.coolcare.id/login`, lakukan uji login dengan akun OWNER/ADMIN.
