# Manajemen Konflik Sinkronisasi Kalender (CoolCare AC)

Dokumen ini mendokumentasikan tata kelola konflik sinkronisasi antara PostgreSQL dan Google Calendar.

---

## 1. Jenis-Jenis Konflik yang Terdeteksi

| Kode Konflik | Deskripsi Masalah | Pemicu Kejadian |
|---|---|---|
| `REMOTE_EVENT_CHANGED` | Waktu atau detail event di Google Calendar diubah di luar sistem CoolCare | Pengguna menggeser event secara manual di aplikasi Google Calendar (ponsel/web) |
| `REMOTE_EVENT_DELETED` | Event Google Calendar yang terhubung dengan pemesanan aktif dihapus | Pengguna menghapus event secara manual di Google Calendar |
| `EXTERNAL_BUSY_OVERLAP` | Ada event sibuk baru di Google Calendar yang menabrak jadwal pemesanan lokal | Admin membuat agenda internal yang bentrok dengan jadwal servis yang sudah terkonfirmasi |

---

## 2. Kebijakan Anti-Drift: Data Lokal Tidak Boleh Ditimpa Otomatis

CoolCare menetapkan aturan integritas data:
> **Perubahan manual di Google Calendar TIDAK PERNAH secara otomatis mengubah atau membatalkan data pemesanan di database PostgreSQL.**

Sebaliknya, sistem:
1. Menangkap anomali tersebut saat sinkronisasi webhook/incremental sync.
2. Mencatatnya ke dalam tabel `CalendarSyncConflict` dengan status `OPEN`.
3. Menyimpan snapshot perbandingan:
   - `localSnapshot`: Waktu jadwal resmi, teknisi, dan status pemesanan lokal.
   - `remoteSnapshot`: Data event Google Calendar yang diterima dari Google API.
4. Menampilkan peringatan visual pada dashboard admin (`/dashboard/integrations/google-calendar/conflicts`).

---

## 3. Alur Resolusi Konflik oleh Admin

Admin atau Owner dapat meninjau konflik dan memilih salah satu dari 3 tindakan resolusi:

1. **Pulihkan Data Lokal (`RESTORE_LOCAL`)** *(Pilihan Utama)*:
   - Menegaskan bahwa jadwal sistem CoolCare adalah acuan mutlak.
   - Sistem otomatis membuat outbox job `UPDATE_EVENT` untuk menimpa kembali Google Calendar agar selaras dengan data lokal.
2. **Terima Perubahan Google (`ACCEPT_REMOTE`)**:
   - Admin menyetujui bahwa perubahan di Google Calendar adalah disengaja.
   - Status konflik ditandai `RESOLVED` dan snapshot remote dicatat ke riwayat.
3. **Abaikan Konflik (`IGNORE`)**:
   - Menandai konflik sebagai diabaikan tanpa mengubah data apa pun.
