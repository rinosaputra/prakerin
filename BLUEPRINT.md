# **Dokumen Spesifikasi Teknis & Blueprint Sistem Informasi Prakerin/PKL SMK Berbasis Ekosistem Vercel dan Next.js**

## **BAB 1: Arsitektur Sistem & Workflow**

### **1.1 Diagram Alir Data (Data Flow Architecture) dari H-60 hingga Pasca-PKL**

Sistem Informasi Praktik Kerja Lapangan (PKL) / Prakerin Sekolah Menengah Kejuruan (SMK) dirancang untuk memproses siklus hidup operasional dari tahap pra-pelaksanaan, pelaksanaan harian, hingga pasca-pelaksanaan dan sertifikasi. Arsitektur data memanfaatkan alur kerja asinkronus berbasis React Server Components (RSC) dan Next.js Server Actions untuk meminimalkan beban komputasi di sisi klien dan mengoptimalkan performa rendering di sisi server.

#### **Phase 1: Pra-Pelaksanaan / Persiapan (H-60 s.d. H-14)**

Proses dimulai saat Wakil Kepala Sekolah Bidang Hubungan Industri (Waka Hubin) menginput data entitas Dunia Usaha, Dunia Industri, dan Dunia Kerja (DUDIKA) beserta alokasi kuota penerimaan siswa. Data ini tersimpan secara terstruktur pada tabel dudika dan kuota_dudika. Setelah data DUDIKA terekam, Admin Tata Usaha (TU) memicu pembuatan Surat Permohonan PKL. Engine otomatisasi dokumen menarik data template, menyisipkan nomor surat otomatis dari tabel surats, dan meng-generate berkas PDF secara serverless. Berkas PDF yang telah dihasilkan secara otomatis diunggah ke Vercel Blob, dan tautannya dikirimkan ke pihak DUDIKA.  
Setelah DUDIKA mengonfirmasi persetujuan kuota, Admin TU mencatat Nota Kesepahaman (MoU) yang disepakati ke dalam tabel surats berjenis MoU. Selanjutnya, Ketua Program Keahlian (Kaprogli) memetakan siswa ke DUDIKA yang telah disetujui, lalu menetapkan Guru Pembimbing berdasarkan kompetensi keahlian masing-masing. Relasi pemetaan ini disimpan dalam tabel ploting_siswa. Sebagai tahap akhir fase persiapan, Admin TU menerbitkan SK Penetapan PKL dan Surat Tugas Guru Pembimbing yang dilengkapi stempel digital dan verifikasi QR Code.

#### **Phase 2: Pelaksanaan Operasional PKL (H-1 s.d. H+90)**

Pada tahap operasional harian, siswa melakukan presensi masuk dan keluar harian melalui perangkat seluler. Aplikasi mengambil koordinat GPS perangkat, memverifikasi radius lokasi terhadap titik koordinat DUDIKA melalui Vercel Edge Functions, lalu mengunggah foto selfie ke Vercel Blob. Data presensi ini tercatat pada tabel presensi. Siswa juga mencatat aktivitas harian pada tabel jurnal_harian. Guru Pembimbing dan Instruktur DUDIKA menerima notifikasi berkala untuk memverifikasi entri jurnal tersebut. Selama periode ini, Guru Pembimbing mencatat laporan kunjungan berkala serta insiden/kasus siswa ke dalam tabel kunjungan_monitoring dan kasus_siswa.

#### **Phase 3: Pasca-Pelaksanaan & Sertifikasi (H+91 s.d. H+105)**

Setelah masa PKL berakhir, Instruktur DUDIKA mengakses halaman evaluasi tanpa kredensial rumit untuk menginput nilai _soft skills_ dan _hard skills_ pada tabel evaluasi_dudika. Siswa mengunggah draf laporan PKL versi akhir format PDF ke Vercel Blob. Setelah sistem memvalidasi kelengkapan nilai DUDIKA, presensi minimal (misalnya 90%), dan verifikasi jurnal, Admin TU memicu penerbitan Sertifikat PKL kolektif. Engine merekap nilai, membuat QR Code verifikasi dokumen, menyisipkan Tanda Tangan Elektronik (TTE) Kepala Sekolah, dan merekam data sertifikat ke tabel sertifikat.

| Tahapan Operasional                     | Aktor Utama                        | Input Data / Artefak                                           | Output Data / Berkas                                       | Tabel Terkait                                              |
| :-------------------------------------- | :--------------------------------- | :------------------------------------------------------------- | :--------------------------------------------------------- | :--------------------------------------------------------- |
| **Pra-Pelaksanaan (H-60 s.d. H-14)**    | Waka Hubin, Admin TU, Kaprogli     | Data DUDIKA, Kuota Jurusan, Template Surat                     | Surat Permohonan PDF, MoU, SK Kepala Sekolah, Data Ploting | dudika, kuota_dudika, surats, ploting_siswa, sk_details    |
| **Pelaksanaan (H-1 s.d. H+90)**         | Siswa, Guru Pembimbing, Instruktur | Geolokasi GPS, Foto Selfie, Log Harian Work, Laporan Kunjungan | Record Presensi Validated, Verified Jurnal, Log Kasus      | presensi, jurnal_harian, kunjungan_monitoring, kasus_siswa |
| **Pasca-Pelaksanaan (H+91 s.d. H+105)** | Instruktur DUDIKA, Admin TU, Siswa | Nilai Soft/Hard Skills, File Laporan PDF Akhir                 | Sertifikat PKL PDF \+ Hash Verification, Rekap Nilai       | evaluasi_dudika, sertifikat, audit_logs                    |

### **1.2 Alur Kerja Khusus Instruktur DUDIKA (Frictionless Authentication)**

