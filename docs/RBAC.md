# Role-Based Access Control (RBAC) Specification (Phase 02)

## 1. Definisi Peran (Roles)

Sistem TampilKit AC Service Booking menerapkan kontrol akses berbasis peran (RBAC) pada level backend guard dan level antarmuka pengguna (UI routing).

| Role | Deskripsi Tanggung Jawab | Rute Frontend Utama | Rute Terlarang |
|---|---|---|---|
| **OWNER** | Pemilik bisnis AC; memiliki kewenangan tertinggi atas seluruh entitas bisnis, konfigurasi operasional, manajemen akun staf, dan audit log. | `/dashboard` | Tidak ada |
| **ADMIN** | Manajer operasional kantor; mengelola pemesanan pelanggan, jadwal harian, penugasan teknisi, dan inventaris unit AC. | `/dashboard` | Konfigurasi sistem sensitif OWNER (di fase mendatang) |
| **TECHNICIAN** | Teknisi lapangan; mengakses jadwal kerja pribadi, detail alamat pelanggan di lapangan, update status servis unit, dan profil pribadi. | `/technician` | Seluruh dashboard manajerial kantor `/dashboard/*` |

---

## 2. Implementasi Backend Guard

Backend NestJS menyediakan dua guard utama yang digunakan secara deklaratif:
- `JwtAuthGuard`: Memverifikasi keabsahan sesi dan token JWT. Rute bersifat terproteksi secara default kecuali diberi decorator `@Public()`.
- `RolesGuard`: Memeriksa apakah role pengguna yang terdapat dalam token payload memenuhi kriteria decorator `@Roles(...)`.

### Contoh Penerapan pada Controller:
```typescript
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderController {
  // Hanya OWNER dan ADMIN yang dapat melihat seluruh order
  @Get()
  @Roles(Role.OWNER, Role.ADMIN)
  async listAllOrders() { ... }

  // TECHNICIAN hanya dapat melihat tugas yang ditugaskan kepadanya
  @Get('my-jobs')
  @Roles(Role.TECHNICIAN)
  async listAssignedJobs(@CurrentUser() user: AuthenticatedUser) { ... }
}
```

Jika pengguna dengan role tidak sesuai mencoba mengakses endpoint tersebut, guard langsung mengembalikan respon `403 Forbidden`:
```json
{
  "statusCode": 403,
  "message": "Akses ditolak: role Anda tidak memiliki izin untuk rute ini.",
  "error": "Forbidden"
}
```

---

## 3. Isolasi Antarmuka Pengguna (Frontend)

Pada sisi Next.js App Router, proteksi diterapkan di Server Components layout:
1. `apps/frontend/src/app/(dashboard)/layout.tsx`:
   - Memeriksa sesi via `getServerSession()`.
   - Jika pengguna tidak terautentikasi, di-redirect ke `/login`.
   - Jika role pengguna adalah `TECHNICIAN`, layout langsung mengarahkan (*redirect*) ke workspace khususnya di `/technician`.
2. `apps/frontend/src/app/(technician)/layout.tsx`:
   - Workspace terpisah dengan navigasi khusus lapangan (mobile-friendly).
   - Menyediakan fitur profil, keamanan akun, dan tampilan tugas kerja tanpa membebani teknisi dengan metrik analitik bisnis kantor.

---

## 4. Matriks Akses Endpoint Fase 02

| Endpoint | Publik | TECHNICIAN | ADMIN | OWNER |
|---|---|---|---|---|
| `POST /api/v1/auth/login` | ✅ | ✅ | ✅ | ✅ |
| `POST /api/v1/auth/refresh` | ✅ | ✅ | ✅ | ✅ |
| `POST /api/v1/auth/logout` | ❌ | ✅ | ✅ | ✅ |
| `POST /api/v1/auth/logout-all`| ❌ | ✅ | ✅ | ✅ |
| `GET /api/v1/auth/me` | ❌ | ✅ | ✅ | ✅ |
| `GET /api/v1/auth/sessions` | ❌ | ✅ | ✅ | ✅ |
| `DELETE /api/v1/auth/sessions/:id` | ❌ | ✅ (Sesi sendiri) | ✅ (Sesi sendiri) | ✅ (Semua sesi) |
| `PATCH /api/v1/auth/profile` | ❌ | ✅ | ✅ | ✅ |
| `POST /api/v1/auth/change-password` | ❌ | ✅ | ✅ | ✅ |
