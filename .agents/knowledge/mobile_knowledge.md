# Knowledge Base: Mobile Engineering

## Section A — Aturan Permanen (Level Enterprise)

### Arsitektur
- Gunakan Clean Architecture / feature-first structure dengan pemisahan jelas: Presentation (UI + state) ↔ Domain (business logic, use case) ↔ Data (repository, API/local source).
- State management konsisten satu pola di seluruh app (BLoC/Riverpod/Provider untuk Flutter; Redux/Zustand/Context untuk React Native) — jangan campur banyak pola sekaligus.
- Dependency Injection untuk memudahkan testing (get_it/injectable, atau setara di platform lain).

### Navigasi & UX
- Gunakan navigator/router deklaratif (go_router, React Navigation) dengan guard untuk halaman yang butuh auth.
- Ikuti guideline platform: Material Design di Android, Human Interface Guidelines di iOS — tapi tetap konsisten dengan brand identity dari design tokens.
- Beri feedback visual untuk setiap aksi (loading state, disabled state saat submit, pesan error yang jelas).

### Data & Offline
- Kalau app butuh kerja offline, gunakan local storage/database (Hive/SQLite/Realm) dengan strategi sync yang jelas ke server saat online lagi.
- Cache response API yang jarang berubah untuk mengurangi request berulang.

### Keamanan
- Simpan data sensitif (token, credential) di secure storage (Keychain/Keystore), bukan di shared preferences/local storage biasa.
- Gunakan SSL pinning untuk komunikasi API yang sensitif.
- Aktifkan biometric auth untuk aksi sensitif kalau relevan (buka app, konfirmasi transaksi).
- Obfuscate build untuk production release supaya kode lebih sulit di-reverse-engineer.

### Performa
- Cache & compress gambar, gunakan ukuran gambar sesuai kebutuhan tampilan (jangan load gambar resolusi penuh untuk thumbnail).
- Virtualisasi list panjang (ListView.builder, FlatList dengan `getItemLayout`).
- Perhatikan ukuran build final (app size) — hindari dependency yang tidak perlu.

### Notifikasi & Deep Link
- Push notification harus punya fallback kalau permission ditolak user.
- Deep link/universal link diuji untuk semua state app (cold start, background, foreground).

### Release & Testing
- Widget/unit test untuk logic penting, minimal manual test checklist sebelum rilis ke store.
- Versioning yang jelas (semantic versioning) & changelog tiap rilis.
- Setup crash reporting (Firebase Crashlytics atau setara) sejak awal, bukan setelah ada masalah di production.

## Section B — Pembelajaran Dinamis (diisi otomatis oleh @curator)
> Format: `- [YYYY-MM-DD] [Kategori] Deskripsi pelajaran & cara mencegahnya.`

_(Belum ada entry.)_
