# Tasks: Sistem Informasi Prakerin/PKL SMK Berbasis Vercel & Next.js

## 1. Project Initialization & Infrastructure Setup

- [x] 1.1 Initialize Next.js 15+ project with App Router, TypeScript, and Tailwind CSS
- [x] 1.2 Install dependencies: drizzle-orm, @vercel/postgres, @vercel/blob, @upstash/redis, @react-pdf/renderer, jose, qrcode, drizzle-kit (dev)
- [x] 1.3 Configure environment variables (.env.local): DATABASE_URL, BLOB_READ_WRITE_TOKEN, KV_REST_API_URL, KV_REST_API_TOKEN, JWT_SECRET, CRON_SECRET
- [ ] 1.4 Create Drizzle config (drizzle.config.ts) for schema migrations
- [ ] 1.5 Initialize lib/db/index.ts with database connection using @vercel/postgres + drizzle-orm
- [ ] 1.6 Create src/lib/schema.ts with all 10 table definitions (users, dudika, kuota_dudika, ploting_siswa, presensi, jurnal_harian, surats, evaluasi_dudika, sertifikat, audit_logs) and enum types
- [ ] 1.7 Run `drizzle-kit generate` and `drizzle-kit push` to apply initial schema migration to Vercel Postgres
- [ ] 1.8 Verify database tables exist with correct indexes, unique constraints, and foreign key relationships

## 2. Authentication & RBAC Core

- [ ] 2.1 Create src/app/(auth)/login/page.tsx with email/password login form
- [ ] 2.2 Implement src/app/(auth)/login/route.ts Server Action: validate credentials against users table, verify password with bcrypt, issue JWT session cookie via jose
- [ ] 2.3 Implement middleware src/middleware.ts with role-based route protection using ROLE_PATTERNS regex per user role
- [ ] 2.4 Create src/lib/auth/session.ts utility: createSession(userId, role), getSession(token), deleteSession()
- [ ] 2.5 Seed initial admin TU user into database (seed.ts) with bcrypt-hashed password
- [ ] 2.6 Add role dropdown in login page and RBAC table component (src/components/RBACGuard.tsx)
- [ ] 2.7 Test all 6 roles can access and are blocked from appropriate routes
- [ ] 2.8 Verify unauthorized access returns 302 redirect to /unauthorized

## 3. Frictionless Magic Link Auth for Instruktur DUDIKA

- [ ] 3.1 Create src/lib/auth/magic-link.ts: generateMagicToken(dudikaId, plotingId) using crypto.randomBytes(32).toString('hex')
- [ ] 3.2 Create src/lib/auth/kv-client.ts: store magic link token in Vercel KV with TTL 72 hours (key format: `token:dudika:<hash>`)
- [ ] 3.3 Create src/app/dudika/evaluasi/route.ts API handler: verify magic link token from query param against Vercel KV
- [ ] 3.4 Implement token validation flow: check existence → check TTL → check rate limit (max 5 attempts/min)
- [ ] 3.5 On valid token: generate ephemeral JWT session cookie with max-age 24 hours, set rate-limit header in response
- [ ] 3.6 Implement single-use invalidation: after evaluation submission, delete token from KV store
- [ ] 3.7 Handle expired/invalid token: display rejection page with explanation message
- [ ] 3.8 Create rate limiting utility (src/lib/rate-limit.ts) using Upstash Redis RedisRateLimit or simple in-memory approach for now
- [ ] 3.9 Seed test instruktur DUDIKA accounts with generated tokens for manual testing

## 4. DUDIKA Master Data Management

- [ ] 4.1 Create src/app/dashboard/hubin/dudika/page.tsx DUDIKA list page with data table (TanStack Table or custom)
- [ ] 4.2 Create DUDIKA form component src/components/dudika/DudikaForm.tsx with fields: nama_perusahaan, alamat, latitude, longitude, radius_meter, nama_penanggung_jawab, contact_person_phone, is_active
- [ ] 4.3 Implement Server Actions src/app/actions/dudika.ts: createDudika(), updateDudika(id, data), deleteDudika(id)
- [ ] 4.4 Create DUDIKA detail view page src/app/dashboard/hubin/dudika/[id]/page.tsx showing associated quota and ploted students
- [ ] 4.5 Implement KuotaManagement section: create quota entry form (dudika_id, jurusan, tahun_ajaran, jumlah_kuota)
- [ ] 4.6 Implement auto-update logic: when student is plotted to a DUDIKA, increment kuota_dudika.terpakai
- [ ] 4.7 Prevent over-plotting: if terpakai >= jumlah_kuota, show error "Kuota telah terpenuhi"
- [ ] 4.8 Implement RBAC guard: only ADMIN_TU can Read, WAKA_HUBIN can CRUD

