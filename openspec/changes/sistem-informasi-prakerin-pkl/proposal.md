# Proposal: Sistem Informasi Prakerin/PKL SMK Berbasis Vercel & Next.js

## Why

Sekolah Menengah Kejuruan (SMK) membutuhkan sistem digital terintegrasi untuk mengelola Praktik Kerja Lapangan (PKL/Prakerin) — dari persiapan H-60 hingga penerbitan sertifikat pasca-PKL. Saat ini, proses pengelolaan PKL secara manual menyebabkan ketidakefisienan, kurangnya transparansi, dan sulitnya verifikasi keabsahan dokumen. Sistem ini akan mengotomatisasi seluruh alur operasional dengan memanfaatkan ekosistem Vercel (Serverless, Edge, Blob, KV, Cron, Postgres) dan Next.js untuk performa tinggi dan skalabilitas native cloud.

## What Changes

- **Sistem Otentikasi Multi-Role**: Implementasi 6 peran (ADMIN_TU, WAKA_HUBIN, KAPROGLI, GURU_PEMBIMBING, SISWA, INSTRUKTUR_DUDIKA) dengan RBAC berbasis JWT di Next.js Middleware.
- **Frictionless Authentication Instruktur DUDIKA**: Magic Link One-Time Token via Vercel KV (Upstash Redis) dengan TTL 72 jam, rate limiting 5x/menit, dan single-use invalidation untuk akses form evaluasi tanpa password.
- **Manajemen Master Data DUDIKA**: CRUD untuk DUDIKA (geolokasi + geofencing radius), Kuota per Jurusan, dan Ploting Siswa-Guru-Dudika.
- **Presensi GPS Geofencing**: Server Action dengan validasi Haversine Formula, upload foto selfie ke Vercel Blob, dan penyimpanan ke Vercel Postgres.
- **Jurnal Harian Digital**: Entri aktivitas harian siswa dengan verifikasi dua tahap (Guru Pembimbing & Instruktur DUDIKA).
- **Monitoring Kunjungan & Kasus**: Pencatatan laporan kunjungan guru pembimbing dan insiden/kasus siswa.
- **Evaluasi Kinerja Instruktur**: Form penilaian hard skills & soft skills dengan alur autentikasi frictionless.
- **Otomatisasi Dokumen PDF**: Pipeline render server-side menggunakan @react-pdf/renderer untuk Surat Permohonan, MoU, SK, Surat Tugas, dan Sertifikat Digital + QR Code verifikasi.
- **Penerbitan Sertifikat Digital**: Generasi massal batch certificate dengan cryptographic hash SHA-256, signed URL via Vercel Blob, dan halaman verifikasi publik.
- **Vercel Cron Automation**: Pengingat presensi harian (17:00 WIB / 10:00 UTC) dan rekap bulanan dengan Bearer token authentication.
- **Audit Trail Imutabel**: Catatan semua tindakan sensitif ke tabel audit_logs.

## Capabilities

### New Capabilities

- `auth-rbac`: Otentikasi multi-role dengan JWT Middleware dan Frictionless Magic Link untuk Instruktur DUDIKA
- `dudika-management`: Manajemen master DUDIKA, kuota, dan ploting siswa
- `attendance-geofencing`: Presensi GPS dengan validasi Haversine dan upload foto ke Vercel Blob
- `daily-journal`: Jurnal harian siswa dengan verifikasi dua tahap
- `monitoring-visits`: Laporan kunjungan guru pembimbing dan pencatatan kasus siswa
- `dudika-evaluation`: Penilaian kinerja siswa oleh instruktur DUDIKA via magic link
- `document-automation`: Generator PDF server-side untuk surat, MoU, SK, dan sertifikat
- `certificate-generation`: Penerbitan sertifikat digital massal dengan QR code verifikasi
- `cron-automation`: Penjadwalan otomatis untuk pengingat presensi dan rekap bulanan
- `audit-trail`: Pencatatan audit log imutabel untuk semua aksi sensitif

### Modified Capabilities

<!-- None yet — no existing specs in this repo -->

## Impact

- **Codebase**: Inisialisasi proyek Next.js 15+ App Router dari nol
- **Dependencies Baru**: `drizzle-orm`, `@vercel/postgres`, `@vercel/blob`, `@upstash/redis` (Vercel KV), `@react-pdf/renderer`, `jose` (JWT), `qrcode`, `@vercel/functions` (cron)
- **Infrastructure**: Vercel Postgres (Neon), Vercel Blob, Vercel KV (Upstash Redis), Vercel Cron, Fluid Compute untuk batch PDF
- **Security**: JWT secret, CRON_SECRET, rate limiting, SSL/TLS database, signed private URLs
- **APIs**: Next.js Middleware (RBAC), Server Actions (presensi, generate PDF), API Routes (/api/cron/*, /api/auth/magic-link), Edge Functions (geofencing)
- **Database**: 10+ tabel relasional PostgreSQL dengan UUID primary keys, compound indexes, dan foreign key constraints
