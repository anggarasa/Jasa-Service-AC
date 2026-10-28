# Keamanan OAuth 2.0 & Enkripsi Token di TampilKit AC

Dokumen ini menjelaskan arsitektur keamanan, proteksi kriptografi, dan mitigasi risiko terkait autentikasi Google Calendar OAuth 2.0.

---

## 1. Perlindungan State Parameter (Mitigasi Serangan CSRF & Replay)

Protokol OAuth 2.0 rentan terhadap serangan CSRF jika parameter `state` dapat ditebak atau digunakan berulang kali. TampilKit menerapkan mitigasi bertingkat:

### Struktur State Token:
Format state yang dihasilkan oleh `GoogleOAuthService`:
```text
state = {businessId}:{userId}:{timestamp}:{nonce}:{signature}
```

- **businessId**: Memastikan token hanya berlaku untuk entitas bisnis resmi yang meminta.
- **userId**: Menghubungkan sesi otorisasi dengan pengguna admin/owner yang sah.
- **timestamp**: Unix timestamp (milidetik). State memiliki masa kedaluwarsa maksimal **10 menit**.
- **nonce**: 16-byte acak berkekuatan kriptografi (`crypto.randomBytes(16)`).
- **signature**: HMAC-SHA256 dari seluruh payload menggunakan kunci rahasia server `GOOGLE_TOKEN_ENCRYPTION_KEY`.

### Mekanisme Single-Use (Anti-Replay):
Setiap state yang diterima diverifikasi keaslian tanda tangannya menggunakan perbandingan waktu konstan `crypto.timingSafeEqual` untuk mencegah *timing attack*. State yang sudah tervalidasi langsung dicatat ke memori `usedStates` dan tidak dapat digunakan untuk kedua kalinya.

---

## 2. Enkripsi Token Rest (At-Rest Protection via AES-256-GCM)

Google Access Token dan Refresh Token tidak pernah disimpan dalam bentuk teks biasa (plaintext) di database PostgreSQL.

### Parameter Kriptografi:
- **Algoritma**: AES-256-GCM (Authenticated Encryption with Associated Data - AEAD).
- **Panjang Kunci**: 256-bit (32 bytes) diturunkan secara deterministik dari `GOOGLE_TOKEN_ENCRYPTION_KEY` menggunakan SHA-256.
- **Inisialisasi Vektor (IV / Nonce)**: 96-bit (12 bytes) acak unik untuk **setiap** operasi enkripsi (`crypto.randomBytes(12)`). Tidak pernah terjadi penggunaan ulang IV (IV reuse vulnerability dicegah).
- **Authentication Tag (Auth Tag)**: 128-bit (16 bytes) tag otentikasi GCM yang menjamin integritas data dan mencegah manipulasi ciphertext.

### Format Penyimpanan di Kolom PostgreSQL:
Format terstandarisasi yang disimpan pada tabel `CalendarConnection` kolom `encryptedAccessToken` dan `encryptedRefreshToken`:
```text
{iv_hex}:{auth_tag_hex}:{ciphertext_hex}
```
Jika ciphertext dimanipulasi sekecil 1 bit saja, pemanggilan `decrypt()` akan gagal dengan pengecualian (*decryption tag mismatch*).

---

## 3. Isolasi Arsitektur Frontend & Backend

- **No Raw Token Exposure**: Browser Next.js tidak pernah menerima token mentah Google (baik access token maupun refresh token).
- **Backend Authorization**: Komunikasi antara browser dan server dilindungi dengan cookie HttpOnly `tk_ac_access` berotentikasi JWT dan verifikasi status sesi PostgreSQL.
- **RBAC Strict Enforcement**: Hanya pengguna dengan peran `OWNER` yang berhak melakukan inisiasi koneksi (`GET /connect`), pemilihan kalender (`POST /calendar`), dan pemutusan akses (`DELETE /`). Pengguna dengan peran `ADMIN` hanya dapat melihat metrik, antrean outbox, dan resolusi konflik.

---

## 4. Prinsip Least Privilege Scopes

Aplikasi hanya meminta izin Google Calendar minimal yang esensial:
1. `https://www.googleapis.com/auth/calendar.events` (membuat, mengubah, dan menghapus event operasional AC).
2. `https://www.googleapis.com/auth/calendar.readonly` (membaca daftar kalender pengguna untuk dipilih).
3. `https://www.googleapis.com/auth/calendar.freebusy` (membaca jadwal waktu sibuk).

Aplikasi **tidak pernah** meminta hak akses ke layanan Google lain seperti Gmail, Google Drive, atau profil identitas Google di luar keperluan kalender.