## 5. Siswa Ploting Management

- [ ] 5.1 Create src/app/dashboard/kaprogli/ploting/page.tsx ploting management page with filters
- [ ] 5.2 Create ploting form src/components/ploting/PlotingForm.tsx: select siswa, dudika, guru_pembimbing, tanggal_mulai/selesai
- [ ] 5.3 Implement Server Actions src/app/actions/ploting.ts: plotSiswa(), unplotSiswa(), reassignGuru(plotingId, guruId)
- [ ] 5.4 Implement status toggle: set status_aktif = true/false to activate/deactivate ploting without deleting record
- [ ] 5.5 Create ploting summary view: list all active/inactive plots with filters by jurusan, kelas, program_keahlian
- [ ] 5.6 Populate dropdown options: getStudentsByJurusan(), getActiveDudika(), getGurusByKompetensi() helper functions
- [ ] 5.7 Implement audit logging for each plot/unplot action via recordAuditTrail() utility

## 6. Attendance GPS Geofencing

- [ ] 6.1 Create attendance Server Action src/app/actions/presensi.ts: submitAttendance(formData)
- [ ] 6.2 Implement Haversine distance calculation function calculateHaversineDistance(lat1, lon1, lat2, lon2): number
- [ ] 6.3 Implement duplicate prevention: query presensi for `(plotingId, tanggal)` compound unique before insert
- [ ] 6.4 Implement photo upload to Vercel Blob: call put(`presensi/${plotingId}/${tanggal}.jpg`, imageFile)
- [ ] 6.5 Create src/app/dashboard/siswa/presensi/page.tsx attendance page with geolocation input form
- [ ] 6.6 Implement browser geolocation API integration: navigator.geolocation.getCurrentPosition({enableHighAccuracy: true})
- [ ] 6.7 Implement file input for selfie photo upload with preview and compression check (< 5MB)
- [ ] 6.8 Display real-time validation result: within/outside radius with meters distance shown
- [ ] 6.9 Implement checkout: update waktu_keluar on same-day existing record
- [ ] 6.10 Support non-attendance statuses: IZIN and SAKIT that skip GPS/photo validation
- [ ] 6.11 Implement attendance history table: show last 30 days attendance records per student

## 7. Daily Journal System

- [ ] 7.1 Create journal page src/app/dashboard/siswa/jurnal/page.tsx with daily entry form and list
- [ ] 7.2 Implement journal entry form with textarea for deskripsi_pekerjaan and file input for foto_kegiatan
- [ ] 7.3 Implement Server Action src/app/actions/jurnal.ts: createJurnal(), updateJurnal(), deleteJurnal()
- [ ] 7.4 Upload foto to Vercel Blob on journal creation/update: put(`jurnal/${siswaId}/${tanggal}.jpg`)
- [ ] 7.5 Create verification page src/app/dashboard/guru/jurnal/page.tsx for Guru Pembimbing
- [ ] 7.6 Implement guru verification: set is_verified_guru = true
- [ ] 7.7 Implement instructor verification route in dashboard DUDIKA: set is_verified_instruktur = true
- [ ] 7.8 Add catatan_revisi field in journal edit modal for revision feedback
- [ ] 7.9 Display chronological journal list sorted by (ploting_id, tanggal ASC)
- [ ] 7.10 Show verification badges/icons next to verified vs unverified entries
- [ ] 7.11 Implement journal summary: count total journals per student per month

## 8. Monitoring Visits & Student Cases

- [ ] 8.1 Create visit report form src/app/dashboard/guru/kunjungan/page.tsx
- [ ] 8.2 Implement Server Action src/app/actions/kunjungan.ts: createVisit() storing ke tabel kunjungan_monitoring
- [ ] 8.3 Implement visit list view: all visits for a ploting with date filters
- [ ] 8.4 Create case logging form src/app/dashboard/guru/kasus/page.tsx
- [ ] 8.5 Implement Server Action src/app/actions/kasus.ts: createCase() storing ke tabel kasus_siswa
- [ ] 8.6 Create case log viewer with severity classification (ringan, sedang, berat)
- [ ] 8.7 Allow Kaprogli to view all visits and cases filtered by program keahlian

