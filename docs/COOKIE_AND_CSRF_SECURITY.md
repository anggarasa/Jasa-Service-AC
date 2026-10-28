# Keamanan Cookie, CSRF & Pencegahan Serangan (Phase 02)

## 1. Kebijakan Cookie Autentikasi

Semua token autentikasi disimpan dalam cookie peramban dengan konfigurasi ketat:

| Atribut Cookie | Nilai Produksi | Nilai Pengembangan Lokal | Tujuan Keamanan |
|---|---|---|---|
| **Name** | `tk_ac_access`, `tk_ac_refresh` | `tk_ac_access`, `tk_ac_refresh` | Identifikasi token khusus aplikasi TampilKit |
| **HttpOnly** | `true` | `true` | Mencegah skrip JavaScript (XSS) membaca token |
| **Secure** | `true` (HTTPS) | `false` (HTTP `localhost`) | Memastikan token hanya dikirim melalui koneksi terenkripsi |
| **SameSite** | `Lax` | `Lax` | Mencegah pengiriman cookie pada request lintas domain (Cross-Site) |
| **Path** | `/` | `/` | Mencakup seluruh rute aplikasi yang valid |

---

## 2. Mitigasi Serangan CSRF (Cross-Site Request Forgery)

Kombinasi mekanisme proteksi berikut diterapkan untuk mencegah eksploitasi CSRF:
1. **Kebijakan `SameSite=Lax`**:
   - Peramban modern secara ketat menolak melampirkan cookie pada permintaan `POST`, `PUT`, `DELETE`, atau `PATCH` yang diinisiasi oleh situs pihak ketiga (*cross-site request*).
2. **Same-Origin BFF Proxy Architecture**:
   - Seluruh pemanggilan dari browser klien diarahkan ke origin yang sama (`/api/auth/*`).
   - Route handler Next.js memeriksa header `Origin` dan `Host` pada setiap mutasi sebelum meneruskan permintaan ke backend NestJS.
3. **Payload Content-Type Enforcement**:
   - NestJS API mewajibkan header `Content-Type: application/json` untuk semua payload mutasi data (`POST`, `PATCH`, `DELETE`). Peramban tidak dapat mengirimkan JSON secara lintas situs tanpa memicu pemeriksaan pra-penerbangan CORS (Preflight `OPTIONS`).

---

## 3. Mitigasi Serangan Brute-Force & Denial of Service

### Rate Limiting Berbasis Database PostgreSQL
- Setiap percobaan login dicatat dalam tabel `RateLimitRecord` berdasarkan kombinasi IP klien dan email target.
- Batasan: **Maksimum 5 percobaan gagal dalam jendela 15 menit**.
- Jika batas terlampaui, backend mengembalikan `HTTP 429 Too Many Requests` disertai sisa waktu tunggu dalam detik.
- Catatan laju dibersihkan secara otomatis begitu login berhasil.

### Kebijakan Password Kuat (OWASP Guidelines)
- Minimal **12 karakter**.
- Wajib memiliki setidaknya satu huruf besar, satu huruf kecil, satu angka, dan satu karakter simbol/tanda baca.
- Hash password dihitung menggunakan algoritma **Argon2id** (memory cost: 65,536 KiB, time cost: 3 iterations, parallelism: 4 threads).

---

## 4. Audit Keamanan & Deteksi Anomali

Tabel `AuthAuditLog` mencatat setiap aksi krusial autentikasi:
- `LOGIN_SUCCESS` / `LOGIN_FAILURE` (dengan alasan kegagalan yang aman tanpa membocorkan eksistensi user)
- `TOKEN_REFRESH`
- `TOKEN_REUSE_DETECTED` (peringatan tingkat tinggi)
- `LOGOUT` / `LOGOUT_ALL`
- `PASSWORD_CHANGE`
- `SESSION_REVOCATION`

Data sensitif seperti kata sandi dan nilai raw token **TIDAK PERNAH** dicatat dalam log audit.
