# 🚀 Pipeline Developer Otonom Multi-Role (Tech-Agnostic) — untuk Antigravity IDE

Pipeline ini adalah tim development AI otonom yang bisa dipakai untuk **teknologi apa pun** — web (frontend/backend), mobile, atau kombinasi fullstack — dan **belajar dari setiap siklus kerja** supaya kesalahan yang sama tidak terulang.

---

# ❄️ TampilKit Studio — AC Service Booking System (CoolCare AC Service)

Sistem pemesanan servis AC lapangan (*Field Service Appointment Booking*) berbasis monorepo npm workspaces.

## Status Implementasi Fase
- **Phase 01 — Monorepo Foundation, Next.js, NestJS Fastify, PostgreSQL & MinIO**: ✅ **SELESAI (PASS)**
- **Phase 02 — JWT Authentication, Refresh Token Rotation & RBAC**: ✅ **SELESAI (PASS)**
- **Phase 03 — Business Settings, AC Service Catalog, Pricing & Service Area Management**: ✅ **SELESAI (PASS)**
- **Phase 04 — Public AC Service Website, Dynamic Service Catalog & SEO**: ✅ **SELESAI (PASS)**
- **Phase 05 — Customer, Service Address & AC Unit Management**: ✅ **SELESAI (PASS)**
- **Phase 06 — Service Team & Technician Management**: ⚙️ *Fondasi Minimal Diintegrasikan di Phase 07*
- **Phase 07 — Booking Engine, Technician Availability & Customer Reservation**: ✅ **SELESAI (PASS)**
- **Phase 08 — Admin Booking Dashboard, Technician Assignment & Work Order Management**: ✅ **SELESAI (PASS)**
- **Phase 09 — Technician Workspace & Field Service Execution**: ✅ **SELESAI (PASS)**
- **Phase 10 — Google Calendar OAuth, FreeBusy, Event Sync, Webhook & Reliability**: ✅ **SELESAI (PASS)**
- **Phase 11 — Final Service Pricing, Billing, On-Site Payment & Operational Reporting**: ✅ **SELESAI (PASS)**
- **Phase 12 — Final QA, Security, Performance & Production Readiness**: ✅ **SELESAI (PASS / TECHNICAL GO)**

## Panduan Menjalankan Aplikasi

### 1. Inisialisasi Database & Akun OWNER
```bash
# Pastikan PostgreSQL lokal (Port 5432) dan MinIO Docker Desktop (Port 9000) aktif
npm install

# Jalankan migrasi Prisma & seed data
npx prisma migrate deploy --schema apps/backend/prisma/schema.prisma
npx tsx apps/backend/prisma/seed.ts

# Bootstrap akun OWNER dan staf pengujian
npm run auth
```

### Kredensial Akun Bawaan (Development)
| Peran (Role) | Email | Kata Sandi | Halaman Utama |
|---|---|---|---|
| **OWNER** | `owner@coolcare.id` | `OwnerSecurePass123!` | `http://localhost:3000/dashboard` |
| **ADMIN** | `admin@coolcare.id` | `AdminSecurePass123!` | `http://localhost:3000/dashboard` |
| **TECHNICIAN** | `technician@coolcare.id` | `TechSecurePass123!` | `http://localhost:3000/technician` |

### 2. Menjalankan Server Pengembangan
```bash
# Menjalankan frontend (Port 3000) dan backend (Port 3001) secara bersamaan:
npm run dev
```

- **Website Publik**: `http://localhost:3000`
- **Katalog Layanan**: `http://localhost:3000/services`
- **Area Jangkauan**: `http://localhost:3000/service-areas`
- **Galeri Pengerjaan**: `http://localhost:3000/gallery`
- **Tentang Kami**: `http://localhost:3000/about`
- **Kontak & Jam Kerja**: `http://localhost:3000/contact`
- **Pemesanan Service**: `http://localhost:3000/booking`
- **Peta Situs (Sitemap)**: `http://localhost:3000/sitemap.xml`
- **Halaman Login Staf**: `http://localhost:3000/login`
- **Integrasi Google Calendar**: `http://localhost:3000/dashboard/integrations/google-calendar`
- **Antrean Outbox Jobs**: `http://localhost:3000/dashboard/integrations/google-calendar/jobs`
- **Resolusi Konflik Kalender**: `http://localhost:3000/dashboard/integrations/google-calendar/conflicts`
- **Pengaturan Akun Google**: `http://localhost:3000/dashboard/settings/integrations/google`
- **Manajemen Faktur & Tagihan**: `http://localhost:3000/dashboard/invoices`
- **Verifikasi Pembayaran Manual**: `http://localhost:3000/dashboard/payments`
- **Laporan Operasional & Keuangan**: `http://localhost:3000/dashboard/reports`
- **Backend API Docs (Swagger)**: `http://localhost:3001/api/docs`
- **Health Check API**: `http://localhost:3001/api/v1/health`