Instruktur DUDIKA umumnya menghadapi kendala dalam mengingat password rumit atau melakukan onboarding akun secara konvensional. Untuk mengatasi hambatan tersebut, sistem menerapkan skema otentikasi tanpa kata sandi (_frictionless authentication_) berbasis _One-Time Token_ (Magic Link) yang dikirimkan via WhatsApp atau Email1.  
Mekanisme otentikasi diawali dengan sistem pemicu (Vercel Cron atau pemicu manual oleh Kaprogli/TU) yang menghasilkan tautan enkripsi unik dengan format https://pkl.smk.sch.id/dudika/evaluasi?token=\<Cryptographic_Token\>. Ketika Instruktur DUDIKA mengklik tautan tersebut, permintaan masuk ke Next.js Middleware. Middleware langsung memvalidasi token yang dikirimkan ke Vercel KV (Upstash Redis)1.  
Vercel KV memeriksa dua kriteria utama: keberadaan token beserta masa berlaku (_Time-To-Live_ / TTL yang diatur selama 72 jam) serta pembatasan laju akses (_rate limiting_) maks 5 kali percobaan per menit untuk mencegah *brute-force*1. Jika token terbukti valid, sistem menerbitkan _Ephemeral Session Cookie_ bertipe JSON Web Token (JWT) dengan _Max-Age_ selama 4 jam, kemudian mengarahkan Instruktur langsung ke antarmuka Form Evaluasi Kinerja dan Validasi Presensi Siswa. Jika token tidak valid atau telah kadaluarsa, halaman dialihkan ke tampilan penolakan akses.  
Untuk menjaga integritas data, token dirancang menggunakan pustaka kriptografi crypto.randomBytes(32).toString('hex') yang diasosiasikan langsung dengan dudika_id dan ploting_id spesifik. Token disimpan di Vercel KV dengan kunci token:dudika:\<token_hash\>1. Setelah Instruktur menyelesaikan pengisian evaluasi dan menekan tombol simpan, token secara otomatis dihapus dari Vercel KV (_single-use invalidation_) guna mencegah manipulasi nilai di masa mendatang1.

### **1.3 Alur Otomatisasi Dokumen Resmi (Document Automation Pipeline)**

Pencetakan otomatis dokumen seperti MoU, SK Kepala Sekolah, Surat Permohonan, Surat Tugas, dan Sertifikat menggunakan pendekatan *Server-Side PDF Rendering Pipeline*3. Proses ini berjalan sepenuhnya di lingkungan Vercel Serverless tanpa memerlukan intervensi manual dari staf tata usaha.

> 1. **Pengambilan Data & Validasi:** Server Action mengeksekusi _query_ teroptimasi ke Vercel Postgres menggunakan Drizzle ORM untuk mengambil data relasional siswa, DUDIKA, dan penomoran surat dari tabel surats serta sk_details.
> 2. **Generasi QR Code & Cryptographic Hash:** Sistem menghitung _hash_ SHA-256 berdasarkan konten dokumen unik dan nomor surat. Hash ini kemudian diubah menjadi gambar QR Code dinamis menggunakan pustaka qrcode. QR Code berfungsi sebagai tautan verifikasi keabsahan dokumen publik pada URL https://pkl.smk.sch.id/verify/doc/\<document_hash\>.
> 3. **PDF Rendering Engine:** Komponen React PDF (@react-pdf/renderer) mengeksekusi penyusunan tata letak dokumen secara programmatic di server5. Variabel dinamis seperti Nama Siswa, NISN, Nama DUDIKA, Rincian Nilai, Stempel Digital, dan TTE Kepala Sekolah langsung diinjeksi ke dalam pohon komponen React PDF5.
> 4. **Penyimpanan & Indeksasi:** Stream buffer PDF dialirkan langsung ke Vercel Blob melalui SDK @vercel/blob. URL publik permanen yang dikembalikan oleh Vercel Blob kemudian disimpan ke dalam kolom surats.file_url atau sertifikat.file_url pada Vercel Postgres.

## **BAB 2: Perancangan Basis Data (Database Schema)**

Spesifikasi basis data dirancang untuk PostgreSQL pada ekosistem Vercel Postgres / Neon dengan penanganan relasi, tipe data presisi tinggi, dan indeks teroptimasi menggunakan Drizzle ORM.

### **2.1 Skema Tabel Drizzle ORM (TypeScript)**

TypeScript  
import {  
 pgTable,  
 uuid,  
 varchar,  
 text,  
 integer,  
 decimal,  
 boolean,  
 timestamp,  
 date,  
 index,  
 uniqueIndex,  
 pgEnum  
} from 'drizzle-orm/pg-core';

// Enums  
export const roleEnum \= pgEnum('role_type', \[  
 'ADMIN_TU',  
 'WAKA_HUBIN',  
 'KAPROGLI',  
 'GURU_PEMBIMBING',  
 'SISWA',  
 'INSTRUKTUR_DUDIKA'  
\]);

export const suratStatusEnum \= pgEnum('surat_status', \[  
 'DRAFT',  
 'PENDING_APPROVAL',  
 'APPROVED',  
 'REJECTED',  
 'ISSUED'  
\]);

export const presensiStatusEnum \= pgEnum('presensi_status', \[  
 'HADIR',  
 'IZIN',  
 'SAKIT',  
 'ALPHA'  
\]);

// 1\. Users Table  
export const users \= pgTable('users', {  
 id: uuid('id').defaultRandom().primaryKey(),  
 name: varchar('name', { length: 255 }).notNull(),  
 email: varchar('email', { length: 255 }).notNull().unique(),  
 phone: varchar('phone', { length: 50 }),  
 role: roleEnum('role').notNull(),  
 externalAuthId: varchar('external_auth_id', { length: 255 }),  
 createdAt: timestamp('created_at').defaultNow().notNull(),  
 updatedAt: timestamp('updated_at').defaultNow().notNull()  
}, (table) \=\> ({  
 authIdx: index('users_auth_idx').on(table.externalAuthId),  
 roleIdx: index('users_role_idx').on(table.role)  
}));

// 2\. DUDIKA Table  
export const dudika \= pgTable('dudika', {  
 id: uuid('id').defaultRandom().primaryKey(),  
 namaPerusahaan: varchar('nama_perusahaan', { length: 255 }).notNull(),  
 alamat: text('alamat').notNull(),  
 latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),  
 longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),  
 radiusMeter: integer('radius_meter').default(100).notNull(),  
 namaPenanggungJawab: varchar('nama_penanggung_jawab', { length: 255 }),  
 contactPersonPhone: varchar('contact_person_phone', { length: 50 }),  
 isActive: boolean('is_active').default(true).notNull(),  
 createdAt: timestamp('created_at').defaultNow().notNull()  
});

// 3\. Kuota DUDIKA Table  
export const kuotaDudika \= pgTable('kuota_dudika', {  
 id: uuid('id').defaultRandom().primaryKey(),  
 dudikaId: uuid('dudika_id').references(() \=\> dudika.id, { onDelete: 'cascade' }).notNull(),  
 jurusan: varchar('jurusan', { length: 100 }).notNull(),  
 tahunAjaran: varchar('tahun_ajaran', { length: 20 }).notNull(),  
 jumlahKuota: integer('jumlah_kuota').notNull(),  
 terpakai: integer('terpakai').default(0).notNull()  
}, (table) \=\> ({  
 dudikaJurusanIdx: uniqueIndex('kuota_dudika_unique_idx').on(table.dudikaId, table.jurusan, table.tahunAjaran)  
}));

