# Rekonsiliasi Periodik & Penyembuhan Mandiri Sinkronisasi (CoolCare AC)

Dokumen ini menjelaskan mekanisme audit dan rekonsiliasi periodik untuk menjamin integritas data kalender jangka panjang.

---

## 1. Tujuan Rekonsiliasi

Meskipun webhook dan antrean outbox menangani sinkronisasi harian, kondisi luar biasa seperti putusnya koneksi jaringan internet atau pemeliharaan server Google dapat menyebabkan *drift* (selisih data).

Proses Rekonsiliasi bertugas:
1. Menemukan event di Google Calendar yang hilang atau terhapus secara anomali.
2. Memeriksa konsistensi etag dan versi agregat event.
3. Memastikan semua pemesanan dengan status `CONFIRMED` dan `ASSIGNED` memiliki event resmi di Google Calendar.
4. Memperbarui cache interval sibuk eksternal pada tabel `ExternalCalendarEvent`.

---

## 2. Alur Eksekusi Rekonsiliasi Penuh (Full Sync)

Proses rekonsiliasi dapat dipicu melalui:
- **Tombol Manual**: Admin mengklik "Sinkronisasi Sekarang" di `/dashboard/integrations/google-calendar` (`POST /api/v1/admin/integrations/google/sync`).
- **Pembersihan Token Kedaluwarsa**: Otomatis terpicu saat webhook incremental sync menerima respon HTTP 410 Gone.
- **Job Pemilihan Kalender**: Otomatis dijadwalkan saat admin pertama kali memilih kalender.

### Langkah-langkah Rekonsiliasi:
1. Membaca seluruh event Google Calendar dalam jendela aktif (-30 hari hingga +90 hari).
2. Memisahkan event menjadi 2 grup berdasarkan metadata `extendedProperties.private.source`:
   - **Grup A (Managed Events)**:
     - Jika event cocok dengan `CalendarEventMapping`, bandingkan waktu mulai/selesai.
     - Jika waktu tidak cocok, catat konflik `REMOTE_EVENT_CHANGED`.
   - **Grup B (External Events)**:
     - Upsert data ke dalam tabel cache `ExternalCalendarEvent`.
     - Hapus entri cache yang sudah tidak ada lagi di Google Calendar.
3. Memperbarui `CalendarSyncState`:
   - Menyimpan `nextSyncToken` baru.
   - Memperbarui timestamp `lastFullSyncAt` dan `lastSuccessfulSyncAt`.
