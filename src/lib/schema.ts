import { pgEnum, pgTable, text, timestamp, uuid, integer, boolean, decimal, date, pgUnique, index as pgIndex, uniqueIndex as pgUniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum types
export const userRoleEnum = pgEnum('user_role', [
  'ADMIN_TU',
  'WAKA_HUBIN',
  'KAPROGLI',
  'GURU_PEMBIMBING',
  'SISWA',
  'INSTRUKTUR_DUDIKA'
]);

export const attendanceStatusEnum = pgEnum('attendance_status', [
  'HADIR',
  'IZIN',
  'SAKIT',
  'ALPHA'
]);

export const evaluationPredikatEnum = pgEnum('evaluation_predikat', [
  'A',
  'B',
  'C'
]);

export const documentStatusEnum = pgEnum('document_status', [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'ISSUED'
]);

export const caseSeverityEnum = pgEnum('case_severity', [
  'ringan',
  'sedang',
  'berat'
]);

// 1. Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull(),
  namaLengkap: text('nama_lengkap').notNull(),
  nisn: text('nisn'), // for siswa role
  nip: text('nip'), // for guru role
  dudikaId: uuid('dudika_id').references(() => dudika.id), // for instruktur role
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. DUDIKA table
export const dudika = pgTable('dudika', {
  id: uuid('id').defaultRandom().primaryKey(),
  namaPerusahaan: text('nama_perusahaan').notNull(),
  alamat: text('alamat').notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
  radiusMeter: integer('radius_meter').default(100).notNull(),
  namaPenanggungJawab: text('nama_penanggung_jawab'),
  contactPersonPhone: text('contact_person_phone'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. Kuota DUDIKA table
export const kuotaDudika = pgTable('kuota_dudika', {
  id: uuid('id').defaultRandom().primaryKey(),
  dudikaId: uuid('dudika_id').notNull().references(() => dudika.id),
  jurusan: text('jurusan').notNull(),
  tahunAjaran: text('tahun_ajaran').notNull(),
  jumlahKuota: integer('jumlah_kuota').notNull(),
  terpakai: integer('terpakai').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniqueDudikaJurusanTahun: pgUniqueIndex('unique_dudika_jurusan_tahun').on(table.dudikaId, table.jurusan, table.tahunAjaran),
}));

// 4. Ploting Siswa table
export const plotingSiswa = pgTable('ploting_siswa', {
  id: uuid('id').defaultRandom().primaryKey(),
  siswaUserId: uuid('siswa_user_id').notNull().references(() => users.id),
  dudikaId: uuid('dudika_id').notNull().references(() => dudika.id),
  guruPembimbingId: uuid('guru_pembimbing_id').notNull().references(() => users.id),
  instrukturId: uuid('instruktur_id').references(() => users.id),
  tanggalMulai: date('tanggal_mulai').notNull(),
  tanggalSelesai: date('tanggal_selesai').notNull(),
  statusAktif: boolean('status_aktif').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 5. Presensi table
export const presensi = pgTable('presensi', {
  id: uuid('id').defaultRandom().primaryKey(),
  plotingId: uuid('ploting_id').notNull().references(() => plotingSiswa.id),
  tanggal: date('tanggal').notNull(),
  waktuMasuk: timestamp('waktu_masuk'),
  waktuKeluar: timestamp('waktu_keluar'),
  status: attendanceStatusEnum('status').notNull().default('HADIR'),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  isWithinRadius: boolean('is_within_radius'),
  jarakMeter: integer('jarak_meter'),
  catatan: text('catatan'),
  fotoMasukUrl: text('foto_masuk_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniquePlotingTanggal: pgUniqueIndex('unique_ploting_tanggal').on(table.plotingId, table.tanggal),
}));

// 6. Jurnal Harian table
export const jurnalHarian = pgTable('jurnal_harian', {
  id: uuid('id').defaultRandom().primaryKey(),
  plotingId: uuid('ploting_id').notNull().references(() => plotingSiswa.id),
  tanggal: date('tanggal').notNull(),
  deskripsiPekerjaan: text('deskripsi_pekerjaan').notNull(),
  fotoKegiatanUrl: text('foto_kegiatan_url'),
  isVerifiedGuru: boolean('is_verified_guru').default(false).notNull(),
  isVerifiedInstruktur: boolean('is_verified_instruktur').default(false).notNull(),
  catatanRevisi: text('catatan_revisi'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  byPlotingTanggal: pgIndex('by_ploting_tanggal').on(table.plotingId, table.tanggal),
}));

// 7. Surats table
export const surats = pgTable('surats', {
  id: uuid('id').defaultRandom().primaryKey(),
  nomorSurat: text('nomor_surat').unique().notNull(),
  jenis: text('jenis').notNull(), // surat_permohonan, mou, sk, surat_tugas
  status: documentStatusEnum('status').notNull().default('DRAFT'),
  tujuan: text('tujuan'),
  isi: text('isi'),
  fileUrl: text('file_url'),
  documentHash: text('document_hash').unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 8. Evaluasi DUDIKA table
export const evaluasiDudika = pgTable('evaluasi_dudika', {
  id: uuid('id').defaultRandom().primaryKey(),
  plotingId: uuid('ploting_id').unique().notNull().references(() => plotingSiswa.id),
  nilaiSoftSkill: integer('nilai_soft_skill').notNull(),
  nilaiHardSkill: integer('nilai_hard_skill').notNull(),
  nilaiAkhir: decimal('nilai_akhir', { precision: 5, scale: 2 }).notNull(),
  predikat: evaluationPredikatEnum('predikat').notNull(),
  catatanPerforma: text('catatan_performa'),
  evaluatedAt: timestamp('evaluated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 9. Sertifikat table
export const sertifikat = pgTable('sertifikat', {
  id: uuid('id').defaultRandom().primaryKey(),
  nomorSertifikat: text('nomor_sertifikat').unique().notNull(),
  plotingId: uuid('ploting_id').notNull().references(() => plotingSiswa.id),
  fileUrl: text('file_url').notNull(),
  documentHash: text('document_hash').unique().notNull(),
  nilaiAkhir: decimal('nilai_akhir', { precision: 5, scale: 2 }).notNull(),
  predikat: evaluationPredikatEnum('predikat').notNull(),
  issuedAt: timestamp('issued_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 10. Audit Logs table
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorId: uuid('actor_id').notNull().references(() => users.id),
  action: text('action').notNull(),
  targetEntity: text('target_entity').notNull(),
  targetId: uuid('target_id'),
  payloadBefore: text('payload_before'),
  payloadAfter: text('payload_after'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  byTarget: pgIndex('by_target_entity_id').on(table.targetEntity, table.targetId),
  byActor: pgIndex('by_actor').on(table.actorId),
}));

// Monitoring Visits & Cases tables (from monitoring-visits spec)
export const kunjunganMonitoring = pgTable('kunjungan_monitoring', {
  id: uuid('id').defaultRandom().primaryKey(),
  plotingId: uuid('ploting_id').notNull().references(() => plotingSiswa.id),
  guruId: uuid('guru_id').notNull().references(() => users.id),
  tanggalKunjungan: date('tanggal_kunjungan').notNull(),
  catatan: text('catatan').notNull(),
  observasi: text('observasi'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const kasusSiswa = pgTable('kasus_siswa', {
  id: uuid('id').defaultRandom().primaryKey(),
  plotingId: uuid('ploting_id').notNull().references(() => plotingSiswa.id),
  guruId: uuid('guru_id').notNull().references(() => users.id),
  deskripsi: text('deskripsi').notNull(),
  tindakan: text('tindakan'),
  severity: caseSeverityEnum('severity').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
