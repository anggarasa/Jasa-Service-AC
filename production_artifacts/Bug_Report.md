# Laporan Investigasi Bug: TypeError Paginasi di BookingsListPage

**ID Masalah**: BUG-FE-02  
**Tanggal**: 28 Oktober 2026  
**Status**: Selesai Diperbaiki & Terverifikasi (PASS)  
**Pelapor**: QA Lead (`@qa`)  
**Penanggung Jawab**: Frontend Engineer (`@frontend`) & Backend Engineer (`@backend`)  

---

## 1. Gejala Masalah (Symptoms)
Saat membuka halaman daftar pemesanan admin di `/dashboard/bookings` (`src/app/(dashboard)/dashboard/bookings/page.tsx:304:34`), aplikasi melempar unhandled runtime error:

```
Runtime TypeError: Cannot read properties of undefined (reading 'totalPages')
    at BookingsListPage (src\app\(dashboard)\dashboard\bookings\page.tsx:304:34)
```

Cuplikan kode sumber yang mengalami crash:
```tsx
303 |         {/* Pagination Bar */}
304 |         {data && data.pagination.totalPages > 1 && (
    |                                  ^
305 |           <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
```

Selain itu, daftar pemesanan pada tabel tidak tampil (selalu muncul status "Tidak ada data pemesanan yang sesuai filter") karena evaluasi `!data?.items?.length` bernilai `true`.

---

## 2. Analisis & Akar Masalah (Root Cause Analysis)

### Root Cause 1: Inkonsistensi Bentuk Response di Controller Backend
Pada `apps/backend/src/modules/admin-bookings/admin-bookings.controller.ts`:
```typescript
@Get('bookings')
async listBookings(@Query() query: AdminBookingListQueryDto) {
  const data = await this.adminBookingsService.listBookings(query);
  return {
    success: true,
    data: data.items,
    pagination: data.pagination,
    message: 'Daftar pemesanan berhasil dimuat',
  };
}
```
Metode `adminBookingsService.listBookings(query)` sebenarnya sudah mengembalikan objek `{ items, pagination }`. Namun controller membungkusnya secara manual dengan properti `success: true` dan meletakkan `items` di dalam `data`.

### Root Cause 2: Mekanisme Unwrapping di `ApiClient.request`
Pada `apps/frontend/src/lib/api/client.ts`:
```typescript
if (
  parsed &&
  typeof parsed === 'object' &&
  'success' in parsed &&
  parsed.success === true
) {
  return (parsed as ApiSuccessResponse<T>).data;
}
```
Ketika backend mengirimkan `{ success: true, data: [...items], pagination: {...} }`, `ApiClient.request` mengekstrak `parsed.data` (yaitu array `items`) dan membuang properti tingkat atas lainnya termasuk `pagination`.

Akibatnya, fungsi `fetchAdminBookings` yang mendeklarasikan return type `Promise<AdminBookingListResponse>` (berisi `{ items, pagination }`) di runtime justru mengembalikan array murni `items[]`.

### Root Cause 3: Ketiadaan Defensive Guarding & Optional Chaining di Komponen UI
Pada `apps/frontend/src/app/(dashboard)/dashboard/bookings/page.tsx`:
1. Baris 304: `{data && data.pagination.totalPages > 1 && (`
   Karena `data` bernilai array (truthy), JavaScript membaca `data.pagination.totalPages`. Karena `data.pagination` bernilai `undefined`, terjadi `TypeError: Cannot read properties of undefined (reading 'totalPages')`.
2. Baris 202: `!data?.items?.length` mengecek `data.items`, yang pada tipe array bernilai `undefined`, sehingga tabel selalu dianggap kosong.
3. Baris 307, 320, 326, 327 juga mengakses `data.pagination.*` tanpa optional chaining (`?.`).

### Scope Masalah Serupa (Cross-Module Audit):
Pola respons yang sama juga ditemukan pada:
- `apps/backend/src/modules/work-orders/work-orders.controller.ts` (mengembalikan `{ success: true, data: data.items, pagination: data.pagination }`)
- `apps/backend/src/modules/billing/controllers/invoices.controller.ts` (mengembalikan `{ success: true, data: data.items, pagination: data.pagination }`)
- `apps/backend/src/modules/billing/controllers/payments.controller.ts` (mengembalikan `{ success: true, data: data.items, pagination: data.pagination }`)

