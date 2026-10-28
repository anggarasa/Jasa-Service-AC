# Emergency Rollback Runbook
**Project**: TampilKit Studio — AC Service Booking System  
**Edition**: Basic Field Service (CoolCare AC Service)  
**Date**: 2026-10-28  

---

## 1. Pemicu Rollback (Rollback Triggers)

Prosedur rollback darurat harus segera diaktifkan jika salah satu kondisi berikut terdeteksi pasca-deployment:
1. **Peningkatan HTTP 5xx Error Rate > 2%** selama 5 menit berturut-turut.
2. **Kegagalan Total Autentikasi**: Pengguna staf tidak dapat login atau token selalu gagal di-refresh.
3. **Database Lock Contention / Deadlocks** yang menyebabkan transaksi pemesanan timeout.
4. **Kebocoran Data Pelanggan / Pelanggaran Otorisasi** (insiden keamanan kritis).

---

## 2. Tingkat Prosedur Rollback

### Level 1: Rollback Kode Frontend Saja (Next.js)
Jika masalah hanya terjadi pada antarmuka pengguna tanpa perubahan backend:
```bash
# Kembalikan ke rilis stabil sebelumnya via PM2 / git
pm2 stop tampilkit-frontend
git checkout <previous_stable_git_tag>
npm run build -w @tampilkit-ac/frontend
pm2 restart tampilkit-frontend
```

### Level 2: Rollback Kode Backend Saja (NestJS Fastify)
Jika masalah terjadi pada API logic tanpa perubahan skema database:
```bash
pm2 stop tampilkit-backend
pm2 stop tampilkit-calendar-worker

git checkout <previous_stable_git_tag>
npm run build -w @tampilkit-ac/api-contract
npm run build -w @tampilkit-ac/backend

pm2 restart tampilkit-backend
pm2 restart tampilkit-calendar-worker
```

### Level 3: Rollback Terkait Database (Schema & Data Rollback)
> [!CRITICAL]
> **Rollback database TIDAK SAMA dengan rollback aplikasi!**
> Jangan pernah membatalkan migrasi Prisma secara destruktif (`migrate down`) di lingkungan produksi jika tabel telah memuat transaksi riil pelanggan!
> Terapkan strategi *Forward-Fix* bila memungkinkan. Jika pemulihan snapshot mutlak diperlukan:

1. **Hentikan Segera Traffic Masuk**:
   Alihkan NGINX reverse proxy ke halaman pemeliharaan sementara (*Maintenance Page 503*):
   ```nginx
   return 503 "Sistem sedang dalam pemeliharaan berkala. Silakan coba kembali dalam 15 menit.";
   ```
2. **Hentikan Seluruh Worker & Backend**:
   ```bash
   pm2 stop all
   ```
3. **Pulihkan Snapshot Terakhir Sebelum Deployment**:
   Ikuti langkah `docs/BACKUP_RESTORE.md` untuk merestore backup database yang dibuat tepat sebelum deployment dimulai.
4. **Sinkronkan Berkas MinIO**:
   Pastikan objek berkas media yang dibuat selama window kegagalan diisolasi agar tidak ada orphaned records.
5. **Jalankan Aplikasi dengan Versi Kode Stabil**.
6. **Buka Kembali Akses Pengguna Publik**.