// 4\. Ploting Siswa Table  
export const plotingSiswa \= pgTable('ploting_siswa', {  
 id: uuid('id').defaultRandom().primaryKey(),  
 siswaId: uuid('siswa_id').references(() \=\> users.id, { onDelete: 'cascade' }).notNull(),  
 dudikaId: uuid('dudika_id').references(() \=\> dudika.id).notNull(),  
 guruId: uuid('guru_id').references(() \=\> users.id).notNull(),  
 instrukturId: uuid('instruktur_id').references(() \=\> users.id),  
 tanggalMulai: date('tanggal_mulai').notNull(),  
 tanggalSelesai: date('tanggal_selesai').notNull(),  
 statusAktif: boolean('status_aktif').default(true).notNull(),  
 createdAt: timestamp('created_at').defaultNow().notNull()  
}, (table) \=\> ({  
 siswaPlotingIdx: index('ploting_siswa_siswa_idx').on(table.siswaId),  
 dudikaPlotingIdx: index('ploting_siswa_dudika_idx').on(table.dudikaId)  
}));

// 5\. Presensi Table  
export const presensi \= pgTable('presensi', {  
 id: uuid('id').defaultRandom().primaryKey(),  
 plotingId: uuid('ploting_id').references(() \=\> plotingSiswa.id, { onDelete: 'cascade' }).notNull(),  
 tanggal: date('tanggal').notNull(),  
 waktuMasuk: timestamp('waktu_masuk'),  
 waktuKeluar: timestamp('waktu_keluar'),  
 latMasuk: decimal('lat_masuk', { precision: 10, scale: 8 }),  
 longMasuk: decimal('long_masuk', { precision: 11, scale: 8 }),  
 fotoMasukUrl: text('foto_masuk_url'),  
 status: presensiStatusEnum('status').default('HADIR').notNull(),  
 isWithinRadius: boolean('is_within_radius').default(true).notNull(),  
 catatan: text('catatan')  
}, (table) \=\> ({  
 plotingTanggalIdx: uniqueIndex('presensi_ploting_tanggal_idx').on(table.plotingId, table.tanggal),  
 tanggalIdx: index('presensi_tanggal_idx').on(table.tanggal)  
}));

// 6\. Jurnal Harian Table  
export const jurnalHarian \= pgTable('jurnal_harian', {  
 id: uuid('id').defaultRandom().primaryKey(),  
 plotingId: uuid('ploting_id').references(() \=\> plotingSiswa.id, { onDelete: 'cascade' }).notNull(),  
 tanggal: date('tanggal').notNull(),  
 deskripsiPekerjaan: text('deskripsi_pekerjaan').notNull(),  
 fotoKegiatanUrl: text('foto_kegiatan_url'),  
 isVerifiedGuru: boolean('is_verified_guru').default(false).notNull(),  
 isVerifiedInstruktur: boolean('is_verified_instruktur').default(false).notNull(),  
 catatanRevisi: text('catatan_revisi'),  
 createdAt: timestamp('created_at').defaultNow().notNull()  
}, (table) \=\> ({  
 plotingJurnalIdx: index('jurnal_ploting_idx').on(table.plotingId, table.tanggal)  
}));

// 7\. Surats Table  
export const surats \= pgTable('surats', {  
 id: uuid('id').defaultRandom().primaryKey(),  
 nomorSurat: varchar('nomor_surat', { length: 100 }).notNull().unique(),  
 jenisSurat: varchar('jenis_surat', { length: 50 }).notNull(),  
 ditujukanKepada: varchar('ditujukan_kepada', { length: 255 }).notNull(),  
 fileUrl: text('file_url'),  
 status: suratStatusEnum('status').default('DRAFT').notNull(),  
 createdBy: uuid('created_by').references(() \=\> users.id).notNull(),  
 createdAt: timestamp('created_at').defaultNow().notNull()  
}, (table) \=\> ({  
 nomorSuratIdx: index('surat_nomor_idx').on(table.nomorSurat)  
}));

// 8\. Evaluasi DUDIKA Table  
export const evaluasiDudika \= pgTable('evaluasi_dudika', {  
 id: uuid('id').defaultRandom().primaryKey(),  
 plotingId: uuid('ploting_id').references(() \=\> plotingSiswa.id, { onDelete: 'cascade' }).notNull().unique(),  
 nilaiSoftSkill: decimal('nilai_soft_skill', { precision: 5, scale: 2 }).notNull(),  
 nilaiHardSkill: decimal('nilai_hard_skill', { precision: 5, scale: 2 }).notNull(),  
 catatanPerforma: text('catatan_performa'),  
 evaluatedAt: timestamp('evaluated_at').defaultNow().notNull()  
});

// 9\. Sertifikat Table  
export const sertifikat \= pgTable('sertifikat', {  
 id: uuid('id').defaultRandom().primaryKey(),  
 nomorSertifikat: varchar('nomor_sertifikat', { length: 100 }).notNull().unique(),  
 plotingId: uuid('ploting_id').references(() \=\> plotingSiswa.id).notNull().unique(),  
 nilaiAkhir: decimal('nilai_akhir', { precision: 5, scale: 2 }).notNull(),  
 predikat: varchar('predikat', { length: 20 }).notNull(),  
 fileUrl: text('file_url').notNull(),  
 documentHash: varchar('document_hash', { length: 64 }).notNull(),  
 issuedAt: timestamp('issued_at').defaultNow().notNull()  
});

// 10\. Audit Logs Table  
export const auditLogs \= pgTable('audit_logs', {  
 id: uuid('id').defaultRandom().primaryKey(),  
 actorId: uuid('actor_id').references(() \=\> users.id).notNull(),  
 action: varchar('action', { length: 100 }).notNull(),  
 targetEntity: varchar('target_entity', { length: 50 }).notNull(),  
 targetId: uuid('target_id').notNull(),  
 payloadBefore: text('payload_before'),  
 payloadAfter: text('payload_after'),  
 ipAddress: varchar('ip_address', { length: 45 }),  
 createdAt: timestamp('created_at').defaultNow().notNull()  
}, (table) \=\> ({  
 actorIdx: index('audit_actor_idx').on(table.actorId),  
 targetIdx: index('audit_target_idx').on(table.targetEntity, table.targetId)  
}));

### **2.2 Ringkasan Optimasi dan Indeks Basis Data**

