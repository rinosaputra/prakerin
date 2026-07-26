## ADDED Requirements

### Requirement: DUDIKA Performance Evaluation
Sistem HARUS memungkinkan Instruktur DUDIKA menilai kinerja siswa melalui input nilai soft skills dan hard skills saat mengakses form evaluasi via Magic Link.

#### Scenario: Instruktur submits evaluation with skill scores
- **WHEN** Instruktur DUDIKA mengisi form evaluasi dengan `nilai_soft_skill` dan `nilai_hard_skill` untuk ploting siswa tertentu
- **THEN** sistem menyimpan ke tabel `evaluasi_dudika` dengan timestamp `evaluated_at` dan mencatat aksi ke `audit_logs`

#### Scenario: Instruktur sees existing evaluation data
- **WHEN** Instruktur DUDIKA membuka halaman evaluasi pada session yang sama
- **THEN** sistem menampilkan nilai yang sudah diinput sebelumnya sebagai data awal form

#### Scenario: Evaluation is only allowed once per student-ploting
- **WHEN** Instruktur DUDIKA mencoba mengirim evaluasi untuk ploting_id yang sudah memiliki evaluasi terdaftar
- **THEN** sistem menolak duplikasi berdasarkan unique constraint pada `ploting_id` di tabel `evaluasi_dudika`

### Requirement: Certificate Issuance Prerequisites
Sertifikat PKL hanya dapat diterbitkan setelah semua syarat terpenuhi: nilai DUDIKA lengkap, minimal presensi 90%, dan jurnal diverifikasi.

#### Scenario: System allows certificate generation when all requirements are met
- **WHEN** siswa memiliki nilai evaluasi (soft + hard), kehadiran >= 90%, dan seluruh jurnal has verified_guru AND verified_instruktur = true
- **THEN** sistem mengizinkan Admin TU memicu penerbitan sertifikat

#### Scenario: System prevents certificate generation if requirements are not met
- **WHEN** siswa belum memenuhi minimal salah satu syarat (nilai, presensi, jurnal)
- **THEN** sistem menampilkan peringatan "Persyaratan sertifikat belum terpenuhi" dan mencegah penerbitan
