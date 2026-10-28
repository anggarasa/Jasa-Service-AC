# Transactional Outbox Worker Daemon (CoolCare AC)

Dokumen ini menjelaskan arsitektur antrean asinkron (Transactional Outbox) dan pemrosesan latar belakang untuk sinkronisasi Google Calendar.

---

## 1. Konsep Transactional Outbox

Setiap mutasi booking (pembuatan jadwal baru, penugasan teknisi, perubahan jam servis, atau pembatalan) dicatat ke dalam database PostgreSQL bersamaan dengan pencatatan entri pekerjaan di tabel `CalendarSyncJob` dalam satu transaksi ACID (`prisma.$transaction`).

Keuntungan arsitektur ini:
- **Zero Loss Mutation**: Tidak ada jadwal yang gagal terkirim ke Google jika terjadi lonjakan beban atau gangguan jaringan sesaat.
- **Dekopel Latensi**: Respons API booking ke pelanggan atau admin tetap instan tanpa terhambat latensi jaringan panggilan HTTP Google Calendar.
- **Idempotensi**: Setiap pekerjaan memiliki identitas unik dan nomor versi agregat (`aggregateVersion`).

---

## 2. Penguncian Sewa (Lease Locking) & Retry Eksponensial

Worker prosesor (`CalendarJobProcessor`) bekerja dengan mekanisme:
1. **Polling Berkala**: Memeriksa antrean setiap 5 detik.
2. **Klaim Atomik**: Mengambil hingga 5 pekerjaan berstatus `PENDING` atau `FAILED_RETRY` yang siap dieksekusi (`nextAttemptAt <= NOW()`) dan tidak sedang dikunci oleh worker lain (`lockedUntil IS NULL OR lockedUntil < NOW()`).
3. **Lease Lock**: Mengunci pekerjaan selama **60 detik** dengan ID worker aktif.
4. **Retry Bertahap**:
   - Jika panggilan Google API gagal karena kendala jaringan atau rate-limit (HTTP 429 / 503):
     - Pekerjaan ditandai `FAILED_RETRY`.
     - Jumlah percobaan dinaikkan (`attemptCount++`).
     - Jadwal percobaan berikutnya dihitung dengan *exponential backoff*:
       $$\text{Delay} = 2^{\text{attemptCount}} \times 10 \text{ detik}$$
   - Jika jumlah percobaan mencapai batas maksimal (5 kali), status diubah menjadi `FAILED_PERMANENT` dan dicatat di log pemantauan admin.

---

## 3. Menjalankan Worker Daemon

Worker dapat dijalankan terintegrasi dalam server backend (diaktifkan via environment variable `GOOGLE_WORKER_ENABLED=true`) atau sebagai proses mandiri khusus:

```bash
# Menjalankan worker sebagai proses latar belakang mandiri
npm run calendar:worker -w @tampilkit-ac/backend
```
Worker mendukung *graceful shutdown* terhadap sinyal `SIGINT` dan `SIGTERM`.