### 3. Eksekusi Pengujian & Verifikasi Kualitas
```bash
# Jalankan seluruh unit tests (Frontend & Backend):
npm run test

# Jalankan seluruh pengujian E2E backend Fastify:
npm run test:e2e -w @tampilkit-ac/backend

# Pemeriksaan tipe data TypeScript:
npm run typecheck

# Pemeriksaan linter ESLint:
npm run lint

# Kompilasi build produksi:
npm run build
```

---

## Dokumentasi Teknis
- [Laporan Resmi Implementasi Phase 12 (Final QA & Production Readiness)](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/PHASE_12_REPORT.md)
- [Review Rilis Resmi & Keputusan GO / NO-GO](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/GO_NO_GO_REVIEW.md)
- [Feature Traceability Matrix (FTM Phase 01–11)](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/qa/FEATURE_TRACEABILITY_MATRIX.md)
- [Evidence Registry (238 Uji Otomatis)](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/qa/EVIDENCE_REGISTRY.md)
- [Security Assessment (OWASP ASVS 5.0.0 Reference)](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/SECURITY_ASSESSMENT.md)
- [Laporan Audit Performa & Latensi Baseline](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/PERFORMANCE_REPORT.md)
- [Integritas Database & Riwayat Migrasi Prisma](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/DATABASE_INTEGRITY_REPORT.md)
- [Validasi Integrasi Google Calendar & Reliabilitas](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/GOOGLE_CALENDAR_VALIDATION.md)
- [Rekonsiliasi Finansial & Integritas Penagihan](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/FINANCIAL_RECONCILIATION_REPORT.md)
- [Panduan Pencadangan & Pemulihan Bencana (Backup & Restore)](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/BACKUP_RESTORE.md)
- [Panduan Deployment Staging & Produksi (Deployment Runbook)](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/DEPLOYMENT_RUNBOOK.md)
- [Panduan Rollback Darurat (Rollback Runbook)](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/ROLLBACK_RUNBOOK.md)
- [Panduan Pemantauan Operasional (Operations Monitoring)](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/OPERATIONS_MONITORING.md)
- [Panduan Serah Terima Operasional (Operations Handover)](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/OPERATIONS_HANDOVER.md)
- [Validasi Template White-Label & Reusabilitas](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/TEMPLATE_REUSABILITY.md)
- [Checklist Skenario UAT (User Acceptance Testing)](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/UAT_CHECKLIST.md)
- [Registri Defek & Log Remediasi (Defect Register)](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/DEFECT_REGISTER.md)
- [Laporan Resmi Implementasi Phase 11](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/PHASE_11_REPORT.md)
- [Kalkulasi Harga & Biaya Servis Aktual](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/FINAL_SERVICE_PRICING.md)
- [Persetujuan Biaya Tambahan & Provenance](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/SERVICE_CHARGE_APPROVAL.md)
- [Manajemen Faktur & Siklus Hidup Invoice](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/INVOICE_MANAGEMENT.md)
- [Pencatatan Pembayaran Lapangan Manual](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/MANUAL_PAYMENT_MANAGEMENT.md)
- [Verifikasi Pembayaran & Pencegahan Overpayment](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/PAYMENT_VERIFICATION.md)
- [Kuitansi Pembayaran & Generator PDF](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/PAYMENT_RECEIPTS.md)
- [Rekonsiliasi Finansial & Audit Append-Only](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/FINANCIAL_RECONCILIATION.md)
- [Laporan Operasional & Analisis Kinerja](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/OPERATIONAL_REPORTING.md)
- [Laporan Keuangan & Ekspor CSV Anti-Injeksi](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/FINANCIAL_REPORTING.md)
- [Laporan Resmi Implementasi Phase 10](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/PHASE_10_REPORT.md)
- [Panduan Setup Google Cloud & OAuth 2.0](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/GOOGLE_CALENDAR_SETUP.md)
- [Keamanan OAuth 2.0 & Enkripsi AES-256-GCM](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/GOOGLE_OAUTH_SECURITY.md)
- [Arsitektur Kalender Bersama Multi-Teknisi](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/GOOGLE_CALENDAR_ARCHITECTURE.md)
- [Kebijakan FreeBusy & Fail-Closed Availability](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/GOOGLE_FREEBUSY_POLICY.md)
- [Siklus Sinkronisasi Event Pemesanan](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/GOOGLE_EVENT_SYNC.md)
- [Push Notification Webhook & Auto-Recovery 410](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/GOOGLE_WEBHOOK.md)
- [Daemon Worker Outbox & Lease Locking](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/GOOGLE_SYNC_WORKER.md)
- [Manajemen & Resolusi Konflik Kalender](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/GOOGLE_CONFLICT_MANAGEMENT.md)
- [Rekonsiliasi Periodik & Penyembuhan Mandiri](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/GOOGLE_RECONCILIATION.md)
- [Workspace Teknisi & Lapangan (Phase 09)](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/TECHNICIAN_WORKSPACE.md)
- [Eksekusi Pekerjaan & State Machine](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/FIELD_SERVICE_EXECUTION.md)
- [Inspeksi Teknis Unit AC](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/WORK_ORDER_INSPECTIONS.md)
- [Checklist Servis & SOP Pengerjaan](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/SERVICE_CHECKLISTS.md)
- [Dokumentasi Foto & Keamanan MinIO](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/WORK_ORDER_PHOTOS.md)
- [Pintu Validasi & Penyelesaian SPK](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/WORK_ORDER_COMPLETION.md)
- [Keamanan Otorisasi & Anti-IDOR Teknisi](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/TECHNICIAN_AUTHORIZATION.md)
- [Laporan Resmi Implementasi Phase 09](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/PHASE_09_REPORT.md)
- [Manajemen Pemesanan & Alokasi SPK (Phase 08)](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/PHASE_08_REPORT.md)
- [Mesin Pemesanan & Alur Reservasi](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/BOOKING_ENGINE.md)
- [Alokasi Kapasitas Teknisi & Jadwal](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/TECHNICIAN_ALLOCATION.md)
- [Estimasi Harga Pemesanan](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/BOOKING_PRICE_ESTIMATION.md)
- [Pencegahan Pemesanan Ganda & Konkurensi](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/BOOKING_CONCURRENCY.md)
- [Keamanan Pemesanan Guest & Token](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/GUEST_BOOKING_SECURITY.md)
- [Laporan Resmi Implementasi Phase 07](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/PHASE_07_REPORT.md)
- [Manajemen Pelanggan & Normalisasi Kontak](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/CUSTOMER_MANAGEMENT.md)
- [Manajemen Multi-Alamat & Validasi Area Layanan](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/CUSTOMER_ADDRESS_MANAGEMENT.md)
- [Inventaris Unit AC & Foreign Key Komposit](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/AC_UNIT_MANAGEMENT.md)
- [Keamanan Foto Unit AC & MinIO Privat](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/AC_UNIT_MEDIA_SECURITY.md)
- [Privasi Data Pelanggan & Log Audit](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/CUSTOMER_DATA_PRIVACY.md)
- [Laporan Resmi Implementasi Phase 05](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/PHASE_05_REPORT.md)
- [Website Publik & Pengalaman Pengguna](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/PUBLIC_WEBSITE.md)
- [Spesifikasi Public REST API](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/PUBLIC_API.md)
- [Keamanan Berkas Media Publik & MinIO](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/PUBLIC_MEDIA_SECURITY.md)
- [Strategi SEO, Sitemap & Schema.org](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/SEO.md)
- [Kebijakan Cache & Kesegaran Data](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/CACHE_INVALIDATION.md)
- [Laporan Resmi Implementasi Phase 04](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/PHASE_04_REPORT.md)
- [Arsitektur Sistem Lengkap](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/ARCHITECTURE.md)
- [Kontrak API Bersama](file:///d:/anggara-dev/anggara-project/nodejs-project/Jasa-Service-AC/docs/API_CONTRACT.md)