---

## 3. Rencana Perbaikan (Remediation Plan)

1. **Defensive API Client & Frontend Resilience (`@frontend`)**:
   - Perbarui `ApiClient.request` di `apps/frontend/src/lib/api/client.ts`: jika respons backend memuat `pagination` berdampingan dengan `data` array (`parsed.pagination && Array.isArray(parsed.data)`), satukan menjadi `{ items: parsed.data, pagination: parsed.pagination }` agar kompatibel ke belakang.
   - Perbaiki `BookingsListPage` (`apps/frontend/src/app/(dashboard)/dashboard/bookings/page.tsx`):
     - Normalisasi data dengan fallback: ekstrak `items` dari `data.items` atau langsung `data` jika berupa array.
     - Gunakan optional chaining pada seluruh akses paginasi (`data?.pagination?.totalPages`).
   - Terapkan perlindungan serupa pada `WorkOrdersPage` (`apps/frontend/src/app/(dashboard)/dashboard/work-orders/page.tsx`).

2. **Standardisasi Backend Response Contract (`@backend`)**:
   - Selaraskan `AdminBookingsController`, `WorkOrdersController`, `InvoicesController`, dan `PaymentsController` agar mengembalikan `{ items: data.items, pagination: data.pagination }` secara standar sehingga `TransformResponseInterceptor` membungkusnya sebagai `{ success: true, data: { items, pagination }, correlationId }`.

3. **Verifikasi QA (`@qa`)**:
   - Jalankan build frontend & test suites untuk memastikan tidak ada regresi tipe TypeScript maupun runtime exception.

---

# Laporan Investigasi Bug: 404 Not Found pada Endpoint Callback Google OAuth

**ID Masalah**: BUG-GCAL-03  
**Tanggal**: 28 Oktober 2026  
**Status**: Selesai Diperbaiki & Terverifikasi (PASS)  
**Pelapor**: QA Lead (`@qa`)  
**Penanggung Jawab**: Backend Engineer (`@backend`)  

---

## 1. Gejala Masalah (Symptoms)
Setelah pengguna memberikan persetujuan izin integrasi Google Calendar di layar consent Google, Google me-redirect peramban kembali ke alamat redirect yang terdaftar:
```
http://localhost:3001/api/v1/calendar/callback?state=...&code=...
```
Namun backend NestJS Fastify mengembalikan HTTP 404 Not Found:
```json
{
  "success": false,
  "error": {
    "code": "Not Found",
    "message": "Cannot GET /api/v1/calendar/callback?state=...&code=..."
  },
  "correlationId": "req-s"
}
```

---

## 2. Analisis & Akar Masalah (Root Cause Analysis)

### Root Cause: Ketidakcocokan Antara `GOOGLE_REDIRECT_URI` di `.env` dan Route Controller NestJS
1. **Konfigurasi Environment**:
   Di file `.env`, `apps/backend/.env`, dan `.env.example`, URI callback Google didefinisikan sebagai:
   `GOOGLE_REDIRECT_URI=http://localhost:3001/api/v1/calendar/callback`
   Nilai ini juga yang didaftarkan di Google Cloud Console pada bagian *Authorized redirect URIs*, dan dikirimkan oleh backend saat menghasilkan link otentikasi Google (`oauth2Client.generateAuthUrl`).
2. **Pendaftaran Rute di Controller NestJS**:
   Pada `apps/backend/src/modules/google-calendar/controllers/google-oauth.controller.ts`:
   Controller didekorasikan dengan `@Controller('admin/integrations/google')` dan metode callback didekorasikan dengan `@Get('callback')`.
   Dengan global prefix `/api/v1`, rute yang terdaftar di Fastify router adalah:
   `GET /api/v1/admin/integrations/google/callback`.
3. **Ketiadaan Route Handler untuk `/api/v1/calendar/callback`**:
   Karena tidak ada controller yang memetakan prefix `calendar` atau `integrations/google`, Fastify menolak permintaan redirect dari Google dengan respon `404 Not Found ("Cannot GET /api/v1/calendar/callback")`.
   Akibatnya, alur pertukaran kode otorisasi (*code exchange*) dengan Google gagal dieksekusi dan token tidak tersimpan di database.

