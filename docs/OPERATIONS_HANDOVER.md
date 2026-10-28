# Operations Handover & Support Manual
**Project**: TampilKit Studio — AC Service Booking System  
**Edition**: Basic Field Service (CoolCare AC Service)  
**Date**: 2026-10-28  

---

## 1. Peran Staf & Akses Sistem

| Peran (Role) | Tanggung Jawab Operasional | Halaman Masuk | Fitur Kunci |
|---|---|---|---|
| **OWNER** (Pemilik Bisnis) | Pengaturan perusahaan, izin staf, integrasi kalender, persetujuan keuangan & ekspor laporan. | `/dashboard` | Settings, Profil Bisnis, Faktur, Pembayaran, Laporan Keuangan CSV. |
| **ADMIN** (Staf Operasional / Kasir) | Konfirmasi pesanan masuk, alokasi penugasan teknisi, reschedule, pembuatan faktur, verifikasi bukti bayar. | `/dashboard` | Pemesanan, SPK, Faktur, Verifikasi Bayar, Jadwal Teknisi. |
| **TECHNICIAN** (Teknisi Lapangan) | Eksekusi pekerjaan di lokasi pelanggan, checklist SOP, inspeksi teknis, foto dokumentasi. | `/technician` | Daftar Tugas Lapangan, Check-in Tiba, Input Inspeksi, Selesai SPK. |
| **GUEST CUSTOMER** (Pelanggan) | Pemesanan mandiri tanpa registrasi akun, pemantauan status pesanan, unduh invoice/kuitansi. | `/booking`, `/booking/manage` | Form Booking, Ringkasan Finansial, Unduh PDF Faktur Resmi. |

---

## 2. Standard Operating Procedures (SOP) Penanganan Insiden

### Skenario 1: Pelanggan Komplain Tidak Bisa Memilih Tanggal Tertentu
- **Penyebab Kemungkinan**:
  - Hari tersebut jatuh pada hari libur bisnis (`BusinessClosure`).
  - Seluruh teknisi pada wilayah layanan tersebut telah memiliki jadwal okupansi penuh.
  - Koneksi Google Calendar berstatus `REAUTH_REQUIRED` (memicu proteksi fail-closed).
- **Langkah Penanganan**:
  1. Login sebagai ADMIN/OWNER ke `/dashboard/technicians/schedule`.
  2. Periksa ketersediaan jam kerja dan blocking teknisi.
  3. Periksa status Google Calendar di `/dashboard/integrations/google-calendar`. Jika token kedaluwarsa, lakukan *Re-authenticate*.

### Skenario 2: Teknisi Melaporkan Biaya Tambahan Freon di Lokasi
- **Langkah Penanganan**:
  1. Teknisi menginformasikan penambahan kebutuhan freon dan lakban pipa kepada pelanggan.
  2. Buka menu `/dashboard/work-orders/[id]/pricing`.
  3. Masukkan rincian jasa tambahan dan material yang dipakai.
  4. Rekam persetujuan pelanggan (`Persetujuan Biaya Tambahan`) dengan metode persetujuan lisan atau foto tanda tangan.
  5. Terbitkan draft faktur resmi menjadi `ISSUED`.

### Skenario 3: Pelanggan Membayar Sebagian Tunai dan Sebagian Transfer
- **Langkah Penanganan**:
  1. Catat pembayaran tunai pertama di `/dashboard/payments` $\rightarrow$ Status berubah ke `PENDING_VERIFICATION`.
  2. Kasir memverifikasi fisik uang tunai $\rightarrow$ Status berubah ke `VERIFIED`. Faktur otomatis berstatus `PARTIALLY_PAID`.
  3. Pelanggan mentransfer sisa tagihan ke rekening bank toko.
  4. Catat pembayaran kedua via transfer bank beserta nomor referensi mutasi.
  5. Kasir memverifikasi mutasi rekening bank $\rightarrow$ Faktur otomatis berstatus `PAID` (Lunas) dan kuitansi `REC-YYYYMM-XXXXX` diterbitkan resmi.