## 9. DUDIKA Evaluation System

- [ ] 9.1 Create evaluation form page src/app/dudika/evaluasi/page.tsx
- [ ] 9.2 Implement evaluation form: number inputs for nilai_soft_skill (0-100) and nilai_hard_skill (0-100)
- [ ] 9.3 Include catatan_performa textarea for performance notes
- [ ] 9.4 Calculate nilai_akhir = (soft_skill * 0.4) + (hard_skill * 0.6)
- [ ] 9.5 Assign predikat based on nilai_akhir: A (>85), B (70-85), C (<70)
- [ ] 9.6 Implement Server Action src/app/actions/evaluasi.ts: submitEvaluation(form)
- [ ] 9.7 Ensure unique constraint on ploting_id to prevent duplicate evaluations
- [ ] 9.8 After evaluation submission, trigger token invalidation in KV
- [ ] 9.9 Log evaluation submission to audit_logs via recordAuditTrail()

## 10. Document Automation Pipeline

- [ ] 10.1 Create document types enum and status workflow constants (DRAFT → PENDING_APPROVAL → APPROVED → REJECTED → ISSUED)
- [ ] 10.2 Implement getSuratNomor() utility: auto-increment nomor_surat from surats table with locking
- [ ] 10.3 Create surat form pages: src/app/dashboard/tu/surat-permohonan/page.tsx and src/app/dashboard/tu/mou/page.tsx
- [ ] 10.4 Implement Server Action src/app/actions/surat.ts: generateSurat() calling createSuratPdf()
- [ ] 10.5 Create src/lib/pdf/base-document.tsx: reusable @react-pdf/renderer template base with styles (header, body, signature, footer)
- [ ] 10.6 Implement Surat Permohonan PDF template: header sekolah, nomor surat, tujuan, isi, penutup, tanda tangan
- [ ] 10.7 Implement MoU PDF template: dua kolom penanda tangan (sekolah + DUDIKA), stipulasi, durasi
- [ ] 10.8 Implement SK Header PDF template: SK penetapan PKL dengan lampiran daftar ploting siswa
- [ ] 10.9 Implement Surat Tugas PDF template: Surat tugas resmi untuk Guru Pembimbing
- [ ] 10.10 Create QR Code generation function src/lib/utils/qr-code.ts: generateQRCode(documentHash: string): Buffer
- [ ] 10.11 Integrate SHA-256 hash calculation into document payload: const hash = createHash('sha256').update(content + nomorSurat).digest('hex')
- [ ] 10.12 Upload PDF to Vercel Blob: put(`surat/<nomor>.pdf`, pdfBuffer, { access: 'public' })
- [ ] 10.13 Store file_url and document_hash in surats table after successful Blob upload
- [ ] 10.14 Display generated document list in dashboard with download links
- [ ] 10.15 Implement document approval workflow UI: approve/reject buttons for Waka Hubin on MOU documents

## 11. Certificate Generation System

- [ ] 11.1 Create src/lib/pdf/certificate-generator.tsx: SertifikatDocument React-PDF component with landscape A4 layout
- [ ] 11.2 Define CertificateData interface: namaSiswa, nisn, dudikaNama, nilaiAkhir, predikat, documentHash, issuedAt
- [ ] 11.3 Implement generateCertificatePdf(data) returning Vercel Blob URL
- [ ] 11.4 Calculate nilai_akhir and predikat from evaluasi_dudika values before rendering
- [ ] 11.5 Generate document hash: SHA-256 of (nomorSertifikat + namaSiswa + nilaiAkhir + date)
- [ ] 11.6 Create unique nomor_sertifikat format: PKL-YYYYMMDD-NNNN where NNNN is sequential counter
- [ ] 11.7 Embed QR code image into certificate using @react-pdf/renderer Image component
- [ ] 11.8 Implement bulk processCertificates(plotingIds[]) with chunking pattern (chunk size 10)
- [ ] 11.9 Set maxDuration = 300 and dynamic = 'force-dynamic' on route handler
- [ ] 11.10 Create src/app/api/cron/generate-certificates/route.ts server endpoint
- [ ] 11.11 Handle chunking loop with error isolation: each chunk retries independently
- [ ] 11.12 Record each certificate in sertifikat table with file_url, document_hash, nilai_akhir, predikat
- [ ] 11.13 Create public verification page src/app/verify/doc/[hash]/page.tsx displaying certificate info
- [ ] 11.14 Handle "certificate not found" gracefully on verification page
- [ ] 11.15 Test batch generation with 300 certificates locally to confirm no timeout/OOM

