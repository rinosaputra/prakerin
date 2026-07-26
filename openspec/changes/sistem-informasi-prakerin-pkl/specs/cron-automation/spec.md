## ADDED Requirements

### Requirement: Scheduled Cron Tasks via Vercel Cron
Sistem HARUS mengotomatiskan tugas terjadwal menggunakan Vercel Cron yang dikonfigurasikan melalui `vercel.json` dengan standar zona waktu UTC.

#### Scenario: Daily attendance reminder triggers on weekdays
- **WHEN** waktu server mencapai 10:00 UTC (08:00 WIB) pada hari Senin-Jumat (schedule `0 10 * * 1-5`)
- **THEN** sistem mengeksekusi route handler `/api/cron/reminder-presensi` untuk mengidentifikasi siswa yang belum mengirim presensi hari ini

#### Scenario: Monthly recap triggers on first of every month
- **WHEN** waktu server mencapai 01:00 UTC tanggal 1 setiap bulan (schedule `0 1 1 * *`)
- **THEN** sistem mengeksekusi route handler `/api/cron/rekap-bulanan` untuk menghasilkan rekapitulasi jurnal dan presensi bulan sebelumnya

#### Scenario: Cron secret protects against unauthorized execution
- **WHEN** route handler cron menerima permintaan GET dari luar Vercel (bukan scheduled execution)
- **THEN** sistem memvalidasi header `Authorization: Bearer <CRON_SECRET>` dan menolak dengan status HTTP 401 jika token tidak cocok

### Requirement: Automatic Token Cleanup
Sistem HARUS membersihkan token Magic Link DUDIKA yang sudah kadaluarsa secara berkala.

#### Scenario: Expired KV tokens are purged on schedule
- **WHEN** cron job pembersihan token berjalan
- **THEN** sistem menghapus semua key `token:dudika:*` di Vercel KV yang sudah melewati TTL 72 jam