---

## 3. Rencana Perbaikan & Hasil (Remediation Plan & Outcome)

1. **Gunakan Rute Array Langsung pada Controller Asli (`@backend`)**:
   - Di NestJS, sebuah Controller *bukan* Provider, sehingga Controller tidak dapat di-inject ke dalam Controller lain (`UnknownDependenciesException`).
   - Pendekatan arsitektur yang benar dan bersih adalah mendaftarkan *route prefix array* langsung pada `GoogleOAuthController`:
     `@Controller(['admin/integrations/google', 'calendar', 'integrations/google'])`
   - Ini otomatis melayani ketiga endpoint sekaligus:
     - `GET /api/v1/calendar/callback` (sesuai `.env` dan Google Console pengguna)
     - `GET /api/v1/integrations/google/callback` (sesuai konfigurasi bawaan `configuration.ts`)
     - `GET /api/v1/admin/integrations/google/callback` (rute admin)
   - Controller callback terpisah (`GoogleOAuthCallbackController`) dihapus sepenuhnya untuk mencegah dependensi ilegal antarkontroler.

2. **Verifikasi QA (`@qa`)**:
   - NestJS DI container berhasil di-bootstrap: `NESTJS_BOOTSTRAP_SUCCESS`.
   - Kompilasi TypeScript (`tsc --noEmit`) lulus dengan 0 error.
   - Semua 7 test suite (20 unit tests) PASS.
   - Server backend NestJS berjalan stabil tanpa exception.

---

# Laporan Investigasi Bug: Google Calendar Tampak "Belum Terhubung" Setelah Berhasil Login OAuth (Status `NEEDS_SELECTION`)

**ID Masalah**: BUG-GCAL-05  
**Tanggal**: 29 Oktober 2026  
**Status**: Selesai Diperbaiki & Terverifikasi (PASS)  
**Pelapor**: QA Lead (`@qa`)  
**Penanggung Jawab**: Frontend Engineer (`@frontend`) & Backend Engineer (`@backend`)  

---

## 1. Gejala Masalah (Symptoms)
Pengguna berhasil menyetujui izin integrasi Google Calendar di browser (email `tampilkit@gmail.com`). Database PostgreSQL sudah menyimpan data token terenkripsi dan email akun. Namun pada halaman pengaturan `/dashboard/settings/integrations/google`, sistem tetap menampilkan:
- Badge: **"Belum Terhubung"**
- Kartu: **"Hubungkan CoolCare ke Google Calendar"** dengan tombol **"Hubungkan Akun Google Sekarang"**
- Dropdown pemilihan kalender tidak muncul, sehingga pengguna mengira koneksi Google OAuth gagal total.

---

## 2. Analisis & Akar Masalah (Root Cause Analysis)

### Root Cause 1: Frontend Mengabaikan Status `NEEDS_SELECTION`
1. Ketika Google OAuth callback selesai, backend menyimpan koneksi dengan status transisi `NEEDS_SELECTION` (karena akun sudah terotentikasi tetapi kalender tujuan belum dipilih).
2. Di `apps/frontend/src/app/(dashboard)/dashboard/settings/integrations/google/page.tsx`:
   - Pengecekan status hanya membandingkan `res.status === 'CONNECTED'`.
   - Jika status bernilai `NEEDS_SELECTION`, halaman tidak memanggil `fetchAvailableCalendars()`, menampilkan Badge "Belum Terhubung", dan merender kembali tombol "Hubungkan Akun Google Sekarang".
3. Akibatnya, pengguna terjebak dalam loop: login ke Google berkali-kali, tetapi UI selalu kembali ke tampilan awal seolah-olah tidak terhubung.

### Root Cause 2: Ketiadaan Auto-Selection Kalender Utama di Backend
Pada `GoogleOAuthService.handleCallback`:
Backend tidak mencoba memilih kalender utama (`primary`) secara otomatis saat otorisasi pertama kali berhasil. Selain itu, jika koneksi sudah memiliki kalender dari sesi sebelumnya, callback OAuth selalu me-reset status menjadi `NEEDS_SELECTION`.

---

## 3. Rencana Perbaikan (Remediation Plan)

