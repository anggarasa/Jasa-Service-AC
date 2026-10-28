# Prosedur Inisialisasi Akun OWNER (CLI Bootstrap)

## 1. Ikhtisar

Dalam sistem TampilKit AC Service Booking, tidak ada pendaftaran akun terbuka untuk publik (Customer Self-Registration). Akun super-administrator utama (**OWNER**) diinisialisasi secara aman melalui perintah CLI (*Command Line Interface*).

CLI ini beroperasi secara **idempotent**:
- Jika akun belum ada di database, CLI akan membuat akun baru dengan hashing Argon2id.
- Jika akun sudah ada, CLI akan memperbarui nama dan kata sandi tanpa merusak data relasi yang sudah ada.

---

## 2. Cara Menjalankan Bootstrap

Jalankan perintah dari direktori root proyek:

```bash
# Menjalankan script bootstrap dengan akun default atau environment variable
npm run auth

# Atau secara eksplisit pada workspace backend
npm run auth -w @tampilkit-ac/backend
```

### Opsi Parameter Lingkungan (Environment Variables)
Anda dapat menyesuaikan kredensial yang dibuat dengan menyetel variabel lingkungan saat eksekusi:

```bash
# Contoh pada bash / PowerShell:
$env:BOOTSTRAP_OWNER_EMAIL="pemilik@coolcare.id"
$env:BOOTSTRAP_OWNER_PASSWORD="KataSandiKuatBaru123!"
$env:BOOTSTRAP_OWNER_NAME="Budi Hartono (Owner)"
npm run auth
```

---

## 3. Akun Bawaan Lingkungan Pengembangan (Development Seed)

Skrip bootstrap secara otomatis menginisialisasi tiga akun standar untuk pengujian RBAC pada lingkungan lokal:

| Peran (Role) | Email | Kata Sandi Bawaan | Lingkup Akses |
|---|---|---|---|
| **OWNER** | `owner@coolcare.id` | `OwnerSecurePass123!` | Akses penuh dashboard `/dashboard` |
| **ADMIN** | `admin@coolcare.id` | `AdminSecurePass123!` | Manajemen kantor `/dashboard` |
| **TECHNICIAN** | `technician@coolcare.id` | `TechSecurePass123!` | Workspace lapangan `/technician` |

> ⚠️ **PERINGATAN KEAMANAN**: Pada lingkungan produksi, segera ubah kata sandi akun default di atas melalui menu **Pengaturan Keamanan Akun** (`/dashboard/security` atau `/technician/security`) atau atur `BOOTSTRAP_OWNER_PASSWORD` dengan nilai acak yang aman.
