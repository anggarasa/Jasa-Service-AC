# Manajemen Direktori & Profil Pelanggan (Customer Management)

Dokumen ini menjelaskan arsitektur, kebijakan identitas, normalisasi nomor telepon, penanganan duplikasi, dan daur hidup data pelanggan pada CoolCare AC Service Booking System.

---

## 1. Arsitektur Data Pelanggan
Model data pelanggan (`Customer`) terisolasi di bawah `Business` aktif. Setiap pelanggan memiliki atribut utama:
- `id`: UUID v4 unik.
- `businessId`: Relasi ke entitas bisnis operasional (CoolCare AC Service).
- `customerCode`: Kode unik yang mudah dibaca manusia (format: `CUS-000001`), dibuat secara aman terhadap konkurensi di server.
- `name`: Nama lengkap pelanggan.
- `phone`: Nomor telepon tersimpan dalam format E.164 (+628...).
- `normalizedPhone`: Nomor telepon ternormalisasi untuk indexing dan pencarian cepat.
- `displayPhone`: Nomor telepon dalam format lokal (`0812-3456-7890`) untuk kemudahan keterbacaan antarmuka staf.
- `email`: Alamat email opsional.
- `notes`: Catatan internal yang hanya dapat dilihat oleh staf berotorisasi (`OWNER`, `ADMIN`).
- `isActive`: Status aktif/arsip (default `true`).
- `archivedAt`: Waktu pengarsipan data.

---

## 2. Kebijakan Identitas & Normalisasi Nomor Telepon
Sistem mendukung beragam variasi input nomor telepon Indonesia:
- `081234567890` (Format lokal standar)
- `+6281234567890` (Format internasional E.164)
- `6281234567890` (Format E.164 tanpa tanda plus)
- `0812 - 3456 - 7890` (Format dengan pemisah spasi atau strip)

Fungsi utilitas `normalizeIndonesianPhone()` melakukan sanitasi karakter non-angka, memverifikasi prefix sah operator telekomunikasi Indonesia (`08`, `628`, `+628`), memvalidasi panjang digit (10–14 digit), dan menghasilkan dua representasi:
1. `normalized`: `+6281234567890`
2. `display`: `0812-3456-7890`

---

## 3. Strategi Deteksi Duplikasi (Tanpa Penggabungan Paksa)
Dalam domain jasa servis rumah tangga (field service), satu nomor telepon sering kali digunakan bersama oleh anggota keluarga (suami, istri, anak) atau sekretaris kantor. Oleh karena itu:
- **Tidak ada constraint strict unique di kolom database** yang memicu kegagalan sistem saat nomor yang sama dimasukkan kembali.
- Disediakan endpoint real-time `GET /api/v1/admin/customers/check-duplicate?phone=...` dengan debouncing pada antarmuka input pelanggan.
- Jika nomor yang dimasukkan terdeteksi mirip atau sama dengan pelanggan existing, formulir menampilkan pemberitahuan (*amber warning alert*) yang memperlihatkan daftar nama dan kode pelanggan terkait.
- Staf admin tetap diberikan keleluasaan untuk mendaftarkan akun baru jika memang nomor tersebut digunakan bersama, tanpa melakukan penggabungan diam-diam (*silent merge*) yang dapat merusak riwayat transaksi.

---

## 4. Kebijakan Pengarsipan Aman (Soft-Delete)
Pelanggan yang tidak lagi aktif tidak dihapus secara destruktif (*hard delete*), melainkan diarsipkan:
- `DELETE /api/v1/admin/customers/:id` mengubah `isActive: false` dan menetapkan `archivedAt: new Date()`.
- Data riwayat pengerjaan, unit AC terpasang, dan log audit pelanggan tetap utuh di database PostgreSQL untuk keperluan kepatuhan finansial dan audit.
- Direktori pelanggan default memfilter `status=active`, namun staf dapat menampilkan data terarsip melalui filter `status=archived` atau `status=all`.

---

## 5. Audit Log Aktivitas Pelanggan
Setiap mutasi data dicatat pada tabel `CustomerAuditLog`:
- `CUSTOMER_CREATED`
- `CUSTOMER_UPDATED`
- `CUSTOMER_ARCHIVED`
Setiap entri memuat `actorUserId`, `action`, `changedFields`, dan timestamp.
