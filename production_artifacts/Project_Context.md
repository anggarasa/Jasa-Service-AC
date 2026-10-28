# Project Context — TampilKit AC Booking

## 1. Ringkasan Proyek
- **Nama Proyek**: TampilKit AC Booking (CoolCare AC Service)
- **Tipe**: Monorepo npm workspaces (Field Service Appointment Booking System)
- **Teknologi Utama**:
  - Frontend: Next.js 15 (App Router), React 19, Tailwind CSS, Lucide React, Geist Font, shadcn/ui.
  - Backend: NestJS 11, Fastify Adapter (@nestjs/platform-fastify v11, Fastify v5), Prisma ORM 6, PostgreSQL, MinIO S3 SDK, Jose (JWT), Argon2id.
  - Shared: `@tampilkit-ac/api-contract` (TypeScript, Zod schemas).

## 2. Struktur Folder Aktif
```
tampilkit-ac-booking/
├── apps/
│   ├── frontend/        # Next.js 15 App Router web client (Port 3000)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (public)/         # Beranda, /services, /services/[slug], /service-areas, /gallery, /about, /contact, /booking
│   │   │   │   ├── (auth)/login/
│   │   │   │   ├── (dashboard)/...   # OWNER & ADMIN Dashboard
│   │   │   │   ├── (technician)/...  # TECHNICIAN Workspace
│   │   │   │   ├── sitemap.ts & robots.ts
│   │   │   │   └── api/auth/[...path]/route.ts
│   │   │   ├── components/ (ui, common, layouts, auth, dashboard, public)
│   │   │   ├── features/home/
│   │   │   └── lib/api/ (client.ts, public.ts)
│   │   └── test/
│   └── backend/         # NestJS Fastify REST API (Port 3001, Prefix /api/v1)
│       ├── prisma/      # schema.prisma, migrations, seed.ts
│       ├── src/
│       │   ├── common/  # filters, interceptors, decorators
│       │   ├── config/  # env.config, configuration
│       │   ├── infrastructure/ (prisma, storage)
│       │   ├── modules/
│       │   │   ├── health/
│       │   │   ├── auth/
│       │   │   ├── business/
│       │   │   ├── business-closures/
│       │   │   ├── service-categories/
│       │   │   ├── services/
│       │   │   ├── service-areas/
│       │   │   ├── media/
│       │   │   └── public/        # Dedicated Public Read APIs
│       │   └── scripts/
│       └── test/
├── packages/
│   └── api-contract/    # Shared types & Zod schemas (responses, auth, business, services, public)
├── docs/                # Dokumentasi arsitektur, auth, rbac, public website, media, seo, laporan
└── production_artifacts/
```

## 3. Status Fase
- Phase 01: Fondasi Monorepo, DB & MinIO (PASS)
- Phase 02: Autentikasi JWT, Rotasi Token & RBAC (PASS)
- Phase 03: Pengaturan Bisnis, Katalog Servis AC, Aturan Harga & Area Layanan (PASS)
- Phase 04: Website Publik Servis AC, Katalog Dinamis & SEO (PASS)
- Phase 05: Customer, Service Address & AC Unit Management (PASS)
- Phase 06: Service Team, Technician Management & Operating Schedule (Fondasi Minimal Diintegrasikan di Phase 07)
- Phase 07: Booking Engine, Technician Availability & Customer Reservation (PASS)
- Phase 08: Admin Booking Dashboard, Technician Assignment & Work Order Management (PASS)
- Phase 09: Technician Workspace & Field Service Execution (PASS)
- Phase 10: Google Calendar OAuth, FreeBusy, Event Sync, Webhook & Reliability (PASS)
- Phase 11: Final Service Pricing, Billing, On-Site Payment & Operational Reporting (PASS)
- Phase 12: Final QA, Security, Performance & Production Readiness (PASS / TECHNICAL GO)
