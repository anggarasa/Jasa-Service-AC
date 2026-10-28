# Backup & Disaster Recovery Runbook
**Project**: TampilKit Studio — AC Service Booking System  
**Edition**: Basic Field Service (CoolCare AC Service)  
**Date**: 2026-10-28  

---

## 1. Sasaran Pemulihan Bencana (RPO & RTO Targets)

| Metrik Target | Target Enterprise | Catatan Operasional |
|---|---|---|
| **Recovery Point Objective (RPO)** | $\le$ 1 Jam | Maksimal toleransi kehilangan data transaksional sejak backup terakhir. |
| **Recovery Time Objective (RTO)** | $\le$ 30 Menit | Waktu maksimal dari kegagalan server hingga sistem kembali beroperasi normal. |

---

## 2. Prosedur Pencadangan Database (PostgreSQL)

### A. Perintah Backup Terjadwal (pg_dump)
Pencadangan database dilakukan menggunakan format kustom terkompresi (`-Fc`) yang mendukung restore multi-thread berkecepatan tinggi:

```bash
# Direktori penyimpanan backup
BACKUP_DIR="/var/backups/tampilkit-ac"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/coolcare_ac_backup_${TIMESTAMP}.dump"

# Eksekusi pencadangan terkompresi
pg_dump -h localhost -p 5432 -U postgres -d tampilkit_ac_booking -Fc -f "${BACKUP_FILE}"

# Enkripsi arsip backup menggunakan GPG (opsional untuk offsite storage)
gpg --symmetric --cipher-algo AES256 "${BACKUP_FILE}"
```

### B. Prosedur Pemulihan Database (pg_restore)
> [!CAUTION]
> Jangan pernah memulihkan database secara langsung di atas database produksi yang sedang berjalan tanpa backup darurat terakhir!

```bash
# 1. Buat database isolasi uji coba atau target restore
createdb -h localhost -p 5432 -U postgres tampilkit_ac_restored

# 2. Pulihkan data menggunakan pg_restore
pg_restore -h localhost -p 5432 -U postgres -d tampilkit_ac_restored --clean --if-exists --no-owner "${BACKUP_FILE}"

# 3. Verifikasi integritas tabel & record
psql -h localhost -p 5432 -U postgres -d tampilkit_ac_restored -c "SELECT count(*) FROM \"Booking\";"
psql -h localhost -p 5432 -U postgres -d tampilkit_ac_restored -c "SELECT count(*) FROM \"Invoice\";"
```

---

## 3. Prosedur Pencadangan Berkas Media (MinIO S3)

Objek berkas foto SPK dan bukti bayar disimpan di bucket privat MinIO `tampilkit-ac-booking`.

### A. Sinkronisasi Backup Menggunakan MinIO Client (mc)
```bash
# Konfigurasi alias minio lokal
mc alias set local_minio http://localhost:9000 minioadmin minioadmin123

# Cermin bucket ke direktori backup lokal atau remote S3 cold-storage
mc mirror --overwrite local_minio/tampilkit-ac-booking /var/backups/tampilkit-ac/minio-objects/
```

### B. Pemulihan Berkas MinIO
```bash
# Kembalikan seluruh objek ke bucket baru atau bucket target
mc mb local_minio/tampilkit-ac-booking --ignore-existing
mc mirror /var/backups/tampilkit-ac/minio-objects/ local_minio/tampilkit-ac-booking/
```

---

## 4. Validasi Konsistensi Relasi MediaAsset

Setelah pemulihan database dan MinIO selesai, jalankan kueri validasi untuk memastikan seluruh `MediaAsset.objectKey` benar-benar ada di MinIO:

```bash
# Jalankan skrip verifikasi keberadaan objek
npx tsx -e "
import { PrismaClient } from '@prisma/client';
import * as Minio from 'minio';

const prisma = new PrismaClient();
const minio = new Minio.Client({
  endPoint: 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: 'minioadmin',
  secretKey: 'minioadmin123',
});

async function verify() {
  const assets = await prisma.mediaAsset.findMany();
  console.log('Total MediaAsset terdaftar:', assets.length);
  for (const a of assets) {
    try {
      await minio.statObject(a.bucket, a.objectKey);
    } catch (e) {
      console.error('Objek hilang di MinIO:', a.objectKey);
    }
  }
  console.log('Verifikasi integritas media selesai.');
  await prisma.\$disconnect();
}
verify();
"
```
