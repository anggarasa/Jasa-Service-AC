# Pencegahan Pemesanan Ganda & Penanganan Konkurensi Database

## 1. Perlindungan Dua Lapis (Defense-in-Depth)

### Lapis 1 — PostgreSQL Exclusion Constraint (Physical Database Barrier)
Pada tabel `ResourceOccupancy`, diterapkan *GiST Exclusion Constraint* menggunakan ekstensi `btree_gist`:

```sql
ALTER TABLE "ResourceOccupancy"
ADD CONSTRAINT "no_overlapping_technician_occupancy"
EXCLUDE USING gist (
    "technicianId" WITH =,
    tsrange("startsAt", "endsAt", '[)') WITH &&
)
WHERE ("status" = 'ACTIVE');
```

- **Jaminan**: Engine PostgreSQL menolak secara fisik jika ada 2 baris `ResourceOccupancy` aktif pada `technicianId` yang sama dengan rentang waktu yang bertubrukan (*overlapping*), melempar error kode `23P01`.
- **Kekebalan**: Kebal terhadap bug aplikasi, *read-then-write race condition*, atau kegagalan isolasi transaksi.

### Lapis 2 — PostgreSQL Advisory Locks (Deadlock-Free Resource Dispatching)
Untuk mencegah *page lock contention* pada index GiST saat transaksi berjalan bersamaan:
```sql
SELECT pg_try_advisory_xact_lock(hashtext(technicianId)) as locked;
```
Transaksi secara otomatis beralih ke teknisi berikutnya jika teknisi pertama sedang diakses transaksi lain.

---

## 2. Idempotensi Pengajuan Pemesanan (`BookingIdempotency`)
Setiap request `POST /api/v1/public/bookings` menyertakan `idempotencyKey` yang di-hash dengan SHA-256 (`keyHash`):
1. **Permintaan Pertama**: Didaftarkan dengan status `IN_PROGRESS`.
2. **Koneksi Terputus / Retry Otomatis**: Jika request yang sama dipanggil ulang, backend mengenali request fingerprint dan mengembalikan payload pemesanan yang sama (`COMMITTED`) tanpa membuat reservasi ganda.
3. **Payload Berbeda dengan Key Sama**: Ditolak `409 Conflict`.
