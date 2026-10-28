# Arsitektur Sistem — TampilKit AC Booking

## 1. Ringkasan Sistem
TampilKit AC Booking adalah sistem pemesanan janji temu dan manajemen layanan lapangan (*Field Service Appointment Booking*) yang dirancang khusus untuk bisnis servis AC (Demo: CoolCare AC Service) dan dapat digunakan kembali (*reusable*) untuk vertikal home-service lainnya (service elektronik, plumbing, kelistrikan, pembersihan rumah).

## 2. Diagram Arsitektur Tingkat Tinggi
```
+------------------------------------------------------------------+
|                    Browser / Client Device                       |
+------------------------------------------------------------------+
                               |
               (HTTP/HTTPS Port 3000 / Same-Origin)
                               v
+------------------------------------------------------------------+
|                   Next.js Frontend (Port 3000)                   |
|  - App Router, React 19, TypeScript, Tailwind CSS, shadcn/ui    |
|  - Public Routes: /, /services, /services/[slug],                |
|    /service-areas, /gallery, /about, /contact, /booking          |
|  - SEO: sitemap.xml, robots.txt, JSON-LD Schema.org              |
|  - Protected Routes: /dashboard (OWNER/ADMIN), /technician       |
|  - Server Components Auth (`getServerSession`)                   |
|  - Same-Origin BFF Proxy: /api/auth/[...path] -> Port 3001       |
|  - Reverse-proxy rewrites: /api/v1/* -> http://127.0.0.1:3001    |
+------------------------------------------------------------------+
                               |
       (Internal HTTP / Fastify REST API Port 3001)
                               v
+------------------------------------------------------------------+
|             NestJS + Fastify Backend (Port 3001)                 |
|  - @nestjs/platform-fastify, ValidationPipe, Helmet, CORS        |
|  - Global prefix: api/v1                                         |
|  - Swagger Documentation (/api/docs)                             |
|  - Public Module: /public/business, /public/services,            |
|    /public/operating-hours, /public/service-areas, etc.          |
|  - Admin Modules: /admin/business, /admin/services, etc.         |
|  - Auth Module: Jose (JWT), Argon2id, Fastify Cookie             |
|  - Token Rotation & Replay Attack Revocation                     |
|  - RBAC Guards: JwtAuthGuard, RolesGuard (OWNER, ADMIN, TECH)    |
|  - Storage Service: MinIO Private Bucket Integration             |
|  - Shared Contract: @tampilkit-ac/api-contract                   |
+------------------------------------------------------------------+
           |                                          |
   (Prisma ORM Client)                       (MinIO S3 Client)
           v                                          v
+-----------------------+                  +-----------------------+
|  PostgreSQL Database  |                  |   MinIO Object Store  |
|  - tampilkit_ac_      |                  |   - tampilkit-ac-     |
|    booking            |                  |     booking bucket    |
|  - Business, Services,|                  |   - business/logos/   |
|    Categories, Areas  |                  |   - services/images/  |
|  - AuthSession,       |                  |   - gallery/images/   |
|    Audit & RateLimits |                  |                       |
+-----------------------+                  +-----------------------+
```

## 3. Batasan Keamanan & Prinsip Desain
- **Pemisahan Publik & Privat**: Endpoint publik hanya mengembalikan data berstatus `isActive: true` dengan DTO yang tersanitasi.
- **Transparansi Harga**: Menampilkan 3 mode harga secara jujur: `FIXED`, `STARTING_FROM`, dan `INSPECTION_REQUIRED` tanpa menampilkan harga nol fiktif.
- **Ongkos Kunjungan Terpisah**: Biaya perjalanan teknisi ditampilkan independen dari tarif perbaikan.
- **Penyimpanan Gambar Privat**: MinIO bucket bersifat privat. Akses berkas publik dilakukan melalui endpoint proxy streaming atau presigned URL bertenggat waktu.
- **Integritas Relasi Pelanggan & Unit AC (Phase 05)**: Menerapkan Composite Foreign Key di tingkat database PostgreSQL `(customerAddressId, customerId)` untuk mencegah unit AC didaftarkan ke alamat pelanggan lain, serta Partial Unique Index untuk menjamin tepat 1 primary address aktif per pelanggan secara transaksional.
- **Admin Booking & Work Order Management (Phase 08)**: Membangun arsitektur kontrol operasional lapangan komprehensif dengan pemisahan domain reservasi (`Booking`) dan tugas kerja lapangan (`WorkOrder`), diselaraskan secara konsisten dengan PostgreSQL advisory locks, audit logs, status lifecycle transaksional, dan kalender jadwal interaktif multi-view.
- **Technician Field Service Workspace (Phase 09)**: Ruang kerja mobile-first untuk teknisi lapangan dengan validasi status machine (ASSIGNED -> ON_THE_WAY -> ARRIVED -> IN_PROGRESS -> COMPLETED), checklist SOP dinamis per servis, inspeksi teknis unit AC, dokumentasi foto Before/After di MinIO privat, dan validation gates sebelum penyelesaian pekerjaan.
- **Google Calendar Outbox Integration (Phase 10)**: Integrasi dua arah Google Calendar API menggunakan pola Transactional Outbox dengan lease-locking 60s, enkripsi AES-256-GCM pada refresh token, FreeBusy multi-teknisi, dan kebijakan fail-closed saat koneksi eksternal tidak valid.
- **Final Pricing, Billing, Payment & Reporting (Phase 11)**: Arsitektur finansial dengan pelestarian estimasi asli, persetujuan biaya tambahan (*provenance*), pembekuan snapshot faktur (`INV-YYYYMM-XXXXX`), pencatatan pembayaran multi-metode, pencegahan overpayment, kuitansi resmi (`REC-YYYYMM-XXXXX`), generator PDF A4 (PDFKit), dan pelaporan operasional dengan proteksi formula injection (CWE-1236).
- **Release Readiness & Quality Assurance (Phase 12)**: Validasi kualitas komprehensif dengan 238 pengujian otomatis lulus 100%, kompilasi Next.js 40 rute, audit kepatuhan OWASP ASVS 5.0.0, dan kesiapan produksi berstatus TECHNICAL GO.
