## ADDED Requirements

### Requirement: Server-Side PDF Document Generation Pipeline
Sistem HARUS mengotomatisasi pembuatan dokumen resmi (Surat Permohonan, MoU, SK Kepala Sekolah, Surat Tugas) sepenuhnya di sisi server menggunakan @react-pdf/renderer pada Vercel Serverless Functions.

#### Scenario: Admin TU generates a formal request letter PDF
- **WHEN** Admin TU mengisi form pembuatan surat permohonan PKL ke DUDIKA tertentu
- **THEN** sistem mengambil data template, menyisipkan nomor surat otomatis dari tabel `surats`, generate PDF dengan @react-pdf/renderer, dan menyimpan URL ke `surats.file_url` via Vercel Blob

#### Scenario: Auto-generated surat nomor increments sequentially
- **WHEN** Admin TU meminta nomor surat baru
- **THEN** sistem menghasilkan nomor surat unik berdasarkan counter yang tersimpan di `surats.nomor_surat` dengan unique constraint

#### Scenario: Generated PDF includes dynamic variables
- **WHEN** sistem merender PDF untuk surat apa pun
- **THEN** semua variabel dinamis (Nama Siswa, NISN, Nama DUDIKA, Rincian Nilai, Stempel Digital) langsung diinjeksi ke dalam pohon komponen React PDF

#### Scenario: Generated PDF is stored in Vercel Blob with permanent public URL
- **WHEN** stream buffer PDF selesai di-render
- **THEN** sistem mengalirkan buffer ke Vercel Blob menggunakan `@vercel/blob` SDK dan menyimpan URL publik permanen ke kolom `file_url` pada tabel terkait

### Requirement: Document Status Tracking
Sistem HARUS melacak status setiap dokumen resmi dari draft hingga terbit.

#### Scenario: Document transitions through defined statuses
- **WHEN** Admin TU membuat MoU baru
- **THEN** status dimulai sebagai `DRAFT`, berpindah ke `PENDING_APPROVAL`, `APPROVED`, dan akhirnya `ISSUED` setelah PDF tergenerasi

#### Scenario: Rejected documents return to draft
- **WHEN** Waka Hubin menolakMoU pada status `APPROVED`
- **THEN** status kembali ke `DRAFT` dan Admin TU dapat memperbarui konten
