# Keamanan Pemesanan Guest & Manajemen Privasi

## 1. Token Akses Kriptografis (`BookingAccessToken`)
- Pada saat checkout guest berhasil dibuat, sistem menghasilkan token acak 32-byte (64 karakter heksadesimal).
- Token di-hash menggunakan **SHA-256** sebelum disimpan di database:
  - Database hanya menyimpan `tokenHash`.
  - Token mentah (*plaintext*) hanya dikembalikan satu kali pada respons pembuatan booking dan disimpan di peramban pengguna.
- Pelanggan dapat memantau status pemesanannya di `/booking/manage?token=...` tanpa perlu mendaftarkan akun atau login kata sandi.

---

## 2. Isolasi Kode Pemesanan & Pencegahan Enumerasi
- Kode pemesanan (`ACB-YYYYMMDD-XXXX`) adalah pengenal administratif, **bukan kredensial keamanan**.
- Pengunjung anonim dilarang membaca rincian pemesanan hanya bermodalkan kode pemesanan berurutan. Akses ke endpoint `/api/v1/public/bookings/manage` wajib menyertakan token akses atau header `Authorization: Bearer <token>`.

---

## 3. Isolasi Data Pelanggan & Alamat
- Guest booking tidak pernah mengekspos profil atau alamat pelanggan lain meskipun nomor WhatsApp yang dimasukkan sama.
- Snapshot alamat dan unit AC disimpan secara khusus untuk pemesanan tersebut.
