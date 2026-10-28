# Booking Reschedule Policy — CoolCare AC Service

Dokumen ini menjelaskan kebijakan dan prosedur teknis penjadwalan ulang (*reschedule*) reservasi servis AC.

---

## 1. Persyaratan Kelayakan Reschedule

Pemesanan memenuhi syarat untuk dijadwalkan ulang jika:
1. Status pemesanan adalah `PENDING`, `CONFIRMED`, atau `ASSIGNED`.
2. Pemesanan yang telah berstatus `COMPLETED`, `CANCELLED`, atau `REJECTED` **tidak dapat dijadwalkan ulang**.
3. Permintaan wajib menyertakan alasan penjadwalan ulang (`reason`, minimal 3 karakter).

---

## 2. Kalkulasi Ulang Okupansi & Penugasan Teknisi

Saat proses penjadwalan ulang dieksekusi:
1. Sistem menghitung durasi servis baru berdasarkan jumlah unit AC yang dipesan:
   - `scheduledStartAt`: Waktu mulai baru
   - `scheduledEndAt`: `scheduledStartAt + estimatedDurationMinutes`
   - `occupancyStartAt`: Sama dengan `scheduledStartAt`
   - `occupancyEndAt`: `scheduledStartAt + totalOccupancyMinutes (durasi + buffer servis + buffer perjalanan)`
2. Slot okupansi teknisi lama dibatalkan (`status = 'CANCELLED'`).
3. Teknisi yang dipilih (baik teknisi lama atau teknisi baru) divalidasi ketersediaannya pada waktu baru tersebut di bawah pengawalan advisory lock.
4. Okupansi baru dibuat berstatus `ACTIVE`.
5. Nilai `rescheduleCount` pada rekaman `Booking` dinaikkan secara inkremental (+1).
6. Jika pemesanan sudah memiliki Surat Perintah Kerja (SPK) aktif, field `scheduledStartAt` dan `scheduledEndAt` pada SPK otomatis diselaraskan (*synchronized*).
7. Audit log mencatat rekaman `RESCHEDULE` dengan detail waktu lama dan waktu baru.
