# Strategi SEO & Metadata Terstruktur (Phase 04)

## 1. Metadata Dinamis (Next.js generateMetadata)

Pada halaman katalog dan detail layanan (`/services/[slug]`), metadata dibuat secara dinamis dari database NestJS:

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const service = await getPublicServiceBySlug(params.slug);
  const business = await getPublicBusiness();

  return {
    title: `${service.name} | ${business.name}`,
    description: service.shortDescription || service.description.slice(0, 160),
    alternates: {
      canonical: `/services/${params.slug}`,
    },
    openGraph: {
      title: `${service.name} | ${business.name}`,
      description: service.shortDescription,
      type: 'article',
      images: service.imageUrl ? [{ url: service.imageUrl }] : [],
    },
  };
}
```

---

## 2. Peta Situs Dinamis (`/sitemap.xml`)

Peta situs dibuat secara otomatis menggunakan Next.js Metadata Route `apps/frontend/src/app/sitemap.ts`.

- **Halaman Statis**: `/`, `/services`, `/service-areas`, `/gallery`, `/about`, `/contact`, `/booking`.
- **Halaman Dinamis**: Mengambil seluruh layanan aktif dari backend dan menghasilkan URL `/services/{slug}` dengan frekuensi perubahan `weekly` dan prioritas `0.8`.
- **Pengecualian**: Rute privat seperti `/login`, `/dashboard/*`, `/technician/*`, dan `/api/*` sengaja dikecualikan dari sitemap.

---

## 3. Aturan Mesin Perayap (`/robots.txt`)

Dikonfigurasi pada `apps/frontend/src/app/robots.ts`:
- **Allowed**: Seluruh rute publik (`/`).
- **Disallowed**:
  - `/dashboard/`
  - `/technician/`
  - `/api/`
  - `/login`
- **Sitemap**: Menunjuk langsung ke `${siteUrl}/sitemap.xml`.

---

## 4. Data Terstruktur JSON-LD (Schema.org)

Halaman detail layanan menyertakan skema terstruktur `Service` dan `LocalBusiness` standar Schema.org untuk mengoptimalkan tampilan Rich Snippet pada mesin pencari Google:
- `@type`: `Service`
- `name`: Nama layanan resmi.
- `provider`: Informasi bisnis (`LocalBusiness`), alamat fisik, dan telepon kantor.
- `offers`: Harga estimasi dalam mata uang `IDR` jika bertipe `FIXED` atau `STARTING_FROM`.
- Menghindari pembuatan rating palsu (*no fake reviews*).
