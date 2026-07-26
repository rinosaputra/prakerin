## ADDED Requirements

### Requirement: Digital Certificate Generation with Cryptographic Hash
Sistem HARUS menghasilkan Sertifikat PKL Digital dengan SHA-256 hash berdasarkan konten dokumen unik, kemudian mengonversinya menjadi gambar QR Code untuk verifikasi publik.

#### Scenario: Admin TU triggers batch certificate generation
- **WHEN** Admin TU memicu penerbitan sertifikat untuk semua siswa yang telah lulus
- **THEN** sistem menghitung SHA-256 hash dari setiap sertifikat unik (nomor_sertifikat + nama_siswa + nilai_akhir), generate QR Code yang menaut ke `https://pkl.smk.sch.id/verify/doc/<document_hash>`, dan merender PDF dengan layout landscape A4 menggunakan @react-pdf/renderer

#### Scenario: Certificate PDF is rendered with digital signature and signature
- **WHEN** sistem generate sertifikat
- **THEN** sertifikat menyertakan Tanda Tangan Elektronik (TTE) Kepala Sekolah sebagai gambar tertanam dan stempel digital

#### Scenario: Certificate metadata is recorded in database
- **WHEN** sertifikat berhasil dirender dan diunggah
- **THEN** sistem menyimpan record ke tabel `sertifikat` dengan kolom `nomor_sertifikat` (unique), `nilai_akhir`, `predikat`, `file_url`, dan `document_hash`

### Requirement: Batch Certificate Processing with Chunking Pattern
Sistem HARUS membagi proses batch sertifikat menjadi chunk terkontrol untuk mencegah Serverless Function Timeout atau Out-Of-Memory.

#### Scenario: Batch of 300 certificates is processed without timeout
- **WHEN** Admin TU memicu sertifikat untuk 300 siswa sekaligus
- **THEN** sistem membagi menjadi chunk 10 sertifikat per batch, menjalankan `Promise.all` paralel dalam batch, dan menyimpannya secara incremental

#### Scenario: Fluid Compute is enabled with maxDuration 300s
- **WHEN** route handler sertifikat dipanggil untuk batch processing
- **THEN** sistem menggunakan `export const maxDuration = 300` dan `export const dynamic = 'force-dynamic'` untuk extend execution limit hingga 5 menit

### Requirement: Public Document Verification Endpoint
Sistem HARUS menyediakan halaman verifikasi publik yang memungkinkan pihak ketiga memvalidasi keabsahan sertifikat melalui QR Code.

#### Scenario: User verifies certificate via public URL
- **WHEN** user mengakses `https://pkl.smk.sch.id/verify/doc/<document_hash>`
- **THEN** sistem menampilkan informasi sertifikat (nama siswa, NISN, nama DUDIKA, nilai akhir, predikat, tanggal diterbit) jika hash sesuai dengan record di tabel `sertifikat`

#### Scenario: User attempts to verify non-existent certificate
- **WHEN** user mengakses URL verifikasi dengan hash yang tidak ditemukan
- **THEN** sistem menampilkan "Dokumen tidak ditemukan atau tidak valid"