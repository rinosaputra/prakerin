# Design: Sistem Informasi Prakerin/PKL SMK

## Context

SMK menjalankan program Praktik Kerja Lapangan (PKL) tahunan yang mengelola 100-300+ siswa, 30-50 DUDIKA, dan 6 peran pengguna. Operasional PKL mengikuti siklus 3 fase (pra-pelaksanaan H-60, pelaksanaan H-90, pasca-pelaksanaan H+14) dengan dokumen MoU, SK, dan Sertifikat yang harus memenuhi format legal. Saat ini proses masih manual, rentan duplikasi data, dan sulit diaudit.

**Stakeholder**: Admin TU, Waka Hubin, Kaprogli, Guru Pembimbing, Siswa, Instruktur DUDIKA.

**Constraints**: Infrastruktur serverless native Vercel, latency PDF < 1 detik, batch processing 300 sertifikat tanpa timeout, auth DUDIKA frictionless (no password).

## Goals / Non-Goals

**Goals:**
- Single Platform Vercel: Postgres, Blob, KV, Cron, Fluid Compute
- Auto-generate dokumen PDF legal (MoU, SK, Sertifikat) dengan QR verifikasi
- Frictionless auth untuk DUDIKA via Magic Link WhatsApp/Email
- Presensi GPS tervalidasi geofencing Haversine
- Audit trail imutabel untuk compliance

**Non-Goals:**
- Native mobile app (mobile-first PWA via Next.js)
- Integrasi dengan sistem akademik eksternal di fase ini
- TTE resmi BSSN/Peruri (hanya stempel digital + QR verifikasi)
- Multi-tenant multi-sekolah (single-instance per SMK)

## Decisions

### D1: Database — Vercel Postgres (Neon) + Drizzle ORM
**Why**: Integrasi native Vercel, connection pooling otomatis, type-safe query builder.
**Alternatives**: Prisma (overhead lebih besar), raw SQL (kehilangan type-safety).
**Trade-off**: Lock-in ringan terhadap Drizzle migrations; fleksibilitas query lebih rendah dari Prisma.

### D2: PDF Rendering — @react-pdf/renderer (bukan Puppeteer)
**Why**: Bundle 2MB, cold start rendah, generation 100-500ms, render di Serverless function.
**Alternatives**: Puppeteer+Chromium (50-100MB, cold start 1.5-4s), microservice Docker (overhead infra).
**Trade-off**: Styling terbatas (JSX Style), tidak support full CSS/Tailwind.

### D3: Frictionless Auth — Vercel KV Magic Link
**Why**: Token TTL 72 jam otomatis, single-use invalidation, rate limiting native.
**Alternatives**: JWT saja (no revocation), session DB (latency lebih tinggi).
**Key**: `token:dudika:<token_hash>` di Upstash Redis, `crypto.randomBytes(32).toString('hex')`.

### D4: File Storage — Vercel Blob
**Why**: CDN Edge terintegrasi, signed private URLs untuk dokumen sensitif.
**Use**: Foto selfie presensi, PDF MoU/SK/Sertifikat, scan laporan akhir.

### D5: Batch Processing — Chunking 10/batch + maxDuration 300s
**Why**: Hindari OOM (300 sertifikat sekaligus = ~3GB RAM), extend Fluid Compute timeout.
**Pattern**: `for (let i = 0; i < ids.length; i += 10) { Promise.all(batch) }`

### D6: Middleware RBAC — JWT verify dalam Edge
**Why**: Blokir unauthorized request sebelum mencapai page/API handler.
**Pattern**: `jose.jwtVerify` di middleware, ROLE_PATTERNS regex per role.

### D7: Geofencing — Haversine di Server Action
**Why**: Akurasi ~0.5% untuk jarak bumi, kalkulasi server-side (no client bypass).
**Alternative**: PostGIS (overkill, dependency tambahan).

### D8: Audit Trail — Append-only table
**Why**: Compliance, troubleshooting, accountability untuk modifikasi data.
**Schema**: `audit_logs` dengan `payloadBefore`/`payloadAfter` JSON.

## Risks / Trade-offs

1. **R1: Serverless Timeout untuk batch 300 sertifikat** → Mitigation: chunking 10/batch + maxDuration 300s + Fluid Compute + retry pattern
2. **R2: Vercel KV cost scale-up** → Mitigation: TTL otomatis 72 jam, monitor dashboard, gunakan rate limiting hanya di endpoints kritis
3. **R3: PDF font rendering di serverless** → Mitigation: gunakan Helvetica (built-in), embed custom font hanya untuk TTE/stempel
4. **R4: GPS spoofing oleh siswa** → Mitigation: deteksi mock location via `navigator.geolocation.getCurrentPosition({enableHighAccuracy: true})` + flag isWithinRadius untuk audit
5. **R5: Magic Link leakage via WhatsApp/Email** → Mitigation: TLS-only channel, short TTL, single-use, ID-hidden token (hash only)
6. **R6: Cron timezone drift (UTC)** → Mitigation: konversi 17:00 WIB → 10:00 UTC, dokumentasikan eksplisit di vercel.json

## Migration Plan

Tidak ada migrasi data (inisasi greenfield). Deployment path:
1. Tahap 1: Setup Next.js + Drizzle + first user (Admin TU)
2. Tahap 2: Tambah Waka Hubin, Kaprogli, Guru, Siswa
3. Tahap 3: Magic Link untuk DUDIKA
4. Tahap 4: Bulk certificate generation
5. Tahap 5: Production hardening + load test

**Rollback**: Hapus Vercel deployment, hapus project Cloud. Setiap cron diisolasi per route.

## Open Questions

- Q1: Apakah TTE Kepala Sekolah menggunakan gambar statis (stempel.png) atau signature pad digital? Default: gambar statis.
- Q2: Channel delivery WhatsApp: WhatsApp Business API official atau gateway gratis (Fonnte/Wablas)? Default: gunakan abstraction `lib/notify/whatsapp.ts` untuk swap.
- Q3: Batas maksimal siswa per DUDIKA per tahun ajaran? Default: 10 (configurable per kuota).
- Q4: Apakah perlu push notification mobile atau cukup WhatsApp? Default: WhatsApp only di awal.
