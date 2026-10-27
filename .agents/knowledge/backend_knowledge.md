# Knowledge Base: Backend Engineering

## Section A — Aturan Permanen (Level Enterprise)

### Desain API
- Konsisten pilih satu gaya (REST/GraphQL/gRPC) sesuai kebutuhan, jangan campur tanpa alasan jelas.
- Versioning API sejak awal (`/api/v1/...`) supaya breaking change di masa depan tidak merusak client lama.
- Response format konsisten di seluruh endpoint (struktur sukses & error yang seragam, termasuk kode error yang jelas).

### Arsitektur
- Pisahkan layer: Controller/Route (terima request) → Service (logic bisnis) → Repository/DAO (akses data). Jangan taruh query database langsung di controller.
- Gunakan DTO/schema (mis. Zod, class-validator, Pydantic) untuk validasi & transformasi data masuk — jangan percaya body request mentah.
- Business logic tidak boleh bergantung langsung ke framework HTTP (biar gampang ditest & dipindah).

### Keamanan (rujukan: OWASP Top 10)
- Validasi & sanitasi SEMUA input dari luar (body, query, header, params).
- Gunakan parameterized query/ORM untuk cegah SQL Injection — jangan pernah concat string SQL manual.
- Autentikasi: hash password dengan algoritma kuat (bcrypt/argon2), JWT dengan expiry wajar + refresh token, atau OAuth2 kalau perlu login pihak ketiga.
- Otorisasi: cek permission di SETIAP endpoint yang butuh, jangan andalkan "tidak ditampilkan di UI" sebagai proteksi.
- Rate limiting untuk endpoint sensitif (login, register, forgot password).
- Semua secret (API key, DB credential, JWT secret) lewat environment variable, tidak pernah hardcode atau ter-commit ke git.
- Set CORS secara eksplisit, jangan `*` di production.

### Database
- Desain skema ternormalisasi secukupnya (hindari over-normalization yang bikin query ribet, hindari juga duplikasi data tak terkontrol).
- Index kolom yang sering dipakai untuk filter/join/sort.
- Migrasi database HARUS versioned & reversible (jangan edit manual di production).
- Gunakan transaction untuk operasi yang harus atomic (multi-step write yang saling bergantung).

### Reliability & Observability
- Logging terstruktur (bukan sekadar `console.log`), sertakan request ID/correlation ID untuk tracing.
- Health check endpoint (`/health`) untuk kebutuhan monitoring/deployment.
- Error handling konsisten: tangkap error tak terduga di level global, jangan biarkan proses crash tanpa log.

### Skalabilitas
- Gunakan caching (Redis/in-memory) untuk data yang sering diakses & jarang berubah.
- Proses berat/lama (kirim email, generate report) lewat job queue/worker asinkron, jangan blok request utama.
- Desain stateless supaya bisa di-scale horizontal (jangan simpan session di memory server tunggal kalau butuh multi-instance).

### Testing & Dokumentasi
- Unit test untuk business logic, integration test untuk endpoint penting.
- Dokumentasikan API (OpenAPI/Swagger) supaya frontend/mobile engineer bisa integrasi tanpa nebak-nebak.

## Section B — Pembelajaran Dinamis (diisi otomatis oleh @curator)
> Format: `- [YYYY-MM-DD] [Kategori] Deskripsi pelajaran & cara mencegahnya.`

_(Belum ada entry.)_
