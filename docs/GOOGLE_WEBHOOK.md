# Google Calendar Push Notification Webhook (CoolCare AC)

Dokumen ini menjelaskan integrasi webhook push notification untuk menerima pembaruan instan dari Google Calendar.

---

## 1. Pendaftaran Watch Channel

Ketika admin memilih kalender, sistem mendaftarkan saluran pantau (*Watch Channel*) melalui endpoint Google Calendar API:
`POST https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events/watch`

Parameter pendaftaran:
- `id`: UUID unik channel yang dibuat di PostgreSQL (`CalendarWebhookChannel`).
- `type`: `web_hook`
- `address`: `{GOOGLE_WEBHOOK_PUBLIC_URL}/api/v1/webhooks/google-calendar`
- `token`: Token rahasia channel yang di-hash menggunakan HMAC-SHA256 (`verificationTokenHash`).
- `params.ttl`: Waktu aktif saluran (standar 7 hari / 604800 detik).

---

## 2. Verifikasi Header & Keamanan Webhook

Google mengirimkan HTTP POST notification dengan header khusus:
- `x-goog-channel-id`: ID saluran.
- `x-goog-channel-token`: Token verifikasi.
- `x-goog-resource-id`: ID sumber daya Google.
- `x-goog-resource-state`: Status kejadian (`sync`, `exists`, `not_exists`).

### Prosedur Validasi:
1. Jika `x-goog-resource-state === 'sync'`, ini adalah konfirmasi handshake pembukaan saluran. Server merespons `HTTP 200 OK` segera.
2. Token verifikasi `x-goog-channel-token` di-hash dengan SHA-256 dan dibandingkan menggunakan `crypto.timingSafeEqual` dengan nilai di database. Jika tidak cocok, request ditolak dengan `HTTP 401 Unauthorized`.
3. Setelah tervalidasi, pemrosesan sinkronisasi bertahap (*incremental sync*) dijalankan secara asinkron lewat `setImmediate()` sehingga webhook dapat membalas Google dalam waktu **< 500 milidetik** untuk menghindari timeout atau pencabutan saluran oleh Google.

---

## 3. Penanganan HTTP 410 Gone (Token Kedaluwarsa)

Jika `syncToken` Google telah kedaluwarsa atau invalid (ditandai dengan kode balasan `HTTP 410 Gone` saat memanggil `events.list`):
1. `CalendarSyncService` menangkap error tersebut secara elegan.
2. Sistem secara otomatis menghapus token yang kedaluwarsa.
3. Menjalankan **Full Sync** ulang tanpa membuang pemetaan booking lokal yang valid.
4. Memperbarui `nextSyncToken` baru hasil rekonsiliasi.