1. **Frontend (`@frontend`)**:
   - Perbarui `apps/frontend/src/app/(dashboard)/dashboard/settings/integrations/google/page.tsx`:
     - Dukung status `NEEDS_SELECTION`: tampilkan Badge "Akun Terhubung (Pilih Kalender)", tampilkan email akun Google yang terhubung (`tampilkit@gmail.com`), muat daftar kalender, dan berikan panduan instruktif bagi pengguna untuk menekan "Simpan Kalender".
     - Sediakan fallback pembacaan nama kalender (`cal.name || cal.summary`).
   - Perbarui `apps/frontend/src/app/(dashboard)/dashboard/integrations/google-calendar/page.tsx`:
     - Dukung Badge `NEEDS_SELECTION` dengan navigasi cepat ke halaman pemilihan kalender.

2. **Backend (`@backend`)**:
   - Di `GoogleOAuthService.handleCallback`:
     - Secara otomatis deteksi kalender utama (`primary`) pengguna saat pertama kali login dan langsung tetapkan sebagai kalender default dengan status `CONNECTED`.
     - Pertahankan status `CONNECTED` jika koneksi sudah memiliki `calendarId`.
   - Di `GoogleCalendarClientService.listCalendars`: kembalikan properti `summary` berdampingan dengan `name`.

3. **Verifikasi QA (`@qa`)**:
   - Pastikan halaman frontend langsung mendeteksi akun Google yang sudah terhubung, menampilkan dropdown kalender, dan mengaktifkan status sinkronisasi.



---

# Laporan Investigasi Bug: ChunkLoadError pada Next.js Client Navigation

**ID Masalah**: BUG-FE-04  
**Tanggal**: 29 Oktober 2026  
**Status**: Selesai Diperbaiki & Terverifikasi (PASS)  
**Pelapor**: QA Lead (`@qa`)  
**Penanggung Jawab**: Frontend Engineer (`@frontend`)  

---

## 1. Gejala Masalah (Symptoms)
Saat membuka peramban di halaman utama (`http://localhost:3000/`), terjadi error console unhandled ChunkLoadError:
```
Loading chunk app/(public)/page failed.
(error: http://localhost:3000/_next/static/chunks/app/(public)/page.js)

    at HeroSection (src\features\home\hero-section.tsx:52:15)
    at Button (src\components\ui\button.tsx:43:7)
    at HeroSection (src\features\home\hero-section.tsx:51:13)
    at HomePage (src\app\(public)\page.tsx:38:7)
```

## 2. Analisis & Akar Masalah (Root Cause Analysis)
1. **Asset Stale & Cache Mismatch Akibat Eksekusi Build Paralel**:
   - Menjalankan `next build` (`npm run build`) saat server development (`next dev`) sedang aktif di sesi terminal pengguna menyebabkan folder `.next/` ditimpa dengan artefak produksi.
   - Sesi browser klien yang memegang referensi ke chunk dev (`_next/static/chunks/app/(public)/page.js`) mengalami 404 ketika Next.js Link melakukan prefetch saat tombol `<Link href="/booking">` terlihat di viewport.
2. **Ketiadaan Auto-Recovery untuk Chunk Load Failure**:
   - Next.js Webpack bundler secara default tidak otomatis melakukan hard refresh ketika chunk gagal dimuat (`ChunkLoadError`).
   - `apps/frontend` belum memiliki `global-error.tsx` dan listener `ChunkLoadError` terpadu untuk melakukan *graceful reload* otomatis ketika hash bundle berubah.

## 3. Rencana Perbaikan (Remediation Plan)
1. Buat komponen client `ChunkErrorListener` di `src/components/common/chunk-error-listener.tsx` untuk mendengarkan event unhandled error `ChunkLoadError` pada `window` dan melakukan reload aman (dengan throttling `sessionStorage` untuk menghindari loop).
2. Daftarkan `ChunkErrorListener` di `src/app/layout.tsx`.
3. Buat `src/app/global-error.tsx` dan perbarui `src/app/(public)/error.tsx` untuk mendeteksi `ChunkLoadError` dan memicu refresh otomatis.
4. Pandu pengguna untuk merefresh halaman atau me-restart dev server jika file cache dev lokal terganggu oleh proses build sebelumnya.