| Nama Tabel    | Tipe Primary Key | Foreign Key Utama            | Indeks Optimasi Query                              | Tujuan Optimasi & Dampak Performa                                           |
| :------------ | :--------------- | :--------------------------- | :------------------------------------------------- | :-------------------------------------------------------------------------- |
| users         | UUID v4          | \-                           | external_auth_id, role                             | Mempercepat validasi sesi Auth & pemfilteran hak akses pada Middleware.     |
| kuota_dudika  | UUID v4          | dudika_id                    | Compound Unique (dudika_id, jurusan, tahun_ajaran) | Mencegah _race condition_ dan duplikasi alokasi kuota per jurusan.          |
| ploting_siswa | UUID v4          | siswa_id, dudika_id, guru_id | siswa_id, dudika_id                                | Menerapkan _fast lookup_ untuk query Dashboard spesifik tiap pengguna.      |
| presensi      | UUID v4          | ploting_id                   | Compound Unique (ploting_id, tanggal), tanggal     | Mencegah _double check-in_ harian dan mempercepat aggregasi rekapitulasi.   |
| jurnal_harian | UUID v4          | ploting_id                   | Compound (ploting_id, tanggal)                     | Pengurutan kronologis jurnal siswa secara instan pada antarmuka verifikasi. |
| surats        | UUID v4          | created_by                   | nomor_surat                                        | Mencapai pencarian arsip persuratan digital dalam latensi di bawah 10ms.    |
| audit_logs    | UUID v4          | actor_id                     | Compound (target_entity, target_id)                | Tracking riwayat perubahan data sensitif untuk keperluan audit internal.    |

## **BAB 3: Rincian Modul & Fitur Teknis (Feature Breakdown)**

### **3.1 Breakdown Matriks Hak Akses Modul (RBAC Matrix)**

| Modul / Fitur Operasional            | Admin TU               | Waka Hubin             | Kaprogli               | Guru Pembimbing      | Siswa Peserta  | Instruktur DUDIKA |
| :----------------------------------- | :--------------------- | :--------------------- | :--------------------- | :------------------- | :------------- | :---------------- |
| **Kelola Master DUDIKA & Kuota**     | Read                   | Create, Update, Delete | Read                   | Read                 | No Access      | No Access         |
| **Otomatisasi Surat, MoU, & SK**     | Create, Update, Delete | Read                   | Read                   | Read                 | No Access      | No Access         |
| **Ploting Siswa & Pembimbing**       | Read                   | Read                   | Create, Update, Delete | Read                 | No Access      | No Access         |
| **Presensi Geofencing GPS**          | No Access              | No Access              | No Access              | Read                 | Create, Read   | Read              |
| **Pengisian & Verifikasi Jurnal**    | No Access              | No Access              | No Access              | Update, Read         | Create, Update | Update, Read      |
| **Monitoring Kunjungan & Kasus**     | No Access              | Read                   | Read                   | Create, Update, Read | No Access      | No Access         |
| **Penilaian Performance (Evaluasi)** | No Access              | No Access              | Read                   | Read                 | No Access      | Create, Update    |
| **Penerbitan Sertifikat Digital**    | Create, Update, Delete | Read                   | Read                   | No Access            | Read           | No Access         |

### **3.2 Spesifikasi Fitur Presensi GPS & Validasi Geofencing**

Presensi harian siswa mewajibkan verifikasi lokasi geografis presisi tinggi. Validasi _geofencing_ dikalkulasi pada Next.js Server Actions / Edge Functions menggunakan algoritma *Haversine Formula*6. Algoritma ini menghitung jarak lingkaran besar (_great-circle distance_) antara dua titik koordinat latitude dan longitude pada permukaan bumi6.

#### **Formulasi Matematika Haversine:**

![][image1]  
Di mana ![][image2] mewakili latitude (dalam radian), ![][image3] mewakili longitude (dalam radian), dan ![][image4] adalah jari-jari rata-rata bumi yang ditetapkan sebesar ![][image5].

#### **Kode Server Action Next.js (app/actions/presensi.ts):**

TypeScript  
'use server';

import { db } from '@/lib/db';  
import { presensi, plotingSiswa } from '@/lib/db/schema';  
import { eq } from 'drizzle-orm';  
import { put } from '@vercel/blob';  
import { revalidatePath } from 'next/cache';

function calculateHaversineDistance(  
 lat1: number, lon1: number,  
 lat2: number, lon2: number  
): number {  
 const R \= 6371000;  
 const dLat \= (lat2 \- lat1) \* (Math.PI / 180);  
 const dLon \= (lon2 \- lon1) \* (Math.PI / 180);  
 const a \=  
 Math.sin(dLat / 2) \* Math.sin(dLat / 2) \+  
 Math.cos(lat1 \* (Math.PI / 180)) \* Math.cos(lat2 \* (Math.PI / 180)) \*  
 Math.sin(dLon / 2) \* Math.sin(dLon / 2);  
 const c \= 2 \* Math.atan2(Math.sqrt(a), Math.sqrt(1 \- a));  
 return R \* c;  
}

