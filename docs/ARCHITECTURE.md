# Arsitektur Sistem — TampilKit AC Booking (Phase 01)

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
|  - Centralized API Client (@/lib/api/client.ts)                  |
|  - Reverse-proxy rewrites: /api/v1/* -> http://127.0.0.1:3001    |
+------------------------------------------------------------------+
                               |
          (Internal HTTP / Proxy to Backend Port 3001)
                               v
+------------------------------------------------------------------+
|             NestJS + Fastify Backend (Port 3001)                 |
|  - @nestjs/platform-fastify, ValidationPipe, Helmet, CORS        |
|  - Global prefix: api/v1                                         |
|  - Swagger Documentation (/api/docs)                             |
|  - Response Interceptor & Global Exception Filter                |
|  - Shared Contract: @tampilkit-ac/api-contract                   |
+------------------------------------------------------------------+
           |                                          |
   (Prisma ORM Client)                       (MinIO S3 Client)
           v                                          v
+-----------------------+                  +-----------------------+
|  PostgreSQL Database  |                  |   MinIO Object Store  |
|  - tampilkit_ac_      |                  |   - tampilkit-ac-     |
|    booking            |                  |     booking bucket    |
+-----------------------+                  +-----------------------+
```

## 3. Batasan Fase & Keamanan
- **Autentikasi (Phase 02)**: Arsitektur JWT Access Token (15m) + Refresh Token (7d) dalam HttpOnly Cookie, token rotation, dan RBAC (OWNER, ADMIN, TECHNICIAN). Tidak ada penyimpanan token sensitif di localStorage frontend.
- **Integrasi Kalender (Phase 10)**: Model `CalendarConnection` disiapkan untuk Google Calendar API sinkronisasi jadwal teknisi.
- **Object Storage**: Bucket bersifat *private*. Seluruh akses berkas foto unit AC, bukti servis, dan logo menggunakan URL unduhan presigned bertenggat waktu.
