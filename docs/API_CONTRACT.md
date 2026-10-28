# Spesifikasi Shared API Contract — @tampilkit-ac/api-contract

## 1. Format Standar Respons

### Respons Berhasil (Success)
```json
{
  "success": true,
  "data": {
    "application": "tampilkit-ac-booking",
    "status": "operational",
    "dependencies": {
      "database": "connected",
      "storage": "connected"
    }
  },
  "correlationId": "req-1a2b3c4d"
}
```

### Respons Gagal (Error)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validasi data masukan gagal.",
    "details": ["Nomor telepon harus diawali dengan format valid"]
  },
  "correlationId": "req-1a2b3c4d"
}
```

## 2. Endpoint Health (Phase 01)
- `GET /api/v1/health`: Menampilkan status sistem umum dan konektivitas dependensi (database, storage).
- `GET /api/v1/health/live`: Liveness check untuk container orchestrator.
- `GET /api/v1/health/ready`: Readiness check yang mengembalikan HTTP 200 jika siap dan HTTP 503 jika salah satu dependensi penting bermasalah.
