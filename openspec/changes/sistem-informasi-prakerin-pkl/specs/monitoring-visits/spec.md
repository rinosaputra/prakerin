## ADDED Requirements

### Requirement: Guru Pembimbing Visit Reports
Sistem HARUS memungkinkan Guru Pembimbing mencatat laporan kunjungan berkala ke DUDIKA selama proses PKL berlangsung.

#### Scenario: Guru Pembimbing creates a visit report
- **WHEN** Guru Pembimbing mengirimkan form dengan tanggal kunjungan, catatan kunjungan, dan observasi kinerja siswa
- **THEN** sistem menyimpan ke tabel `kunjungan_monitoring` terkait ploting siswa yang dibimbing

#### Scenario: Kaprogli views all visit reports by program keahlian
- **WHEN** Kaprogli membuka halaman monitoring kunjungan
- **THEN** sistem menampilkan daftar kunjungan untuk semua guru di program keahlian tersebut menggunakan index pada `target_entity` dan `target_id`

### Requirement: Student Incident/Case Logging
Sistem HARUS memungkinkan Guru Pembimbing mencatat insiden atau kasus siswa selama PKL berlangsung.

#### Scenario: Guru Pembimbing logs a student case
- **WHEN** Guru Pembimbing mengirimkan laporan kasus siswa dengan deskripsi masalah dan tindakan yang diambil
- **THEN** sistem menyimpan ke tabel `kasus_siswa` terkait ploting siswa yang bersangkutan

#### Scenario: Multiple cases can be logged per student
- **WHEN** Guru Pembimbing mencatat kasus baru untuk siswa yang memiliki kasus sebelumnya
- **THEN** sistem menyimpan sebagai record terpisah di tabel `kasus_siswa` dengan masing-masing UUID unik
