## ADDED Requirements

### Requirement: CRUD DUDIKA with Geolocation Data
Sistem HARUS memungkinkan Waka Hubin dan Admin TU mengelola data Dunia Usaha, Dunia Industri, dan Dunia Kerja (DUDIKA) termasuk koordinat GPS untuk validasi geofencing.

#### Scenario: Waka Hubin creates a new DUDIKA record
- **WHEN** Waka Hubin mengirimkan form dengan nama perusahaan, alamat, latitude, longitude, radius, dan penanggung jawab
- **THEN** sistem menyimpan DUDIKA ke tabel `dudika` dengan UUID primary key dan timestamp created_at

#### Scenario: DUDIKA is assigned quota for a major and academic year
- **WHEN** Waka Hubin menginput kuota penerimaan siswa untuk jurusan tertentu pada tahun ajaran tertentu
- **THEN** sistem menyimpan ke tabel `kuota_dudika` dengan constraint compound unique `(dudika_id, jurusan, tahun_ajaran)` untuk mencegah duplikasi alokasi

#### Scenario: Admin TU updates DUDIKA information
- **WHEN** Admin TU mengubah nama perusahaan atau kontak penanggung jawab DUDIKA
- **THEN** sistem memperbarui catatan di tabel `dudika` dan mencatat perubahan ke `audit_logs`

#### Scenario: DUDIKA quota tracking prevents over-ploting
- **WHEN** jumlah siswa yang dipetakan ke suatu DUDIKA (dari `terpakai` di `kuota_dudika`) sama dengan `jumlah_kuota`
- **THEN** sistem menolak ploting siswa tambahan ke DUDIKA tersebut dengan pesan "Kuota telah terpenuhi"

### Requirement: Siswa-DUDIKA-Guru Ploting Management
Sistem HARUS memungkinkan Kaprogli memetakan siswa ke DUDIKA yang disetujui dan menetapkan Guru Pembimbing berdasarkan kompetensi keahlian.

#### Scenario: Kaprogli plots a student to an approved DUDIKA
- **WHEN** Kaprogli memilih siswa, DUDIKA aktif, dan Guru Pembimbing dari dropdown
- **THEN** sistem menyimpan relasi ke tabel `ploting_siswa` dengan status_aktif = true dan tanggal_mulai/selesai

#### Scenario: Kaprogli views ploting by program keahlian
- **WHEN** Kaprogli membuka halaman ploting dengan filter kompetensi keahlian
- **THEN** sistem menampilkan daftar ploting yang terkait dengan program keahlian yang dipilih menggunakan index pada `siswa_id`

#### Scenario: Instruktur DUDIKA is linked during DUDIKA creation
- **WHEN** Waka Hubin membuat DUDIKA dan menautkan akun instruktur (user role INSTRUKTUR_DUDIKA)
- **THEN** sistem menyimpan `instruktur_id` pada entri ploting_siswa terkait DUDIKA tersebut
