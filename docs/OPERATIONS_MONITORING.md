# Operations & Reliability Monitoring Guide
**Project**: TampilKit Studio — AC Service Booking System  
**Edition**: Basic Field Service (CoolCare AC Service)  
**Date**: 2026-10-28  

---

## 1. Titik Pantau Kesehatan (Health Check Endpoints)

| Endpoint | Frekuensi Pantau | Respons Sehat | Tindakan Jika Gagal |
|---|---|---|---|
| `GET /api/v1/health` | Setiap 30 detik | `200 OK`, `{"status":"ok","database":"connected"}` | Periksa koneksi PostgreSQL dan load process backend Fastify. |
| `GET /api/v1/health/live` | Setiap 10 detik | `200 OK`, `{"status":"ok"}` | Indikator liveness Kubernetes / Docker. Jika timeout, restart container. |
| `GET /api/v1/public/business` | Setiap 60 detik | `200 OK` | Verifikasi sanitasi endpoint publik dan konektivitas cache. |

---

## 2. Metrik Kunci & Ambang Batas Peringatan (Alert Thresholds)

1. **HTTP Error Rate**:
   - Peringatan (*Warning*): 5xx error rate > 0.5% selama 3 menit.
   - Kritis (*Critical*): 5xx error rate > 2.0% selama 1 menit $\rightarrow$ Pemicu Rollback.
2. **Keterlambatan Job Outbox Google Calendar**:
   - Peringatan: Ada job di `CalendarSyncJob` berstatus `PENDING` dengan usia > 5 menit.
   - Kritis: Ada job dengan `attemptCount >= 5` berstatus `FAILED` $\rightarrow$ Periksa status token Google OAuth di dasbor admin.
3. **Database Connection Pool**:
   - Ambang: Koneksi aktif PostgreSQL mencapai > 85% dari batas `max_connections`.
4. **Penyimpanan MinIO**:
   - Peringatan: Sisa kuota disk MinIO < 20%.

---

## 3. Format Structured Logging & Privasi

Aplikasi menggunakan logging JSON terstruktur dengan **sanitasi data sensitif**:
- Setiap request masuk diberi `reqId` unik (`x-request-id`) untuk penelusuran end-to-end.
- **Data yang DILARANG DICATAT**:
  - Nilai token JWT (`tk_ac_access`, `tk_ac_refresh`).
  - Kata sandi teks mentah (login / ubah kata sandi).
  - Refresh token Google OAuth & Client Secret.
  - Secret access key MinIO.
  - Foto fisik bukti bayar / kartu identitas pelanggan.
