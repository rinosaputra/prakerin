## ADDED Requirements

### Requirement: Student Daily Journal Entry
Sistem HARUS memungkinkan siswa mencatat aktivitas harian PKL melalui form jurnal yang mencakup deskripsi pekerjaan dan foto kegiatan.

#### Scenario: Student creates a daily journal entry
- **WHEN** siswa mengirimkan form jurnal dengan deskripsi_pekerjaan dan foto_kegiatan
- **THEN** sistem menyimpan ke tabel `jurnal_harian` dengan `is_verified_guru = false` dan `is_verified_instruktur = false`

#### Scenario: Student uploads activity photo to Vercel Blob
- **WHEN** siswa mengunggah foto kegiatan sebagai bagian dari jurnal
- **THEN** Sistem mengunggah foto ke Vercel Blob dan menyimpan URL-nya ke `foto_kegiatan_url`

#### Scenario: Student edits journal before either verification
- **WHEN** siswa memperbarui jurnal pada hari yang sama dimana kedua verifikasi masih `false`
- **THEN** sistem memperbarui record jurnal yang ada

### Requirement: Two-Stage Journal Verification
Sistem HARUS mewajibkan verifikasi jurnal oleh Guru Pembimbing dan Instruktur DUDIKA sebelum dianggap final.

#### Scenario: Guru Pembimbing verifies student journal
- **WHEN** Guru Pembimbing menekan tombol "Verifikasi" pada jurnal siswa bimbingannya
- **THEN** sistem memperbarui `is_verified_guru = true` dan merekam aksi ke `audit_logs`

#### Scenario: Instruktur DUDIKA verifies student journal
- **WHEN** Instruktur DUDIKA menekan tombol "Verifikasi" pada jurnal siswa di DUDIKA-nya
- **THEN** sistem memperbarui `is_verified_instruktur = true` dan merekam aksi ke `audit_logs`

#### Scenario: Guru Pembimbing adds revision notes to journal
- **WHEN** Guru Pembimbing menambahkan catatan revisi ketika menolak jurnal
- **THEN** sistem menyimpan catatan ke `catatan_revisi` dan siswa dapat melihat serta memperbarui jurnal

#### Scenario: Journal is shown in chronological order
- **WHEN** Guru Pembimbing membuka halaman verifikasi jurnal untuk siswa tertentu
- **THEN** sistem menampilkan jurnal diurutkan berdasarkan `(ploting_id, tanggal)` menggunakan compound index
