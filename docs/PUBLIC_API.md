# Spesifikasi Public REST API (Phase 04)

## 1. Prinsip Keamanan & Eksposur Data Publik

Modul publik backend (`apps/backend/src/modules/public/`) beroperasi di bawah prinsip **Zero Data Leakage**:
1. **Penyaringan Konten Aktif**: Hanya data dengan status `isActive: true` yang dikembalikan. Layanan dalam kategori nonaktif otomatis tersembunyi.
2. **Sanitasi DTO Ketat**: Menggunakan DTO publik eksplisit. Kolom internal seperti database UUID internal (pada profil bisnis), hash password, token JWT, konfigurasi backend rahasia, maupun rekaman pelanggan/booking **TIDAK PERNAH** diekspos ke publik.
3. **Decorator `@Public()`**: Seluruh endpoint publik dikecualikan dari `JwtAuthGuard` secara terisolasi tanpa mengurangi keamanan endpoint administratif di `/api/v1/admin/*`.

---

## 2. Daftar Endpoint Publik

| Method | Endpoint | Query / Param | Deskripsi | Respons Data Utama |
|---|---|---|---|---|
| `GET` | `/api/v1/public/business` | - | Profil publik bisnis & kontak | `PublicBusiness` (name, address, phone, wa, email, logoMediaUrl) |
| `GET` | `/api/v1/public/operating-hours`| - | Jam kerja 7 hari & jadwal libur | `PublicOperatingHours` (timezone, schedule, upcomingClosures) |
| `GET` | `/api/v1/public/service-categories`| - | Kategori layanan aktif | `PublicCategory[]` (name, slug, serviceCount) |
| `GET` | `/api/v1/public/services` | `category`, `search`, `page`, `limit` | Katalog layanan AC aktif | `{ items: PublicServiceItem[], meta: PaginationMeta }` |
| `GET` | `/api/v1/public/services/:slug` | `slug` (path) | Detail layanan & layanan terkait | `PublicServiceDetail` (detail lengkap, relatedServices) |
| `GET` | `/api/v1/public/service-areas` | - | Wilayah layanan & ongkos | `PublicServiceArea[]` (name, city, district, visitFee) |
| `GET` | `/api/v1/public/gallery` | - | Foto galeri pengerjaan | `PublicGalleryItem[]` (caption, altText, url) |
| `GET` | `/api/v1/public/media/:id` | `id` (path) | Berkas media publik terverifikasi | Stream biner gambar (WebP/JPEG/PNG) dengan Cache-Control |

---

## 3. Format Respons Standar

### Contoh Respons Katalog Layanan (`GET /api/v1/public/services`)
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "srv-cuci-split-uuid",
        "name": "Cuci AC Split Standar",
        "slug": "cuci-ac-standar",
        "category": {
          "id": "cat-cuci-uuid",
          "name": "Cuci AC (Cleaning)",
          "slug": "cuci-ac"
        },
        "shortDescription": "Cuci rutin indoor & outdoor",
        "description": "Pembersihan evaporator, filter udara, dan outdoor bertekanan...",
        "priceType": "FIXED",
        "basePrice": "75000.00",
        "basePriceNumber": 75000,
        "pricingUnit": "PER_UNIT",
        "estimatedDurationMinutes": 60,
        "minimumUnits": 1,
        "maximumUnits": 10,
        "imageUrl": "http://127.0.0.1:9000/tampilkit-ac-booking/services/...",
        "displayOrder": 1
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 4,
      "totalPages": 1
    }
  },
  "correlationId": "req-1a2b3c4d"
}
```
