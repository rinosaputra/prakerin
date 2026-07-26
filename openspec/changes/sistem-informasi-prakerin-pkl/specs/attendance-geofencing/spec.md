## ADDED Requirements

### Requirement: GPS Attendance with Geofencing Validation
Sistem HARUS memvalidasi presensi harian siswa menggunakan koordinat GPS perangkat dan algoritma Haversine Formula untuk memastikan siswa berada dalam radius DUDIKA.

#### Scenario: Student checks in within DUDIKA radius
- **WHEN** siswa mengirim FormData dengan ploting_id, latitude, longitude, dan foto selfie melalui Server Action
- **THEN** sistem menghitung jarak Haversine, mengonfirmasi `is_within_radius = true`, menyimpan foto ke Vercel Blob URL di tabel `presensi` dengan status `HADIR`

#### Scenario: Student checks in outside DUDIKA radius
- **WHEN** siswa mengirim data presensi dengan koordinat yang menghasilkan jarak > `radius_meter` dari DUDIKA
- **THEN** sistem mencatat `is_within_radius = false` di tabel `presensi` dengan catatan "Di luar radius: <jarak>m" dan status tetap `HADIR` (untuk review guru)

#### Scenario: Duplicate daily attendance is prevented
- **WHEN** siswa mencoba melakukan check-in pada tanggal yang sama yang sudah ada rekatannya di tabel `presensi`
- **THEN** sistem menolak duplikasi berdasarkan compound unique index `(ploting_id, tanggal)`

#### Scenario: Student updates checkout time on the same day
- **WHEN** siswa mengirim waktu keluar pada hari yang sama setelah check-in masuk
- **THEN** sistem memperbarui kolom `waktu_keluar` pada record presensi yang ada tanpa membuat record baru

#### Scenario: Attendance photo is uploaded to Vercel Blob
- **WHEN** siswa mengunggah foto selfie pada saat check-in
- **THEN** Sistem mengunggah foto ke `presensi/<ploting_id>/<tanggal>.jpg` di Vercel Blob dengan akses publik dan menyimpan URL-nya ke `foto_masuk_url`

### Requirement: Attendance Status Categories
Sistem HARUS mendukung empat kategori status presensi: HADIR, IZIN, SAKIT, ALPHA.

#### Scenario: Student marks IZIN (permission) for absence
- **WHEN** siswa memilih status `IZIN` pada form presensi harian
- **THEN** sistem mencatat presensi tanpa requiring GPS atau foto ke tabel `presensi`

#### Scenario: Student marks SAKIT (sick leave) for absence
- **WHEN** siswa memilih status `SAKIT` pada form presensi harian
- **THEN** sistem mencatat presensi dengan status `SAKIT` tanpa requiring GPS atau foto
