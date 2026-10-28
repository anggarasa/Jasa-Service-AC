# Evidence Registry — Phase 12 Quality & Release Validation
**Project**: TampilKit Studio — AC Service Booking System  
**Edition**: Basic Field Service (CoolCare AC Service)  
**Date**: 2026-10-28  
**Environment**: Local Staging / Test (Windows 11, Node v24.20.0, npm 11.19.0, PostgreSQL 16 local, MinIO Docker)  

---

## 1. Ringkasan Eksekusi Pengujian

| Kategori Pengujian | Test Suite Count | Tests Executed | Tests Passed | Tests Failed | Status |
|---|---|---|---|---|---|
| **TypeScript Typecheck** | 3 Workspaces | Monorepo Check | All Passed | 0 | **PASS** |
| **Frontend Unit & Contract** | 10 Suites | 63 Tests | 63 Passed | 0 | **PASS** |
| **Backend Unit Tests** | 7 Suites | 20 Tests | 20 Passed | 0 | **PASS** |
| **Backend Integration E2E** | 12 Suites | 136 Tests | 136 Passed | 0 | **PASS** |
| **Full Lifecycle Journey E2E** | 1 Suite | 19 Tests | 19 Passed | 0 | **PASS** |
| **Monorepo Production Build** | 3 Packages | 40 Static/Dynamic Routes | All Compiled | 0 | **PASS** |
| **Total Keseluruhan** | **33 Test Suites** | **238 Verifikasi** | **238 Passed** | **0** | **PASS** |

---

## 2. Tabel Registri Bukti (Evidence Registry)

| Evidence ID | Kebutuhan / Requirement | Perintah Eksekusi | Lingkungan & Waktu | Hasil | Berkas Log / Sumber Bukti |
|---|---|---|---|---|---|
| **EV-TC-01** | Pemeriksaan Tipe TypeScript Seluruh Workspace | `npm run typecheck` | Windows 11 / Local Node v24 | **PASS (0 Errors)** | `@tampilkit-ac/frontend`, `@tampilkit-ac/backend`, `@tampilkit-ac/api-contract` |
| **EV-FE-01** | Pengujian Unit Frontend & Skema Kontrak API | `npm test -w @tampilkit-ac/frontend` | Node Test Runner / tsx | **PASS (63/63 Tests)** | `apps/frontend/test/*.spec.ts` |
| **EV-BE-01** | Pengujian Unit Backend (Auth, Health, Storage, Pricing) | `npm run test -w @tampilkit-ac/backend -- --runInBand` | Jest / Node v24 | **PASS (20/20 Tests)** | `apps/backend/src/**/*.spec.ts` |
| **EV-E2E-01** | Pengujian Kesehatan Sistem & Koneksi DB | `jest health.e2e-spec.ts --runInBand` | Fastify / PostgreSQL | **PASS (2/2 Tests)** | `apps/backend/test/health.e2e-spec.ts` |
| **EV-E2E-02** | Otentikasi Inti, Login, Refresh, Sesi | `jest auth.e2e-spec.ts --runInBand` | Fastify / PostgreSQL | **PASS (8/8 Tests)** | `apps/backend/test/auth.e2e-spec.ts` |
| **EV-E2E-03** | RBAC, Penolakan Lintas Peran, Token Replay | `jest auth-rbac-concurrency.e2e-spec.ts --runInBand` | Fastify / PostgreSQL | **PASS (6/6 Tests)** | `apps/backend/test/auth-rbac-concurrency.e2e-spec.ts` |
| **EV-E2E-04** | Pengaturan Profil Bisnis & Katalog Servis | `jest admin-business-catalog.e2e-spec.ts --runInBand` | Fastify / PostgreSQL | **PASS (4/4 Tests)** | `apps/backend/test/admin-business-catalog.e2e-spec.ts` |
| **EV-E2E-05** | API Publik & Sanitasi Data Sensitif | `jest public-api.e2e-spec.ts --runInBand` | Fastify / PostgreSQL | **PASS (7/7 Tests)** | `apps/backend/test/public-api.e2e-spec.ts` |
| **EV-E2E-06** | Manajemen Pelanggan, Multi-Alamat, Unit AC | `jest customers-address-ac.e2e-spec.ts --runInBand` | Fastify / PostgreSQL | **PASS (19/19 Tests)** | `apps/backend/test/customers-address-ac.e2e-spec.ts` |
| **EV-E2E-07** | Mesin Pemesanan, Ketersediaan & Anti-Double-Booking | `jest booking-concurrency.e2e-spec.ts --runInBand` | Fastify / PostgreSQL GiST | **PASS (8/8 Tests)** | `apps/backend/test/booking-concurrency.e2e-spec.ts` |
| **EV-E2E-08** | Dasbor Admin, Jadwal Teknisi, Penugasan SPK | `jest admin-bookings-work-orders.e2e-spec.ts --runInBand` | Fastify / PostgreSQL | **PASS (15/15 Tests)** | `apps/backend/test/admin-bookings-work-orders.e2e-spec.ts` |
| **EV-E2E-09** | Workspace Teknisi, Inspeksi, Checklist, Laporan | `jest technician-workspace.e2e-spec.ts --runInBand` | Fastify / PostgreSQL | **PASS (13/13 Tests)** | `apps/backend/test/technician-workspace.e2e-spec.ts` |
| **EV-E2E-10** | Google Calendar Mock, Enkripsi AES, Outbox | `jest google-calendar-integration.e2e-spec.ts --runInBand` | Fastify / PostgreSQL | **PASS (16/16 Tests)** | `apps/backend/test/google-calendar-integration.e2e-spec.ts` |
| **EV-E2E-11** | Kalkulasi Harga, Faktur, Pembayaran, PDF, CSV | `jest billing-invoices-payments.e2e-spec.ts --runInBand` | Fastify / PostgreSQL / PDFKit | **PASS (19/19 Tests)** | `apps/backend/test/billing-invoices-payments.e2e-spec.ts` |
| **EV-E2E-12** | Customer-to-Payment Full Lifecycle E2E Journey | `jest full-customer-to-payment-lifecycle.e2e-spec.ts --runInBand` | Fastify / PostgreSQL / Full App | **PASS (19/19 Tests)** | `apps/backend/test/full-customer-to-payment-lifecycle.e2e-spec.ts` |
| **EV-BLD-01** | Kompilasi Produksi Monorepo (Contract, Backend, Next.js) | `npm run build` | Next.js 15.5.28 / NestJS 11 | **PASS (0 Errors)** | 40 halaman statis/dinamis ter-generate sukses |
| **EV-SEC-01** | Audit Dependensi & Rantai Pasok | `npm audit` | npm registry | **AUDITED** | 24 vulnerabilities tercatat di `docs/SECURITY_ASSESSMENT.md` |
