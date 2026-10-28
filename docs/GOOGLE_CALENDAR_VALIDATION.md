# Google Calendar Integration Validation & Reliability Assessment
**Project**: TampilKit Studio — AC Service Booking System  
**Edition**: Basic Field Service (CoolCare AC Service)  
**Date**: 2026-10-28  

---

## 1. Status Verifikasi Integrasi

Sesuai dengan **Aturan Non-Negosiasi Rule 12 & Rule 20**, verifikasi integrasi dibagi menjadi dua domain independen:

1. **Uji Otomatis Arsitektur & Mock E2E**: ✅ **PASS (16 of 16 tests passed)**
2. **Uji Koneksi Langsung (Live Google Calendar API)**: ⚠️ **BLOCKED**  
   *(Alasan: Kredensial produksi Google Cloud OAuth 2.0 milik klien nyata `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` belum diinjeksikan pada environment lokal).*

---

## 2. Rincian Arsitektur & Keamanan Terverifikasi

### A. Keamanan Kredensial OAuth 2.0
- **Enkripsi At-Rest AES-256-GCM**:
  - Refresh token Google disimpan di tabel `CalendarConnection` dalam bentuk *ciphertext* terenkripsi AES-256-GCM.
  - Setiap operasi enkripsi menggunakan 96-bit Random Initialization Vector (IV) unik dan 128-bit Authentication Tag.
  - Hasil uji `google-calendar-integration.e2e-spec.ts` membuktikan manipulasi 1 byte saja pada ciphertext akan langsung ditolak saat dekripsi tanpa kebocoran data.
- **Perlindungan State Anti-CSRF / Anti-Tampering**:
  - Parameter `state` pada URL otorisasi ditandatangani menggunakan HMAC-SHA256 dengan batas kedaluwarsa 10 menit dan nomor acak *single-use*.
  - Verifikasi menggunakan `crypto.timingSafeEqual` untuk mencegah serangan *timing attack*.

### B. Proyeksi Kalender Multi-Teknisi & Kebijakan Fail-Closed
- **Invarian Kalender Bersama Multi-Teknisi**:
  - Event pemesanan internal sistem ditandai dengan `extendedProperties.private.source = 'TampilKit-AC'` dan `technicianId`.
  - Pada kueri ketersediaan publik (`FreeBusy`), event sistem dari teknisi A tidak memblokir jadwal teknisi B.
  - Event eksternal non-sistem (`EXTERNAL_BUSY`) dihormati sebagai penutupan toko global.
- **Fail-Closed Availability**:
  - Jika koneksi Google Calendar memasuki status `REAUTH_REQUIRED` (misalnya token dicabut pemilik akun), kueri availability publik langsung beralih ke mode **fail-closed** (slot dianggap tidak tersedia) untuk mencegah overbooking tanpa konfirmasi kalender eksternal.

### C. Keandalan Worker Outbox & Webhook Auto-Recovery
- **Transactional Outbox**:
  - Setiap perubahan pemesanan (konfirmasi, penjadwalan ulang, pembatalan) menyimpan job ke `CalendarSyncJob` dalam transaksi atomik database bersamaan dengan pembaruan status booking.
  - Worker mengklaim job secara atomik dengan *lease lock* 60 detik (`lockedUntil`) dan retry eksponensial (maksimal 5 percobaan).
- **Penanganan HTTP 410 Gone**:
  - Jika Google mengembalikan status HTTP 410 Gone pada incremental sync token atau webhook channel, sistem secara otomatis mereset token sinkronisasi dan memicu *Full Sync* rekonsiliasi mandiri.

---

## 3. Langkah Aktivasi untuk Live Production

Bagi administrator bisnis CoolCare AC yang ingin mengaktifkan kalender nyata:
1. Buat Project di Google Cloud Console dan aktifkan **Google Calendar API**.
2. Buat OAuth 2.0 Client ID jenis Web Application dengan Authorized Redirect URI:
   `https://<domain-anda>/api/v1/admin/integrations/google/callback`
3. Masukkan `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` ke file `.env` backend.
4. Buka dasbor admin di `http://localhost:3000/dashboard/integrations/google-calendar` dan klik **"Hubungkan Akun Google"**.
