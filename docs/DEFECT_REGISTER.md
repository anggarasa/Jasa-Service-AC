# Defect Register & Remediation Log — Phase 12
**Project**: TampilKit Studio — AC Service Booking System  
**Edition**: Basic Field Service (CoolCare AC Service)  
**Date**: 2026-10-28  

---

## 1. Definisi Keparahan Defek (Severity Classification)
- **CRITICAL**: Pelanggaran keamanan, korupsi data finansial, pemesanan ganda (double-booking), atau crash alur inti yang memblokir rilis.
- **HIGH**: Fitur operasional utama terganggu atau eksposur data sensitif.
- **MEDIUM**: Masalah kegunaan, validasi parsial, atau inkonsistensi minor.
- **LOW**: Perbaikan visual non-kritis atau peringatan linter/dependensi tanpa exploitabilitas aktif.

---

## 2. Log Defek yang Ditemukan & Diperbaiki Selama Validasi Phase 12

| Defect ID | Severity | Komponen Terdampak | Deskripsi Masalah & Root Cause | Solusi / Remediasi yang Diterapkan | Status Uji Ulang | Blocker Rilis? |
|---|---|---|---|---|---|---|
| **DEF-12-01** | **CRITICAL** | `AdminBookingsService.verifyAndAllocateTechnician` | Pelanggaran Postgres exclusion constraint `no_overlapping_technician_occupancy` (error `23P01`) saat penugasan teknisi ke pesanan yang sebelumnya sudah memiliki okupansi dari pemesanan tamu. | Menambahkan pembebasan otomatis (`status = 'CANCELLED'`) untuk okupansi aktif lama pada booking tersebut sebelum membuat okupansi baru di dalam `$transaction`. | **FIXED & VERIFIED (PASS)** | Tidak (Sudah Teratasi) |
| **DEF-12-02** | **HIGH** | `apps/backend/test/booking-concurrency.e2e-spec.ts` | Pembersihan data uji coba gagal akibat foreign key constraint `RESTRICT` pada `WorkOrder_bookingId_fkey` dan `PaymentReceipt_paymentId_fkey`. | Menambahkan urutan cascading delete yang benar di `beforeAll` dan `afterAll` (`PaymentReceipt` $\rightarrow$ `Payment` $\rightarrow$ `Invoice` $\rightarrow$ `WorkOrder` $\rightarrow$ `Booking`). | **FIXED & VERIFIED (PASS)** | Tidak (Sudah Teratasi) |
| **DEF-12-03** | **MEDIUM** | Frontend React Hooks `useEffect` | Peringatan linter `react-hooks/exhaustive-deps` pada beberapa halaman dasbor admin & teknisi karena fungsi fetching dideklarasikan di luar hook tanpa `useCallback`. | Kompilasi build Next.js tetap berhasil dengan peringatan. Direkomendasikan pembungkusan `useCallback` pada siklus refactoring berikutnya. | **MONITORED (PASS BUILD)** | Tidak |
| **DEF-12-04** | **LOW** | Dependensi npm (`npm audit`) | 24 dependensi terdeteksi memiliki advisories (Fastify, Next.js, PostCSS, MinIO SDK). | Analisis membuktikan tidak ada celah yang langsung dapat dieksploitasi dalam konteks implementasi TampilKit. Dependensi dipertahankan stabil untuk menghindari breaking changes. | **ANALYZED & ACCEPTED** | Tidak |

---

## 3. Status Release Blockers
- **Jumlah Unresolved Critical Blockers**: **0 (NOL)**.
- **Kondisi Integritas Sistem**: Stabil, seluruh tes E2E dan unit lulus 100%.
