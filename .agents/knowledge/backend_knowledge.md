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

### 2026-10-28 — Penanganan ESM Pustaka `jose` & `@fastify/cookie` pada Lingkungan Pengujian
- **Konteks**: Pustaka modern seperti `jose` v6 murni didistribusikan dalam format ESM. Saat diintegrasikan ke proyek NestJS yang dikompilasi ke CommonJS untuk Jest, eksekusi tes akan gagal tanpa konfigurasi babel/ts-jest khusus.
- **Pelajaran**: Tambahkan `transformIgnorePatterns: ["node_modules/(?!(jose)/)"]` pada konfigurasi Jest backend.
- **Konteks 2**: `@fastify/cookie` v11 menggunakan dynamic `await import('cookie')` yang membutuhkan flag `--experimental-vm-modules` pada runner Jest standar.
- **Pelajaran 2**: Untuk tes integrasi E2E cepat, sediakan mock decorator Fastify cookie atau gunakan harness NestJS Fastify adapter dengan interceptor terisolasi agar tidak memblokir pipeline CI.

### 2026-10-28 — Rotasi Refresh Token Atomik & Deteksi Replay Attack
- **Konteks**: Token refresh rentan terhadap pencurian bila tidak langsung dirotasi dan dilacak status penggunaannya.
- **Pelajaran**: Selalu gunakan Prisma `$transaction` saat merotasi token: tandai token lama sebagai `isRevoked: true` dengan alasan `ROTATED`, dan buat token baru di bawah `familyId` yang sama. Jika token yang sudah berstatus revoked dipanggil kembali, segera cabut seluruh keluarga token dan invalidasi `AuthSession` pengguna.

### 2026-10-28 — Keamanan Public API & Proxy Streaming Media Privat
- **Konteks**: Endpoint publik harus dapat diakses pengunjung anonim tanpa header otorisasi, sementara MinIO bucket tetap berstatus privat untuk mencegah akses liar.
- **Pelajaran**: Gunakan decorator `@Public()` dengan metadata `IS_PUBLIC_KEY` yang dicek oleh `JwtAuthGuard` dan `RolesGuard` sebelum mengevaluasi token. Untuk file media, jangan pernah mengekspos URL presigned jangka panjang tanpa batas atau kredensial internal MinIO; sediakan endpoint streaming publik `GET /api/v1/public/media/:id` yang memvalidasi UUID, memeriksa relasi bisnis/layanan, mengalirkan stream byte dari MinIO, serta menetapkan header `Content-Type`, `Cache-Control: public, max-age=86400`, dan `X-Content-Type-Options: nosniff`.

### 2026-10-28 — Foreign Key Komposit & Partial Unique Index PostgreSQL
- **Konteks**: Pada entitas bertingkat (Customer -> Address -> AC Unit), foreign key sederhana (`customerAddressId`) tidak mencegah unit AC dipindahkan secara ilegal ke alamat milik customer lain. Selain itu, invariant "tepat 1 alamat utama aktif per pelanggan" rentan terhadap race condition jika hanya dijaga di level aplikasi.
- **Pelajaran**: Definisikan composite unique `[id, customerId]` pada tabel `CustomerAddress` dan pasang composite foreign key `[customerAddressId, customerId] REFERENCES CustomerAddress(id, customerId)` pada `AcUnit`. Untuk invariant alamat utama, terapkan PostgreSQL Partial Unique Index: `CREATE UNIQUE INDEX "customer_address_one_active_primary_idx" ON "CustomerAddress" ("customerId") WHERE "isPrimary" = true AND "isActive" = true;`.

### 2026-10-28 — Tipe Paginasi Fastify pada Prisma ORM
- **Konteks**: Fastify mengurai query parameters URL (`page`, `limit`) sebagai string. Jika diteruskan langsung ke `prisma.findMany({ take, skip })`, Prisma Client melempar error runtime `Argument take: Invalid value provided. Expected Int, provided String`.
- **Pelajaran**: Lakukan konversi eksplisit `Number(query.page) || 1` dan `Number(query.limit) || 20` di service backend sebelum menghitung `take` dan `skip`.

