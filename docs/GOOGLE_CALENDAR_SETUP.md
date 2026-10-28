# Panduan Setup Google Calendar API & OAuth 2.0 (CoolCare AC)

Dokumen ini memandu langkah demi langkah konfigurasi Google Cloud Console untuk integrasi resmi CoolCare AC Service Booking System (TampilKit Studio).

---

## 1. Pembuatan Proyek di Google Cloud Console

1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Masuk menggunakan akun Google bisnis atau administrator Google Workspace.
3. Klik dropdown proyek di bagian atas, lalu klik **New Project** (Proyek Baru).
4. Beri nama proyek: `CoolCare-AC-Booking-Production` (atau sesuai nama bisnis).
5. Pilih Organization/Folder jika ada, lalu klik **Create**.

---

## 2. Mengaktifkan Google Calendar API

1. Pada navigasi sebelah kiri, buka **APIs & Services** > **Library**.
2. Di kolom pencarian, ketik `Google Calendar API`.
3. Klik **Google Calendar API** dari Google Enterprise.
4. Klik tombol **Enable** (Aktifkan).

---

## 3. Konfigurasi OAuth Consent Screen (Layar Persetujuan OAuth)

1. Buka **APIs & Services** > **OAuth consent screen**.
2. Pilih User Type:
   - **Internal**: Jika menggunakan Google Workspace perusahaan (hanya staf perusahaan yang dapat login).
   - **External**: Jika menggunakan akun Gmail publik atau pelanggan eksternal (memerlukan mode Testing atau Verifikasi Aplikasi).
3. Klik **Create**.
4. Isi informasi aplikasi:
   - **App Name**: `CoolCare AC Booking System`
   - **User support email**: Email admin bisnis (misal: `owner@coolcare.id` atau `admin@coolcare.id`).
   - **App logo**: (Opsional) Logo CoolCare.
   - **Developer contact information**: Email pengembang.
5. Klik **Save and Continue**.
6. **Scopes (Cakupan Akses)**:
   - Klik **Add or Remove Scopes**.
   - Pilih cakupan akses kalender minimal:
     - `https://www.googleapis.com/auth/calendar.events` (Membaca dan menulis jadwal event).
     - `https://www.googleapis.com/auth/calendar.readonly` (Melihat daftar kalender).
     - `https://www.googleapis.com/auth/calendar.freebusy` (Mengecek ketersediaan waktu luang/sibuk).
   - Simpan dan lanjutkan.
7. **Test Users** (Jika status External & Testing):
   - Daftarkan akun Gmail yang akan digunakan untuk koneksi pertama kali (misal: `coolcare.ops@gmail.com`).
8. Klik **Back to Dashboard**.

---

## 4. Pembuatan Kredensial OAuth 2.0 (Web Application)

1. Buka **APIs & Services** > **Credentials**.
2. Klik **+ Create Credentials** > **OAuth client ID**.
3. Pilih Application Type: **Web application**.
4. Beri nama: `CoolCare AC Backend OAuth Client`.
5. **Authorized JavaScript Origins**:
   - `http://localhost:3000` (Frontend development)
   - `http://localhost:3001` (Backend development)
   - `https://ac.coolcare.id` (Production domain)
6. **Authorized redirect URIs (URI Pengalihan Resmi)**:
   - `http://localhost:3001/api/v1/admin/integrations/google/callback` (Backend API callback)
   - `https://api.coolcare.id/api/v1/admin/integrations/google/callback` (Production API callback)
7. Klik **Create**.
8. Simpan **Client ID** dan **Client Secret** yang ditampilkan dengan aman.

---

## 5. Konfigurasi Environment Variables

Buka file `.env` pada `apps/backend/` dan sesuaikan nilainya:

```env
# Google Calendar Integration Configuration
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/v1/admin/integrations/google/callback

# Kunci Enkripsi AES-256-GCM (Wajib 32 karakter atau acak berkekuatan tinggi)
GOOGLE_TOKEN_ENCRYPTION_KEY=d7a9b1c2e3f4a5b6c7d8e9f012345678a9b0c1d2e3f4567890abcdef12345678

# Webhook Push Notifications (Gunakan URL publik HTTPS seperti ngrok untuk lokal)
GOOGLE_WEBHOOK_PUBLIC_URL=https://webhook.coolcare.id
GOOGLE_WEBHOOK_CHANNEL_SECRET=tampilkit_coolcare_wh_secret_super_safe_key_99

# Worker Daemon Pengolah Outbox
GOOGLE_WORKER_ENABLED=true
```

---

## 6. Verifikasi Alur Koneksi

1. Jalankan aplikasi: `npm run dev`.
2. Masuk ke Dashboard Admin sebagai **OWNER** di `http://localhost:3000/login`.
3. Buka menu **Google Calendar Sync** (`/dashboard/integrations/google-calendar`).
4. Klik **Pengaturan Akun** (`/dashboard/settings/integrations/google`).
5. Klik **Hubungkan Akun Google Sekarang**.
6. Setujui izin di halaman consent Google.
7. Pilih kalender bisnis yang diinginkan (misal: kalender utama atau kalender operasional khusus).
8. Klik **Simpan Kalender**. Sinkronisasi pertama kali otomatis berjalan.