export async function submitAttendance(formData: FormData) {  
 const plotingId \= formData.get('plotingId') as string;  
 const userLat \= parseFloat(formData.get('latitude') as string);  
 const userLong \= parseFloat(formData.get('longitude') as string);  
 const imageFile \= formData.get('image') as File;  
 const todayStr \= new Date().toISOString().split('T')\[0\];

const plotData \= await db.query.plotingSiswa.findFirst({  
 where: eq(plotingSiswa.id, plotingId),  
 with: { dudika: true }  
 });

if (\!plotData) throw new Error('Data ploting tidak ditemukan.');

const targetLat \= parseFloat(plotData.dudika.latitude);  
 const targetLong \= parseFloat(plotData.dudika.longitude);  
 const maxRadius \= plotData.dudika.radiusMeter;

const distance \= calculateHaversineDistance(userLat, userLong, targetLat, targetLong);  
 const isWithinRadius \= distance \<= maxRadius;

const blob \= await put(\`presensi/${plotingId}/${todayStr}.jpg\`, imageFile, {  
 access: 'public',  
 });

await db.insert(presensi).values({  
 plotingId,  
 tanggal: todayStr,  
 waktuMasuk: new Date(),  
 latMasuk: userLat.toString(),  
 longMasuk: userLong.toString(),  
 fotoMasukUrl: blob.url,  
 status: 'HADIR',  
 isWithinRadius,  
 catatan: isWithinRadius ? 'Presensi Valid' : \`Di luar radius: ${Math.round(distance)}m\`  
 });

revalidatePath('/dashboard/siswa/presensi');  
 return { success: true, isWithinRadius, distance: Math.round(distance) };  
}

### **3.3 Spesifikasi Fitur Auto-Generate Dokumen PDF**

Pemilihan pustaka pemrosesan PDF di lingkungan Next.js Vercel Serverless memerlukan evaluasi ketat terkait _bundle size_, _cold start latency_, dan penggunaan memori3.

| Metrik Evaluasi                 | @react-pdf/renderer                  | puppeteer-core \+ @sparticuz/chromium-min | Microservice Khusus (Docker/Fargate)      |
| :------------------------------ | :----------------------------------- | :---------------------------------------- | :---------------------------------------- |
| **Ukuran Bundle (Bundle Size)** | Sangat Kecil (\~2MB)5                | Besar (\~50MB \- 100MB)3                  | Terisolasi dari Next.js App4              |
| **Waktu Generasi Document**     | 100ms \- 500ms7                      | 1.5s \- 4.0s3                             | 500ms \- 1.2s4                            |
| **Cold Start Overhead**         | Sangat Rendah                        | Tinggi (Perlu ekstraksi binary Chromium)3 | Tergantung infrastruktur luar4            |
| **Kemudahan Styling**           | Komponen Khusus (JSX Style)5         | Full HTML/CSS & Tailwind4                 | Full HTML/CSS4                            |
| **Rekomendasi Penggunaan**      | **Sertifikat, SK, Surat Permohonan** | Dokumen HTML kompleks yang variatif       | Skala Enterprise raksasa (\>10k PDF/jam)4 |

#### **Kode Generator Sertifikat (lib/pdf/certificate-generator.tsx):**

TypeScript  
import { Page, Text, View, Document, StyleSheet, renderToBuffer } from '@react-pdf/renderer';  
import { put } from '@vercel/blob';

const styles \= StyleSheet.create({  
 page: { padding: 40, fontFamily: 'Helvetica' },  
 header: { fontSize: 22, textAlign: 'center', marginBottom: 20, fontWeight: 'bold' },  
 section: { margin: 15, padding: 10, fontSize: 12, leading: 1.6 },  
 highlight: { fontSize: 16, fontWeight: 'bold', marginVertical: 5 },  
 qrContainer: { marginTop: 30, alignItems: 'center' },  
 hashText: { fontSize: 8, color: '\#666666' }  
});

interface CertificateData {  
 namaSiswa: string;  
 nisn: string;  
 dudikaNama: string;  
 nilai: string;  
 predikat: string;  
 documentHash: string;  
}

const SertifikatDocument \= ({ namaSiswa, nisn, dudikaNama, nilai, predikat, documentHash }: CertificateData) \=\> (  
 \<Document\>  
 \<Page size\="A4" orientation\="landscape" style\={styles.page}\>  
 \<View style\={styles.header}\>  
 \<Text\>SERTIFIKAT PRAKTIK KERJA LAPANGAN (PKL)\</Text\>  
 \</View\>  
 \<View style\={styles.section}\>  
 \<Text\>Diberikan kepada:\</Text\>  
 \<Text style\={styles.highlight}\>{namaSiswa} (NISN: {nisn})\</Text\>  
 \<Text\>  
 Telah melaksanakan Praktik Kerja Lapangan di {dudikaNama} dan dinyatakan LULUS dengan Nilai Akhir {nilai} ({predikat}).  
 \</Text\>  
 \</View\>  
 \<View style\={styles.qrContainer}\>  
 \<Text style\={styles.hashText}\>Digital Signature Hash: {documentHash}\</Text\>  
 \</View\>  
 \</Page\>  
 \</Document\>  
);

export async function generateCertificatePdf(data: CertificateData): Promise\<string\> {  
 const buffer \= await renderToBuffer(\<SertifikatDocument {...data} /\>);

const blob \= await put(\`sertifikat/${data.nisn}-PKL.pdf\`, buffer, {  
 access: 'public',  
 contentType: 'application/pdf'  
 });

return blob.url;  
}

## **BAB 4: Pemanfaatan Fitur Native Vercel secara Maksimal**

### **4.1 Pemetaan Strategi Storage & State Vercel Ecosystem**

Infrastruktur Vercel menyediakan komponen terintegrasi yang dioptimalkan untuk performa tinggi pada skala enterprise. Pemilihan komponen disesuaikan dengan pola akses dan tingkat toleransi latensi data.  
Vercel Blob dimanfaatkan sebagai _Object Storage_ utama yang menyimpan berkas statis berukuran sedang hingga besar seperti foto selfie presensi, PDF persuratan resmi, laporan akhir PKL, dan sertifikat digital. Vercel Blob dipilih karena terintegrasi langsung dengan Edge Network Vercel dan menawarkan latensi unduh yang sangat rendah.  
Vercel KV (Upstash Redis) berfungsi sebagai _In-Memory Cache_ dan state transient berlatensi ultra-rendah. Vercel KV digunakan untuk mengelola _rate limiting_ presensi, menyimpan token Magic Link DUDIKA dengan TTL otomatis, dan menyimpan cache data master yang sering diakses.  
Vercel Cron bertindak sebagai _Orchestrator_ terkoordinasi yang memicu fungsi terjadwal melalui HTTP GET request. Vercel Cron mengotomatiskan pengiriman pengingat presensi harian, rekapitulasi jurnal bulanan, dan pembersihan token kadaluarsa secara independen8.

| Service Vercel  | Karakteristik Akses                    | Use Case Utama dalam Sistem                               | Batas Kapasitas / TTL                          |
| :-------------- | :------------------------------------- | :-------------------------------------------------------- | :--------------------------------------------- |
| **Vercel Blob** | Write Once, Read Many (Public/Private) | Foto Selfie GPS, Berkas Laporan PDF, Scan MoU, Sertifikat | Skalabel tanpa batas file tunggal konvensional |
| **Vercel KV**   | Sub-10ms Read/Write (In-Memory)        | Magic Link Tokens, Rate Limit Counter, User Session Cache | TTL disesuaikan (misal: 72 jam untuk Token)1   |
| **Vercel Cron** | Scheduled HTTP Execution               | Trigger Pengingat Jam 17:00, Rekap Bulanan                | Maksimal sesuai batas plan Vercel8             |

### **4.2 Konfigurasi vercel.json dan Keamanan Cron Jobs**

Penjadwalan tugas otomatis dikonfigurasikan pada berkas vercel.json9. Perlu dicatat bahwa jadwal Vercel Cron berjalan menggunakan standar zona waktu UTC8. Oleh karena itu, target waktu pengingat jam 17:00 WIB (UTC+7) dikonversi menjadi jam 10:00 UTC8.

JSON  
{  
 "$schema": "https://openapi.vercel.sh/vercel.json",  
 "crons": \[  
 {  
 "path": "/api/cron/reminder-presensi",  
 "schedule": "0 10 \* \* 1-5"  
 },  
 {  
 "path": "/api/cron/rekap-bulanan",  
 "schedule": "0 1 1 \* \*"  
 }  
 \]  
}

#### **Implementasi Route Handler Cron Aman (app/api/cron/reminder-presensi/route.ts):**

TypeScript  
import { NextRequest, NextResponse } from 'next/server';  
import { db } from '@/lib/db';  
import { presensi, plotingSiswa } from '@/lib/db/schema';  
import { eq, and, isNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {  
 const authHeader \= request.headers.get('authorization');  
 if (authHeader \!== \`Bearer ${process.env.CRON_SECRET}\`) {  
 return new NextResponse('Unauthorized Execution Request', { status: 401 });  
 }

const todayStr \= new Date().toISOString().split('T')\[0\];

const unsubmittedStudents \= await db.select({  
 plotingId: plotingSiswa.id,  
 siswaId: plotingSiswa.siswaId  
 })  
 .from(plotingSiswa)  
 .leftJoin(presensi, and(  
 eq(presensi.plotingId, plotingSiswa.id),  
 eq(presensi.tanggal, todayStr)  
 ))  
 .where(isNull(presensi.id));

// Logika Pengiriman Push Notification / WhatsApp Gateway  
 return NextResponse.json({  
 success: true,  
 timestamp: new Date().toISOString(),  
 unsubmittedCount: unsubmittedStudents.length  
 });  
}

### **4.3 Strategi Penanganan Vercel Serverless Execution Limits**

Proses pembuatan dokumen kolektif (seperti pembuatan 300 PDF Sertifikat sekaligus) berisiko memicu _Serverless Function Timeout_ atau _Out-Of-Memory_ (OOM) jika tidak ditangani dengan benar7.

> 1. **Konfigurasi Extended Duration & Fluid Compute:** Mengaktifkan Fluid Compute pada Dashboard Vercel dan menambahkan deklarasi maxDuration pada Route Handler target untuk memperpanjang batas eksekusi fungsi hingga 300 detik11:  
>    TypeScript  
>    export const maxDuration \= 300; // Eksekusi maksimum 5 menit  
>    export const dynamic \= 'force-dynamic';

> 2. **Pola Pemrosesan Terbagi (Chunking Batch Pattern):** Sistem membagi array entitas besar menjadi _chunk_ terkontrol (misal: 10 sertifikat per batch) untuk mencegah lonjakan RAM serverless4.

TypeScript  
export async function processBulkCertificates(plotingIds: string\[\]) {  
 const BATCH_SIZE \= 10;  
 const results \= \[\];

for (let i \= 0; i \< plotingIds.length; i \+= BATCH_SIZE) {  
 const batch \= plotingIds.slice(i, i \+ BATCH_SIZE);

    // Eksekusi paralel terbatas per batch
    const batchResults \= await Promise.all(
      batch.map(async (id) \=\> {
        try {
          return await generateCertificateForPloting(id);
        } catch (error) {
          return { id, status: 'FAILED', error: (error as Error).message };
        }
      })
    );

    results.push(...batchResults);

}

return results;  
}

## **BAB 5: Keamanan, Hak Akses, & Kepatuhan**

### **5.1 Role-Based Access Control (RBAC) pada Next.js Middleware**

Next.js Middleware mengeksekusi pemeriksaan sesi JWT secara synchronous di _edge_ sebelum permintaan mencapai layer rendering page atau API handler, menjamin isolasi hak akses secara total.

TypeScript  
import { NextResponse } from 'next/server';  
import type { NextRequest } from 'next/server';  
import { jwtVerify } from 'jose';

const ROLE_PATTERNS: Record\<string, RegExp\> \= {  
 ADMIN_TU: /^\\/dashboard\\/tu/,  
 WAKA_HUBIN: /^\\/dashboard\\/hubin/,  
 KAPROGLI: /^\\/dashboard\\/kaprogli/,  
 GURU_PEMBIMBING: /^\\/dashboard\\/guru/,  
 SISWA: /^\\/dashboard\\/siswa/,  
 INSTRUKTUR_DUDIKA: /^\\/dashboard\\/dudika/,  
};

export async function middleware(request: NextRequest) {  
 const { pathname } \= request.nextUrl;  
 const token \= request.cookies.get('session_token')?.value;

if (  
 pathname.startsWith('/\_next') ||  
 pathname.startsWith('/api/cron') ||  
 pathname.startsWith('/verify') ||  
 pathname \=== '/login'  
 ) {  
 return NextResponse.next();  
 }

if (\!token) {  
 return NextResponse.redirect(new URL('/login', request.url));  
 }

try {  
 const secret \= new TextEncoder().encode(process.env.JWT_SECRET);  
 const { payload } \= await jwtVerify(token, secret);  
 const userRole \= payload.role as string;

    const allowedPattern \= ROLE\_PATTERNS\[userRole\];
    if (allowedPattern && \!allowedPattern.test(pathname)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    return NextResponse.next();

} catch (error) {  
 return NextResponse.redirect(new URL('/login', request.url));  
 }  
}

export const config \= {  
 matcher: \['/dashboard/:path\*'\],  
};

### **5.2 Perlindungan Data Sensitif & Kepatuhan NDA DUDIKA**

- **Enkripsi Data in-Transit & at-Rest:** Seluruh koneksi database Vercel Postgres diwajibkan menggunakan enkripsi SSL/TLS (sslmode=require). Data sensitif di Vercel Blob menggunakan _Signed Private URLs_ yang membatasi masa akses berkas1.
- **Digital Non-Disclosure Agreement (NDA Workflow):** Sebelum siswa ditugaskan ke DUDIKA tertentu, sistem mewajibkan persetujuan klausul NDA secara digital yang ditandatangani oleh Waka Hubin dan Penanggung Jawab DUDIKA. Berkas NDA yang ditandatangani disimpan secara permanen di Vercel Blob dan dicatat dalam audit log.

### **5.3 Strategi Audit Trail**

Sistem mencatat setiap tindakan sensitif (pengubahan nilai, persetujuan surat, modifikasi kuota) secara imutabel ke tabel audit_logs untuk menjaga kepatuhan dan akuntabilitas.

TypeScript  
export async function recordAuditTrail({  
 actorId,  
 action,  
 targetEntity,  
 targetId,  
 payloadBefore,  
 payloadAfter,  
 ipAddress  
}: {  
 actorId: string;  
 action: string;  
 targetEntity: string;  
 targetId: string;  
 payloadBefore?: object;  
 payloadAfter?: object;  
 ipAddress?: string;  
}) {  
 await db.insert(auditLogs).values({  
 actorId,  
 action,  
 targetEntity,  
 targetId,  
 payloadBefore: payloadBefore ? JSON.stringify(payloadBefore) : null,  
 payloadAfter: payloadAfter ? JSON.stringify(payloadAfter) : null,  
 ipAddress: ipAddress || '0.0.0.0'  
 });  
}

## **BAB 6: Peta Jalan Pengembangan (Roadmap & Implementation Steps)**

Rencana pelaksanaan proyek disusun secara sistematis selama 8 minggu, mencakup seluruh tahapan dari _setup_ awal hingga eksekusi skala produksi di Vercel Platform.

### **6.1 Matriks Pelaksanaan Tahapan Pengembangan**

| Tahapan & Waktu          | Fokus Utama & Tugas Spesifik                                  | Deliverables Utama                                                           | Criteria Acceptance / Target QA                                                       |
| :----------------------- | :------------------------------------------------------------ | :--------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ |
| **Tahap 1 (Minggu 1-2)** | Setup Framework, Database Schema, Core Authentication & RBAC  | Inisialisasi Next.js App Router, Drizzle Migration, Setup Auth & Middleware. | Seluruh 6 Role dapat login; Middleware berhasil memblokir route unauthorized.         |
| **Tahap 2 (Minggu 3-4)** | Master Data Management & Engine Persuratan Admin TU / Hubin   | CRUD DUDIKA, Kuota, Ploting, Generator PDF Surat Permohonan & MoU.           | Staf TU dapat meng-generate PDF resmi dalam latensi \< 1 detik7.                      |
| **Tahap 3 (Minggu 5-6)** | Modul Operasional Siswa, Guru Pembimbing, & Instruktur DUDIKA | Presensi GPS Geofencing, Upload Selfie Vercel Blob, Jurnal, Magic Link.      | Siswa berhasil presensi dalam radius; Instruktur DUDIKA menginput nilai via WA Link1. |
| **Tahap 4 (Minggu 7\)**  | Otomatisasi PDF Masal, Vercel Cron Jobs, & Speed Insights     | Dynamic Certificate Generator, Setup Cron Pengingat 17:00, Speed Insights.   | 300 Sertifikat dapat dibuat secara batch tanpa error timeout7; Cron aktif.            |
| **Tahap 5 (Minggu 8\)**  | Testing, Hardening, Security Audit & Production Deployment    | Penetration Testing, Load Testing Presensi Bersamaan, Deployment Vercel.     | Lighthouse Score \> 90; Core Web Vitals Passed; Go-Live Production.                   |

### **6.2 Topologi Arsitektur Hosting & Infrastruktur Vercel**

Sistem di-deploy secara penuh pada Vercel Platform menggunakan infrastruktur serverless berkinerja tinggi. Pada layer terluar, Vercel Edge Network menangani penutupan TLS, caching konten statis, dan eksekusi Next.js Middleware untuk verifikasi RBAC cepat dan perhitungan jarak geofencing.  
Di layer komputasi, Serverless Functions menjalankan logika bisnis Next.js Server Actions, rendering dokumen PDF via @react-pdf/renderer, dan pemrosesan API Route Handler5. Layar ini didukung oleh Fluid Compute yang mampu menangani eksekusi tugas berdurasi panjang seperti generasi sertifikat masal11.  
Pada layer penyimpanan data, Vercel Postgres (Neon) bertindak sebagai basis data relasional utama dengan _connection pooling_ terintegrasi. Vercel KV (Upstash Redis) mengelola state transient seperti rate-limiting dan token Magic Link1. Vercel Blob menyediakan media penyimpanan objek terdistribusi untuk berkas media dan dokumen resmi. Seluruh kesehatan aplikasi dan latensi runtime dipantau secara real-time melalui Vercel Analytics dan Speed Insights.

#### **Works cited**

> 1. Managing Cron Jobs \- Vercel, [https://vercel.com/docs/cron-jobs/manage-cron-jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
> 2. Nextjs 14 Rate Limiting Tutorial | Upstash Drizzle Server Actions \- YouTube, [https://www.youtube.com/watch?v=S7Fxc2XVIFA](https://www.youtube.com/watch?v=S7Fxc2XVIFA)
> 3. Rendering PDFs on Vercel with Next.js \- Marcel Fetten, [https://www.ventura-digital.de/blog/rendering-pdfs-on-vercel-with-nextjs](https://www.ventura-digital.de/blog/rendering-pdfs-on-vercel-with-nextjs)
> 4. Solved: Anyone generating PDF's server-side in Next.js? – TechResolve, [https://techresolve.blog/2025/12/25/anyone-generating-pdfs-server-side-in-next-js/](https://techresolve.blog/2025/12/25/anyone-generating-pdfs-server-side-in-next-js/)
> 5. Answer: React-PDF Slow Performance with large PDF, reneders unneccessarily., [https://dev.to/hossain45/answer-react-pdf-slow-performance-with-large-pdf-reneders-unneccessarily-5f6](https://dev.to/hossain45/answer-react-pdf-slow-performance-with-large-pdf-reneders-unneccessarily-5f6)
> 6. thealmarques/haversine-distance-typescript \- GitHub, [https://github.com/thealmarques/haversine-distance-typescript](https://github.com/thealmarques/haversine-distance-typescript)
> 7. Long Render Time \#544 \- diegomura/react-pdf \- GitHub, [https://github.com/diegomura/react-pdf/issues/544](https://github.com/diegomura/react-pdf/issues/544)
> 8. Cron Jobs \- Vercel, [https://vercel.com/docs/cron-jobs](https://vercel.com/docs/cron-jobs)
> 9. How to Setup Cron Jobs on Vercel, [https://vercel.com/kb/guide/how-to-setup-cron-jobs-on-vercel](https://vercel.com/kb/guide/how-to-setup-cron-jobs-on-vercel)
> 10. Getting started with cron jobs \- Vercel, [https://vercel.com/docs/cron-jobs/quickstart](https://vercel.com/docs/cron-jobs/quickstart)
> 11. How to stop Vercel Functions from timing out, [https://vercel.com/kb/guide/what-can-i-do-about-vercel-serverless-functions-timing-out](https://vercel.com/kb/guide/what-can-i-do-about-vercel-serverless-functions-timing-out)
> 12. How do I lower my Vercel Function execution time?, [https://vercel.com/kb/guide/how-do-i-lower-my-serverless-function-execution-time](https://vercel.com/kb/guide/how-do-i-lower-my-serverless-function-execution-time)
> 13. How to increase timeout limit on Vercel Serverless functions \- Stack Overflow, [https://stackoverflow.com/questions/77503770/how-to-increase-timeout-limit-on-vercel-serverless-functions](https://stackoverflow.com/questions/77503770/how-to-increase-timeout-limit-on-vercel-serverless-functions)

[image1]: data:image/png;base64,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
[image2]: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAaCAYAAACD+r1hAAAA+UlEQVR4XmNgGP7ABYgXAzEzugQu0ArE6eiCuAAHEC8DYmN0CVzAD4jnATEjugQu0A/EqeiC6IAPiMuA+BEQ/wXi50D8CYgnICuCAR8gfg/E04BYGIi3AbEgEMsA8SEglkcoZWAwB+LNQMyJJBaExJYE4gNAzAPisADxciD2QFIAMlkTia/PgKRBBIivMkCshgGQYrAkFEQD8RQGaIiJA/FdBoi1yApgAOTMHUBsiCQGtnIOVBLknI0MkBCbDMQfGSBxggFAnn4NxLuB+AkDJEg7GSAhhhOAkkMVEDczEBnDsBADpVKiACjEQE6TRpfABfyBOBZdcMQDAEb+IZz0hHhVAAAAAElFTkSuQmCC
[image3]: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAaCAYAAACD+r1hAAAAxUlEQVR4Xu2RzQpBQRiGP0VRFmJhY4Fs7JRSVjZchVtwG+7Ayg24BQtp9uyVsrFxBRbIzzMNp+nrzGyVPPUs5n3PNDPfEfktKrjFKy5UFySHc3xiVnVBunjGpi5ijNFgUeVBGnjBvi5CZMS9Y6qLGA/cYVUXaZTxJu4UO+LoxGq4wYG4d5wkMrEW7nGFBVyKO2Xif/Shg0dci7uSxY7XbjDvdcIQD9hWuZ3WTNymBPtzDPb80GOEd6z7YclfpGD7vA7/fI8XXVkeg7zZxLIAAAAASUVORK5CYII=
[image4]: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAZCAYAAAA4/K6pAAAA+ElEQVR4Xu2SPwtBYRSHj7IhSSlhkUUpg9VgsFhMBkUZfAYpuw9BGazyEQzKaDGwY2CyKMogfqdz73Xvuf59gPvU063fOffct/NeIg9NFg7gCu6N5wgODdswanV/oQK3MKHyDDzAh8pd9OEU+lUeggv6MSAAZ7CrCyANj/RjgNlU1AXQJHn5pgt2+PjclIJxWIJ1eIUTmLQ63xCEc5IB5ub5FnawBX1W5wf4Gk/wovIwvMOqyl00SL6+0QWSfKxDOxG4JGnkQXZ4sZz3VO6gQHL0M8yrWplkgHm1/H/wdTvokDStyb1pPSAHY6/yf/CCa4b8S3t4WDwByBAwE2J6GB0AAAAASUVORK5CYII=
[image5]: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIwAAAAZCAYAAADja8bOAAAFiUlEQVR4Xu2Za8hmUxTH/xOK3COXEImRyH1ohsg1PviCGkP45BLjk6RRPsqlXPPJJUliJJdck3hCCEWiKZdCLkUSITOu62ed1bPOnnPO8zxv78zbaP/r33uete9r/8/aa59XqqioqKioqKj4f2AL4/7GHcqCCdjVuLtxJ+OiogycXBomYC/jdqVxAjaTz2GpuucQYI3LNLzGbYwHN9yyKKuQO3ul8WfjO8ZvjDfJnTuEaPek8QHjT8bv1N4wnv8x/mL8soOvjav+B8S3znhmYR/CCcZPjO8Z7zZ+ZFzSquHzWG78wXif8WPjq8Z9Uh2wtdwPqxtSf6tWjYUDIl9wAePIv4xnJduv8k0e2jQc+5K83vaNjTdzZHxW44Xx1l9pPKfh0Y3tCuPL8rYIbxe5Q+hj0tgZmxu/Ne6bbAfKN/rhppwx3pK/DDumeqcY/06/iU5r0+8ANsoWEvgTv07rlw2Gg+Rv5M7JdrFxlVwUfWABT2iyYI5Mz4HD5W844ikxq2AQRykE1sKaQkghjMfkAgqEsKLtnfKxS2C7vjRuZHA8/qjp/bLBcI3xIQ2f+31AUBwHgT2Mn8uPqcBh6TmAoM4ujQ1mFQz1RvJ2gRAu/ZwhXyPPHJsZRLovjIeq3aYENqLp0AtElESoHOM5YmYwBkduH2hLedmOFzKi+ZBfaMeaulIJxo5+y/6nRoS5G+SOfV9+fq+QL3pWXKZ2xOkCwry9+duFWQWDGEbqF8ylcqEMCYYIFM99gimjcAblkKP8WHlu9pX8qP/AuNj4SmMnxyvzQ56vNv5mfMb4u/Fx425NOflfjBFk3QH6f1s+f/IzcknyNXzMuqLNI/K9Zl7Pa3ifOhFOWqO28gnddHpqsg2B3ORyuVPfLMoyYiP7xALmWzCUTxIMY00SDGXU6UOMcVey7SkXzunJBqh3b/qNr1/QOLnm2GQPcu4U/Zd+oQ3HbR7jOOMfGudwpAWImeOXY5iUA3ZFokGEk8ojifOayTHpfOZPAtdqlL5S3aIgsc5JZhc2dcHky0P0WbYr5xJCo16QKIT9/KZOn2A4ThECwoq2R8jzt8jtQjDcSLf1ZnMDndHptYU9zvyhMNwH+vpenkxnxFvDxIewqQsmz3sawcR635V/EihJqgC6+gf8Xit/6cu2N8rzlRDMSG0/zYzIYfJ5CEIwXYsNkOMQ+mAGC6AtuUMGtxVUT4gewqyCod5I/YKhPNbTJxgcmtuUwDbSsLO7NnQawZBI87vcgxK5f3xPNOcvguoaI2PeBAOYKNfJDKIEkxu6GZwrr1M6mJDcJRgWFiIcwqyCISSXkZB87DONz+wYO1/3AW1J8qMteUW5HoCt9FGJuQqm63cXcv/0N2r+sj7EgCj6MK+C4aigs2OSDWcjlsiiw+Hwlsa2n/yL8G3Nb8BV8kN5nUXJDmIzJglmb3m9C7R+UhbziDkESBpXaTwmz2XSflVjW978pu/75cdnAGe+qPbXX56f1vDXXl4q6jC3yDnAIfJb0QHJRlSg3mqN18fcsOGjGIeb26Ma7wEvIHXIbZYaH9RY/PicbzTLmt/Mh77i08WJ8hsYF5J8uZkzuG4x4B3Gm41vyDP8AEp+XX5dy5uwRP5J/lbjdXIxrNP6Gw3io9iosIN8HHQxEPMob2/c0HDIPfIbG88Xqi1a5oSzKSM6PiXfzJNSHcC6PzVe0pDnuN72oZwvUQBfZNvIeF5HXSI882Qea+T+4yr+nNrjIhz2iUsD9Y5KZfzfDf/+afxafn3nhaNffFaOORSNpgIdL5Y7kjdklm8w1I12p6n/CGNR1CMybQhwprNRF6l/DoB/bDLX49UtbIBDqcN88cvGAvvAOoY+rFHWN28iDgLpK6+oqKioqKioqKioqKioqFgY/AuA6ZXEV0VTzgAAAABJRU5ErkJggg==