### 2026-10-28 — Pencegahan Double Booking & Deadlock Alokasi Sumber Daya
- **Konteks**: Sistem booking lapangan yang melayani banyak teknisi membutuhkan jaminan fisik bahwa teknisi tidak dapat memiliki dua jadwal bertubrukan (*double booking*), sekaligus mencegah deadlock ketika banyak transaksi bersaing memperebutkan teknisi di milidetik yang sama.
- **Pelajaran**: Terapkan GiST Exclusion Constraint pada tabel okupansi menggunakan tipe data range (`tsrange` atau `tstzrange`) dengan ekstensi `btree_gist`: `EXCLUDE USING gist ("technicianId" WITH =, tsrange("startsAt", "endsAt", '[)') WITH &&) WHERE ("status" = 'ACTIVE')`. Di dalam transaksi atomik Prisma, gunakan PostgreSQL Transaction-Level Advisory Lock: `SELECT pg_try_advisory_xact_lock(hashtext(candidate.id)) as locked`. Jika teknisi sedang dikunci oleh transaksi konkuren lain, sistem secara mulus beralih mencoba kandidat teknisi berikutnya tanpa memicu contention atau deadlock pada index GiST.
- **Tanggal: 2026-10-28 (Phase 08 — Admin Booking & Work Order Consistency)**:
  - **Konteks**: Pengelolaan status booking induk dan Surat Perintah Kerja (SPK) lapangan yang saling bergantung pada pembatalan, rescheduling, dan alokasi teknisi.
  - **Pelajaran**: Satukan pembatalan booking dan SPK dalam transaksi atomik. Pastikan filter pembatalan kaskade mencakup semua status aktif yang belum selesai (`status NOT IN [COMPLETED, CANCELLED]`), bebaskan slot `ResourceOccupancy`, dan sinkronisasikan status booking induk saat SPK berpindah ke `IN_PROGRESS` atau `COMPLETED`. Di tingkat controller, hindari pembungkusan ganda objek respons dengan membiarkan `TransformResponseInterceptor` membungkus data mentah secara konsisten.

### 2026-10-28 — IDOR Protection & Validation Gates pada Eksekusi SPK Teknisi (Phase 09)
- **Konteks**: Teknisi lapangan mengakses data pribadi pelanggan dan melakukan perubahan status pekerjaan melalui perangkat seluler, di mana risiko manipulasi parameter ID (IDOR) dan bypass SOP sangat tinggi.
- **Pelajaran**:
  1. Jangan percaya ID teknisi dari request payload. Selalu resolve `technician` dari JWT user ID yang terautentikasi (`where: { userId }`), dan setiap mutasi atau kueri SPK wajib menyertakan filter ganda: `where: { id: workOrderId, technicianId: technician.id }`.
  2. Implementasikan Validation Gates terprogram sebelum transisi ke `COMPLETED`: pastikan semua item AC memiliki catatan inspeksi (`inspectionStatus !== NOT_INSPECTED`), semua checklist wajib telah berstatus `DONE` atau `NOT_APPLICABLE`, dan laporan servis (`summary` dan `workPerformed`) sudah terisi lengkap.
  3. Gunakan `@HttpCode(HttpStatus.OK)` pada endpoint aksi RPC bergaya POST (misalnya `arrive`, `start`, `complete`) untuk mengembalikan HTTP 200 konsisten bagi antarmuka klien.

