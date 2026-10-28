# Spesifikasi Fitur: Google Calendar OAuth, FreeBusy, Event Sync, Webhook & Reliability (Phase 10)
**Persona**: Lead Product Manager & Enterprise Architect (`@pm`)  
**Target Rilis**: Phase 10  
**Status**: DRAFT MENUNGGU PERSETUJUAN

---

## 1. Latar Belakang & Masalah Bisnis
CoolCare AC Service membutuhkan sinkronisasi dua arah dengan Google Calendar:
1. **Visibilitas Tim & Pemilik**: Pemilik dan admin bisnis menggunakan Google Calendar pada perangkat mereka untuk memantau agenda pemesanan servis AC harian.
2. **Blokir Waktu Eksternal (External Busy)**: Jika pemilik bisnis membuat jadwal acara sibuk (mis. libur bersama, renovasi gudang, rapat seluruh tim) di Google Calendar, sistem reservasi publik di website harus otomatis mengenali waktu tersebut dan menutup ketersediaan slot bagi pelanggan.
3. **Multi-Teknisi**: Bisnis memiliki beberapa teknisi lapangan. Kalender Google bisnis bersama bukanlah kalender milik satu orang teknisi. Ketersediaan per teknisi tetap diatur secara otoritatif oleh PostgreSQL Booking Engine. Acara Google Calendar yang dihasilkan dari Pemesanan A tidak boleh memblokir teknisi lain untuk melayani Pemesanan B di waktu yang sama.
4. **Reliabilitas**: Komunikasi jaringan ke Google API tidak boleh menghambat transaksi pemesanan pelanggan. Jika koneksi Google putus atau lambat, reservasi lokal tetap aman dan proses sinkronisasi ditangani secara asinkron melalui **Transactional Outbox Worker**.

---

## 2. Prinsip Arsitektur Utama (Basic v1)
1. **One Google Account & One Selected Calendar**: Bisnis menghubungkan satu akun Google resmi pemilik dan memilih satu kalender kerja.
2. **PostgreSQL Is Authoritative**: PostgreSQL adalah otoritas mutlak untuk integritas pemesanan, ketersediaan per teknisi, dan alokasi kapasitas. Google Calendar adalah proyeksi eksternal.
3. **Transactional Outbox**: Mutasi pemesanan (Konfirmasi, Reschedule, Batal, Ganti Teknisi) menulis pekerjaan ke tabel `CalendarSyncJob` dalam transaksi atomik yang sama. Worker memproses pekerjaan secara asinkron tanpa memblokir request HTTP pelanggan.
4. **Enkripsi Kredensial di Rest**: Refresh token dan access token Google dienkripsi menggunakan AES-256-GCM dengan kunci `GOOGLE_TOKEN_ENCRYPTION_KEY` di level server. Next.js dan browser tidak pernah menerima atau melihat token Google mentah.
5. **Fail-Closed Availability**: Bila Google Calendar terhubung namun status kesegaran external busy melampaui batas toleransi (stale/unreachable), mesin reservasi publik menolak pembukaan slot baru demi mencegah tabrakan jadwal (*fail-closed*), sementara reservasi yang telah terkonfirmasi tetap aman.

---

## 3. Skema Data Prisma (Ekstensi)
- `CalendarConnection`: Menyimpan status koneksi (`CONNECTED`, `DISCONNECTED`, `REAUTH_REQUIRED`), token terenkripsi, scopes, ID kalender terpilih, dan zona waktu.
- `CalendarEventMapping`: Memetakan relasi 1-to-1 unik antara `Booking` lokal dengan `externalEventId` dan ETag Google Calendar.
- `CalendarSyncJob`: Outbox antrean pekerjaan sinkronisasi dengan status (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED_RETRY`, `FAILED_PERMANENT`), lease lock expiry, dan jumlah percobaan retry.
- `CalendarSyncState`: Menyimpan `nextSyncToken` untuk sinkronisasi inkremental Google Calendar API.
- `CalendarWebhookChannel`: Mengelola pendaftaran Google Watch Channel, channel ID, resource ID, hash token verifikasi, dan waktu kedaluwarsa.
- `CalendarSyncConflict`: Mencatat konflik sinkronisasi (perubahan waktu di Google, penghapusan sepihak, overlap waktu eksternal).
- `ExternalCalendarEvent`: Menyimpan interval waktu sibuk non-aplikasi (`EXTERNAL_BUSY`) hasil sinkronisasi kalender terpilih.

---

## 4. Alur Integrasi & Fitur
1. **Alur OAuth 2.0 Server-Side**:
   - OWNER mengklik "Hubungkan Google Calendar" di `/dashboard/settings/integrations`.
   - Backend menghasilkan random state kriptografis yang terikat sesi OWNER.
   - Redirect ke Google Consent Screen dengan parameter `access_type=offline`.
   - Callback divalidasi state-nya, kode otorisasi ditukar dengan token, kredensial dienkripsi, dan OWNER diarahkan memilih kalender.
2. **Sinkronisasi Pemesanan ke Google Event**:
   - Pemesanan `CONFIRMED`: Worker membuat acara baru di Google Calendar dengan format judul dan deskripsi standar tanpa membocorkan data medis/sensitif.
   - Perubahan Jadwal (`Reschedule`): Worker memperbarui waktu acara yang sudah ada menggunakan `aggregateVersion` untuk mencegah race condition.
   - Pembatalan (`CANCELLED`): Worker menghapus acara terkait dari Google Calendar.
   - Pengalihan Teknisi: Worker memperbarui informasi teknisi pada deskripsi acara tanpa mengubah event ID atau waktu.
3. **Google FreeBusy & Availability Engine**:
   - Mesin ketersediaan mengevaluasi interval waktu eksternal. Event yang merupakan proyeksi pemesanan internal diabaikan (tidak dihitung ganda), sementara event eksternal murni memblokir slot seluruh teknisi.
4. **Google Webhook & Incremental Sync**:
   - Endpoint publik `POST /api/v1/webhooks/google-calendar` memvalidasi header channel Google dan token rahasia secara timing-safe, lalu menjadwalkan sinkronisasi inkremental dengan `syncToken`.
5. **Dashboard Integrasi & Manajemen Konflik**:
   - Halaman status integrasi (`/dashboard/integrations/google-calendar`), antrean pekerjaan (`/jobs`), dan resolusi konflik (`/conflicts`) untuk memulihkan event yang terhapus atau meninjau perubahan sepihak di Google.

---

## 5. Kriteria Penerimaan (Acceptance Criteria)
1. OWNER dapat menghubungkan dan memutuskan Google Calendar secara aman.
2. Kredensial OAuth dienkripsi menggunakan AES-256-GCM.
3. Event sinkron otomatis dibuat saat status booking menjadi `CONFIRMED`.
4. Event diperbarui saat terjadi `reschedule` dan dihapus saat terjadi `cancellation`.
5. Worker outbox menjamin idempotensi, retry eksponensial, dan lease-locking.
6. Multi-teknisi tetap dapat melayani pemesanan di slot waktu yang bersamaan.
7. Event eksternal yang dibuat di Google Calendar menutup ketersediaan publik secara otomatis.
8. Seluruh pengujian otomatis (OAuth, Event Sync, FreeBusy, Webhook, Concurrency) lulus 100%.
9. Dokumentasi teknis lengkap dan panduan Google Cloud Console tersedia.
