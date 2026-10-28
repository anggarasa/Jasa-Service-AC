# Laporan Investigasi Bug: TypeError Paginasi di BookingsListPage

**ID Masalah**: BUG-FE-02  
**Tanggal**: 28 Oktober 2026  
**Status**: Diinvestigasi & Siap Diperbaiki  
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
