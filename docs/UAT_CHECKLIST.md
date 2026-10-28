# User Acceptance Testing (UAT) Checklist & Scenario Log
**Project**: TampilKit Studio — AC Service Booking System  
**Edition**: Basic Field Service (CoolCare AC Service)  
**Date**: 2026-10-28  

---

## 1. Skenario UAT Pelanggan Tamu (Guest Customer)

| No | Skenario Pengujian | Hasil yang Diharapkan | Status Eksekusi | Status Sign-off Stakeholder |
|---|---|---|---|---|
| **UAT-CUST-01** | Buka halaman utama dan telusuri katalog servis | Informasi jasa servis, garansi, ulasan, dan area layanan tampil jelas. | **PASS** | PENDING STAKEHOLDER |
| **UAT-CUST-02** | Pilih layanan Cuci AC Split dengan 2 unit AC | Form dapat menambah unit AC, mengisi PK, dan menghitung estimasi biaya otomatis. | **PASS** | PENDING STAKEHOLDER |
| **UAT-CUST-03** | Pilih tanggal dan slot ketersediaan teknisi | Hanya slot yang benar-benar tersedia yang dapat dipilih. | **PASS** | PENDING STAKEHOLDER |
| **UAT-CUST-04** | Kirim reservasi dan terima kode pemesanan | Pesanan berstatus PENDING, kode `ACB-YYYYMM-XXXXX` terbit, dan tautan kelola pesanan dapat diakses. | **PASS** | PENDING STAKEHOLDER |
| **UAT-CUST-05** | Pantau status dan unduh faktur resmi | Pelanggan dapat melihat status penagihan dan mengunduh PDF faktur resmi tanpa perlu mendaftar akun. | **PASS** | PENDING STAKEHOLDER |

---

## 2. Skenario UAT Staf Admin & Kasir (ADMIN)

| No | Skenario Pengujian | Hasil yang Diharapkan | Status Eksekusi | Status Sign-off Stakeholder |
|---|---|---|---|---|
| **UAT-ADM-01** | Login staf dan lihat dasbor metrik | Metrik pesanan masuk, jadwal harian, dan ringkasan SPK tampil akurat. | **PASS** | PENDING STAKEHOLDER |
| **UAT-ADM-02** | Konfirmasi pesanan tamu dan tugaskan teknisi | Status berubah ke CONFIRMED $\rightarrow$ ASSIGNED, teknisi menerima penugasan. | **PASS** | PENDING STAKEHOLDER |
| **UAT-ADM-03** | Terbitkan SPK (Surat Perintah Kerja) | SPK `WO-YYYYMMDD-XXXX` terbit, item checklist tergenerasi otomatis. | **PASS** | PENDING STAKEHOLDER |
| **UAT-ADM-04** | Reschedule jadwal atas permintaan pelanggan | Jadwal baru dialokasikan tanpa benturan waktu teknisi lain. | **PASS** | PENDING STAKEHOLDER |
| **UAT-ADM-05** | Terbitkan Faktur Resmi (Invoice) | Item faktur dibekukan permanen, nomor `INV-YYYYMM-XXXXX` tercatat. | **PASS** | PENDING STAKEHOLDER |
| **UAT-ADM-06** | Catat dan verifikasi pembayaran bertahap | Sisa tagihan berkurang otomatis, overpayment dicegah, status lunas akurat. | **PASS** | PENDING STAKEHOLDER |

---

## 3. Skenario UAT Teknisi Lapangan (TECHNICIAN)

| No | Skenario Pengujian | Hasil yang Diharapkan | Status Eksekusi | Status Sign-off Stakeholder |
|---|---|---|---|---|
| **UAT-TECH-01** | Login teknisi dan buka daftar pekerjaan hari ini | Hanya pekerjaan yang ditugaskan ke dirinya yang terlihat (anti-IDOR). | **PASS** | PENDING STAKEHOLDER |
| **UAT-TECH-02** | Update perjalanan dan check-in kedatangan | Status ON_THE_WAY $\rightarrow$ ARRIVED dengan koordinat GPS check-in. | **PASS** | PENDING STAKEHOLDER |
| **UAT-TECH-03** | Input inspeksi teknis unit AC | Pengukuran suhu, tekanan freon, dan arus listrik tersimpan aman. | **PASS** | PENDING STAKEHOLDER |
| **UAT-TECH-04** | Centang checklist SOP servis AC | Item checklist tercentang DONE, catatan pengerjaan tersimpan. | **PASS** | PENDING STAKEHOLDER |
| **UAT-TECH-05** | Unggah foto dokumentasi Before/After | Foto terunggah ke bucket privat MinIO dan dapat ditinjau kembali. | **PASS** | PENDING STAKEHOLDER |
| **UAT-TECH-06** | Selesaikan pekerjaan dengan laporan servis | Status SPK berubah ke COMPLETED setelah validation gate terpenuhi. | **PASS** | PENDING STAKEHOLDER |

---

## 4. Skenario UAT Pemilik Bisnis (OWNER)

| No | Skenario Pengujian | Hasil yang Diharapkan | Status Eksekusi | Status Sign-off Stakeholder |
|---|---|---|---|---|
| **UAT-OWN-01** | Konfigurasi profil bisnis dan jam operasional | Perubahan jam buka dan nomor kontak langsung teraplikasi di web publik. | **PASS** | PENDING STAKEHOLDER |
| **UAT-OWN-02** | Pengaturan harga katalog dan area jangkauan | Tarif dasar dan biaya kunjungan per kecamatan terkelola fleksibel. | **PASS** | PENDING STAKEHOLDER |
| **UAT-OWN-03** | Pengaturan integrasi Google Calendar | Status koneksi akun Google, antrean sync job, dan konflik kalender terkelola. | **PASS** | PENDING STAKEHOLDER |
| **UAT-OWN-04** | Tinjau laporan finansial dan ekspor CSV | Rekonsiliasi kas masuk vs tagihan terpisah jelas, ekspor CSV aman. | **PASS** | PENDING STAKEHOLDER |
| **UAT-OWN-05** | Manajemen sesi login dan keamanan akun | Dapat melihat daftar sesi aktif dan mencabut sesi yang tidak dikenal. | **PASS** | PENDING STAKEHOLDER |
