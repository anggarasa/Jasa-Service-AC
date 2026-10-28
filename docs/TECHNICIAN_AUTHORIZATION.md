# Dokumen Keamanan: Technician Authorization & IDOR Protection

## 1. Prinsip Least Privilege & Scoped Access
Teknisi lapangan hanya memiliki wewenang untuk melihat dan berinteraksi dengan tugas pekerjaan yang secara spesifik **ditugaskan kepada dirinya**.

## 2. Resolusi Identitas Teknisi di Backend
Daripada mempercayai parameter input pengguna atau query string, identitas teknisi selalu di-resolve langsung dari JWT Token yang telah diverifikasi secara kriptografis:

```typescript
const technician = await this.prisma.technician.findUnique({
  where: { userId: user.id },
  include: { user: true, business: true },
});

if (!technician || !technician.isActive) {
  throw new ForbiddenException(
    'Profil teknisi tidak ditemukan atau status akun teknisi belum aktif.',
  );
}
```

## 3. Pencegahan Insecure Direct Object References (IDOR)
Dalam setiap endpoint modifikasi SPK:
- `getMyWorkOrderDetail`
- `startJourney`
- `arrive`
- `startWork`
- `saveUnitInspection`
- `updateChecklistItem`
- `uploadPhoto`
- `deletePhoto`
- `saveServiceReport`
- `completeWorkOrder`
- `followUpWorkOrder`

Kueri Prisma wajib menyertakan filter ganda:
```typescript
const workOrder = await this.prisma.workOrder.findFirst({
  where: {
    id: workOrderId,
    technicianId: technician.id,
  },
});

if (!workOrder) {
  throw new NotFoundException('SPK tidak ditemukan atau bukan milik Anda.');
}
```
Jika teknisi mencoba mengakses UUID pekerjaan milik rekan teknisi lain, sistem secara aman mengembalikan HTTP 404 (Not Found) untuk mencegah information disclosure.

## 4. Keamanan Unggah & Streaming Foto Dokumentasi
- Validasi magic byte di backend membatasi unggahan hanya pada format gambar asli (JPEG, PNG, WebP) dengan batasan ukuran 5 MB.
- Streaming foto media pribadi (`GET /work-orders/:id/photos/:photoId/content`) memverifikasi kepemilikan SPK oleh teknisi pemohon sebelum menyalurkan stream dari MinIO.