## 12. Vercel Cron Automation

- [ ] 12.1 Create vercel.json with cron configurations (0 10 * * 1-5 for reminder, 0 1 1 * * for monthly recap)
- [ ] 12.2 Create src/app/api/cron/reminder-presensi/route.ts GET handler
- [ ] 12.3 Implement authorization check: validate Authorization header === Bearer CRON_SECRET
- [ ] 12.4 Query unsubmitted students: LEFT JOIN ploting_siswa + presensi WHERE presensi.id IS NULL for today
- [ ] 12.5 Implement notification dispatch placeholder: loop through unsubmitted Students, trigger sendWhatsAppReminder() or pushNotification()
- [ ] 12.6 Create src/app/api/cron/rekap-bulanan/route.ts GET handler with same auth pattern
- [ ] 12.7 Implement monthly recap query: aggregate presensi and jurnal stats per student for previous month
- [ ] 12.8 Implement token cleanup cron: DELETE expired tokens from KV matching pattern `token:dudika:*` > 72 hours old
- [ ] 12.9 Deploy cron jobs to Vercel and verify execution from dashboard
- [ ] 12.10 Add cron execution logging to application audit trail

## 13. Audit Trail & Compliance

- [ ] 13.1 Create src/lib/audit.ts: recordAuditTrail(actorId, action, targetEntity, targetId, payloadBefore?, payloadAfter?, ipAddress?)
- [ ] 13.2 Integrate audit logging into createDudika, updateDudika, plotSiswa, unplotSiswa Server Actions
- [ ] 13.3 Integrate audit logging into generateSurat, approveSurat Server Actions
- [ ] 13.4 Integrate audit logging into submitEvaluation, generateCertificate Server Actions
- [ ] 13.5 Create audit log viewer page src/app/dashboard/tu/audit-logs/page.tsx with filters
- [ ] 13.6 Implement immutable guarantee: audit_logs table has no UPDATE or DELETE triggers

## 14. Dashboard Layout & Navigation

- [ ] 14.1 Create shared dashboard layout src/app/dashboard/layout.tsx with sidebar navigation
- [ ] 14.2 Create role-specific navigation menu items per RBAC configuration
- [ ] 14.3 Create Admin TU dashboard src/app/dashboard/tu/page.tsx with overview metrics
- [ ] 14.4 Create Waka Hubin dashboard src/app/dashboard/hubin/page.tsx
- [ ] 14.5 Create Kaprogli dashboard src/app/dashboard/kaprogli/page.tsx
- [ ] 14.6 Create Guru Pembimbing dashboard src/app/dashboard/guru/page.tsx with pending verifications count
- [ ] 14.7 Create Siswa dashboard src/app/dashboard/siswa/page.tsx with attendance summary, journal entries
- [ ] 14.8 Create Instruktur DUDIKA landing page src/app/dudika/landing/page.tsx with evaluation CTA
- [ ] 14.9 Implement logout functionality that clears session cookies

## 15. Testing, Hardening & Production Deployment

- [ ] 15.1 Set up testing utilities: mock db calls with drizzle-orm mock, JWT create utility for tests
- [ ] 15.2 Write unit tests for calculateHaversineDistance() with known coordinate pairs
- [ ] 15.3 Write unit tests for batch certificate chunking logic with 300 items
- [ ] 15.4 Write E2E test for full login → attend → journal → evaluate → certificate flow
- [ ] 15.5 Run lighthouse CI: target score > 90 on all core pages
- [ ] 15.6 Enable SSL/TLS enforcement for database connection (sslmode=require in postgres URL)
- [ ] 15.7 Configure Vercel Blob signed URLs for sensitive documents (private bucket)
- [ ] 15.8 Set up production deployment on Vercel with production env vars
- [ ] 15.9 Execute load test: 100 concurrent attendance submissions during peak period
- [ ] 15.10 Deploy cron jobs to Vercel with Bearer secret authentication
- [ ] 15.11 Final review: verify all 10 specs have corresponding implemented features passing test