### 2026-10-28 — Integrasi Google Calendar: Invarian Multi-Teknisi, AES-256-GCM & Outbox Lease Locks (Phase 10)
- **Konteks**: Integrasi kalender pihak ketiga (Google Calendar API) untuk sistem layanan lapangan multi-teknisi dengan persyaratan ketersediaan tinggi, anti-kebocoran token, dan pencegahan overbooking.
- **Pelajaran**:
  1. **Invarian Kalender Bersama**: Saat memproyeksikan jadwal seluruh armada teknisi ke 1 kalender terpusat, tandai event internal secara privat (`extendedProperties.private.source = 'TampilKit-AC'`). Filter event ini pada kueri FreeBusy agar tidak memicu *false positive busy* untuk teknisi lain. Event eksternal non-sistem (`EXTERNAL_BUSY`) tetap dihormati sebagai penutupan toko global.
  2. **Fail-Closed Availability**: Jika koneksi kalender berstatus `REAUTH_REQUIRED` (misalnya refresh token dicabut), kueri availability publik wajib *fail-closed* (mengembalikan slot kosong) untuk mencegah jadwal baru masuk tanpa validasi eksternal, sementara data pemesanan lokal di database tetap terlindungi.
  3. **Keamanan Kriptografi Token & State**: Jangan pernah simpan token mentah Google di database. Gunakan AES-256-GCM dengan 96-bit random IV unik per operasi dan 128-bit Auth Tag. Pada alur OAuth, lindungi parameter `state` dengan tanda tangan HMAC-SHA256, verifikasi dengan `crypto.timingSafeEqual`, dan terapkan masa berlaku 10 menit dengan pencatatan single-use (anti-replay).
  4. **Transactional Outbox & Self-Healing Webhook**: Simpan pekerjaan sinkronisasi ke tabel `CalendarSyncJob` dalam transaksi atomik bersamaan dengan mutasi booking. Worker mengklaim pekerjaan secara atomik dengan *lease lock* 60 detik dan retry eksponensial. Pada integrasi webhook push notification, proses sinkronisasi secara asinkron dan segera balas HTTP 200 (< 500ms). Tangani HTTP 410 Gone secara otomatis dengan memicu Full Sync rekonsiliasi.

### 2026-10-28 — Sistem Finansial, Faktur & Rekonsiliasi Pembayaran On-Site (Phase 11)
- **Konteks**: Penerapan kalkulasi biaya aktual, pembekuan faktur (invoice freeze), verifikasi pembayaran multi-metode, pencegahan overpayment, dan pelaporan operasional berbasis CSV.
- **Pelajaran**:
  1. **Invarian Estimasi vs Aktual**: Estimasi pesanan (`Booking.estimatedTotal`) tidak boleh diubah saat eksekusi lapangan bertambah. Seluruh penambahan jasa dan material wajib dicatat terpisah pada model `WorkOrderCharge` dan `WorkOrderMaterial` dengan persetujuan eksplisit (`ServiceChargeApproval`).
  2. **Pembekuan Item Faktur (Invoice Freeze Invariant)**: Begitu faktur diterbitkan (`ISSUED`), rincian baris ditranslasikan dan dibekukan permanen di tabel `InvoiceItem`. Mutasi atau penambahan biaya pada SPK setelah faktur terbit harus diblokir dengan HTTP 403 Forbidden untuk mencegah selisih akuntansi.
  3. **Pencegahan Overpayment & Rekonsiliasi Bersih**: Verifikasi pembayaran wajib menggunakan transaksi atomik database (`$transaction`) untuk mengecek akumulasi pembayaran terverifikasi vs sisa tagihan. Setiap status faktur (`PARTIALLY_PAID`, `PAID`) dihitung secara matematis deterministik dari saldo, bukan set status manual.
  4. **Perlindungan Formula Injection CSV (CWE-1236)**: Pada ekspor laporan operasional ke format spreadsheet CSV, setiap sel teks yang diawali karakter berbahaya (`=`, `+`, `-`, `@`, `\t`, `\r`) wajib diawali tanda petik tunggal (`'`) untuk mencegah eksekusi makro otomatis di Microsoft Excel atau Google Sheets.
  5. **Integrasi CommonJS PDFKit di NestJS**: Hindari `import PDFDocument from 'pdfkit'` karena menghasilkan runtime error `pdfkit_1.default is not a constructor`. Gunakan sintaks CommonJS teruji `const PDFDocument = require('pdfkit')` dengan penanganan stream buffer asinkron yang aman.
