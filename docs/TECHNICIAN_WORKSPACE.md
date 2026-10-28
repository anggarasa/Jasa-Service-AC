# Dokumen Arsitektur: Technician Workspace & Field Operations

## 1. Ringkasan Eksekutif
Technician Workspace pada TampilKit AC Service Booking System dirancang khusus dengan filosofi **Mobile-First Responsive Web**. Antarmuka ini memberikan kemudahan operasional maksimal bagi teknisi di lapangan yang menggunakan perangkat ponsel (smartphone), tanpa memerlukan instalasi aplikasi native berlebih (PWA-ready).

## 2. Fitur Utama Workspace Teknisi
1. **Dashboard Operasional Lapangan (`/technician`)**:
   - Kartu metrik real-time: Ditugaskan, Dalam Perjalanan, Tiba di Lokasi, Sedang Dikerjakan, dan Selesai Hari Ini.
   - Daftar pekerjaan hari ini dan SPK aktif dengan jam jadwal, estimasi unit, dan akses cepat.
2. **Daftar Pekerjaan Saya (`/technician/jobs`)**:
   - Tab penyaring status: Ditugaskan, Menuju Lokasi, Tiba, Pengerjaan, Selesai, dan Butuh Tindak Lanjut.
   - Kolom pencarian terintegrasi untuk nomor SPK, nama pelanggan, alamat, dan nomor HP.
   - Tombol pintas kontak: Panggilan Telepon (`tel:`), Chat WhatsApp otomatis, dan Buka Navigasi Rute Google Maps.
3. **Detail & Hub Eksekusi SPK (`/technician/jobs/[id]`)**:
   - Status banner dinamis dengan alur kerja tombol aksi kontekstual.
   - Hub 4 modul lapangan: Inspeksi Teknis Unit, Checklist Servis, Dokumentasi Foto, dan Laporan Servis.
   - Ringkasan alamat, nomor kontak, landmark, dan daftar unit AC.
4. **Navigasi Bawah Seluler (`TechnicianBottomNav`)**:
   - Navigasi tetap (sticky bottom nav) di layar mobile untuk akses cepat: Beranda, Tugas SPK, Jadwal, dan Profil.

## 3. Keamanan & Pembatasan Hak Akses (RBAC & IDOR)
- Seluruh rute dan endpoint teknisi diamankan dengan guard NestJS `JwtAuthGuard` dan `RolesGuard` dengan `@Roles(UserRole.TECHNICIAN)`.
- Semua kueri database difilter secara ketat berdasarkan `technicianId` yang di-resolve dari sesi pengguna login. Teknisi tidak dapat melihat, mengubah, atau mengunggah data pada SPK milik teknisi lain.
