# Kebijakan Privasi & Batasan Akses Data Pelanggan (Customer Data Privacy)

Dokumen ini menguraikan kebijakan privasi data pelanggan, pembatasan otorisasi peran (RBAC), dan pemisahan akses operasional pada CoolCare AC Service Booking System.

---

## 1. Prinsip Minimalisasi & Perlindungan Data Pribadi
1. **Penyimpanan Selektif**: Sistem hanya mengumpulkan data yang mutlak diperlukan untuk operasional servis lapangan (Nama, Nomor Kontak WhatsApp/Telepon, Alamat Servis, dan Catatan Teknis Unit AC).
2. **Tidak Ada Akun Pelanggan Publik di Fase Ini**: Pelanggan tidak diberikan kredensial login atau password, sehingga meniadakan risiko kebocoran data akibat pencurian kredensial akun pelanggan publik.
3. **Penyembunyian Data dari Titik Publik**:
   - Seluruh endpoint direktori pelanggan, alamat, unit AC, dan foto berada di bawah prefix `/api/v1/admin/*`.
   - Endpoint publik Phase 04 (`/api/v1/public/*`) tidak memiliki referensi atau eksposur terhadap data pelanggan, nomor telepon pribadi, maupun alamat tinggal pelanggan.

---

## 2. Matriks Otorisasi Peran (RBAC) Phase 05

| Fitur / Aksi | OWNER | ADMIN | TECHNICIAN | Publik (Anonim) |
|---|:---:|:---:|:---:|:---:|
| Lihat Direktori Global Pelanggan | Ya | Ya | **Ditolak (403)** | **Ditolak (401)** |
| Tambah / Edit Pelanggan | Ya | Ya | **Ditolak (403)** | **Ditolak (401)** |
| Arsipkan Pelanggan | Ya | Ya | **Ditolak (403)** | **Ditolak (401)** |
| Kelola Multi-Alamat Pelanggan | Ya | Ya | **Ditolak (403)** | **Ditolak (401)** |
| Kelola Unit AC & Pindah Alamat | Ya | Ya | **Ditolak (403)** | **Ditolak (401)** |
| Unggah & Hapus Foto Dokumentasi AC | Ya | Ya | **Ditolak (403)** | **Ditolak (401)** |
| Akses Konten Foto MinIO AC | Ya | Ya | **Ditolak (403)** | **Ditolak (401)** |
| Audit Log Mutasi Pelanggan | Ya | Ya (Baca) | **Ditolak (403)** | **Ditolak (401)** |

> **Catatan untuk Teknisi**: Pada fase lanjutan (Phase 06 & 07), teknisi hanya akan diberikan akses terbatas ke alamat dan unit AC yang tertera secara spesifik pada surat perintah kerja (*Work Order*) yang ditugaskan kepada mereka. Teknisi tidak pernah diberikan akses untuk menjelajahi direktori pelanggan secara bebas.

---

## 3. Log Audit Mutasi Data Pelanggan
Tabel `CustomerAuditLog` mencatat setiap perubahan data yang dilakukan oleh staf:
- Siapa aktor yang melakukan mutasi (`actorUserId`).
- Aksi yang dilakukan (`CUSTOMER_CREATED`, `CUSTOMER_UPDATED`, `ADDRESS_CREATED`, `PRIMARY_ADDRESS_CHANGED`, `AC_UNIT_MOVED`, dll).
- Nilai field yang berubah (`changedFields`).
- Waktu kejadian (`createdAt`).

Log audit ini berstatus append-only (tidak dapat dimodifikasi atau dihapus oleh staf admin melalui rute CRUD biasa).
