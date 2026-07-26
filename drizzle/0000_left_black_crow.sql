CREATE TYPE "public"."attendance_status" AS ENUM('HADIR', 'IZIN', 'SAKIT', 'ALPHA');--> statement-breakpoint
CREATE TYPE "public"."case_severity" AS ENUM('ringan', 'sedang', 'berat');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ISSUED');--> statement-breakpoint
CREATE TYPE "public"."evaluation_predikat" AS ENUM('A', 'B', 'C');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN_TU', 'WAKA_HUBIN', 'KAPROGLI', 'GURU_PEMBIMBING', 'SISWA', 'INSTRUKTUR_DUDIKA');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" text NOT NULL,
	"target_entity" text NOT NULL,
	"target_id" uuid,
	"payload_before" text,
	"payload_after" text,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dudika" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nama_perusahaan" text NOT NULL,
	"alamat" text NOT NULL,
	"latitude" numeric(10, 8) NOT NULL,
	"longitude" numeric(11, 8) NOT NULL,
	"radius_meter" integer DEFAULT 100 NOT NULL,
	"nama_penanggung_jawab" text,
	"contact_person_phone" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evaluasi_dudika" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ploting_id" uuid NOT NULL,
	"nilai_soft_skill" integer NOT NULL,
	"nilai_hard_skill" integer NOT NULL,
	"nilai_akhir" numeric(5, 2) NOT NULL,
	"predikat" "evaluation_predikat" NOT NULL,
	"catatan_performa" text,
	"evaluated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "evaluasi_dudika_ploting_id_unique" UNIQUE("ploting_id")
);
--> statement-breakpoint
CREATE TABLE "jurnal_harian" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ploting_id" uuid NOT NULL,
	"tanggal" date NOT NULL,
	"deskripsi_pekerjaan" text NOT NULL,
	"foto_kegiatan_url" text,
	"is_verified_guru" boolean DEFAULT false NOT NULL,
	"is_verified_instruktur" boolean DEFAULT false NOT NULL,
	"catatan_revisi" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kasus_siswa" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ploting_id" uuid NOT NULL,
	"guru_id" uuid NOT NULL,
	"deskripsi" text NOT NULL,
	"tindakan" text,
	"severity" "case_severity" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kunjungan_monitoring" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ploting_id" uuid NOT NULL,
	"guru_id" uuid NOT NULL,
	"tanggal_kunjungan" date NOT NULL,
	"catatan" text NOT NULL,
	"observasi" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kuota_dudika" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dudika_id" uuid NOT NULL,
	"jurusan" text NOT NULL,
	"tahun_ajaran" text NOT NULL,
	"jumlah_kuota" integer NOT NULL,
	"terpakai" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ploting_siswa" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"siswa_user_id" uuid NOT NULL,
	"dudika_id" uuid NOT NULL,
	"guru_pembimbing_id" uuid NOT NULL,
	"instruktur_id" uuid,
	"tanggal_mulai" date NOT NULL,
	"tanggal_selesai" date NOT NULL,
	"status_aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "presensi" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ploting_id" uuid NOT NULL,
	"tanggal" date NOT NULL,
	"waktu_masuk" timestamp,
	"waktu_keluar" timestamp,
	"status" "attendance_status" DEFAULT 'HADIR' NOT NULL,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"is_within_radius" boolean,
	"jarak_meter" integer,
	"catatan" text,
	"foto_masuk_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sertifikat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nomor_sertifikat" text NOT NULL,
	"ploting_id" uuid NOT NULL,
	"file_url" text NOT NULL,
	"document_hash" text NOT NULL,
	"nilai_akhir" numeric(5, 2) NOT NULL,
	"predikat" "evaluation_predikat" NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sertifikat_nomor_sertifikat_unique" UNIQUE("nomor_sertifikat"),
	CONSTRAINT "sertifikat_document_hash_unique" UNIQUE("document_hash")
);
--> statement-breakpoint
CREATE TABLE "surats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nomor_surat" text NOT NULL,
	"jenis" text NOT NULL,
	"status" "document_status" DEFAULT 'DRAFT' NOT NULL,
	"tujuan" text,
	"isi" text,
	"file_url" text,
	"document_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "surats_nomor_surat_unique" UNIQUE("nomor_surat"),
	CONSTRAINT "surats_document_hash_unique" UNIQUE("document_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" NOT NULL,
	"nama_lengkap" text NOT NULL,
	"nisn" text,
	"nip" text,
	"dudika_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluasi_dudika" ADD CONSTRAINT "evaluasi_dudika_ploting_id_ploting_siswa_id_fk" FOREIGN KEY ("ploting_id") REFERENCES "public"."ploting_siswa"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jurnal_harian" ADD CONSTRAINT "jurnal_harian_ploting_id_ploting_siswa_id_fk" FOREIGN KEY ("ploting_id") REFERENCES "public"."ploting_siswa"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kasus_siswa" ADD CONSTRAINT "kasus_siswa_ploting_id_ploting_siswa_id_fk" FOREIGN KEY ("ploting_id") REFERENCES "public"."ploting_siswa"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kasus_siswa" ADD CONSTRAINT "kasus_siswa_guru_id_users_id_fk" FOREIGN KEY ("guru_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kunjungan_monitoring" ADD CONSTRAINT "kunjungan_monitoring_ploting_id_ploting_siswa_id_fk" FOREIGN KEY ("ploting_id") REFERENCES "public"."ploting_siswa"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kunjungan_monitoring" ADD CONSTRAINT "kunjungan_monitoring_guru_id_users_id_fk" FOREIGN KEY ("guru_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kuota_dudika" ADD CONSTRAINT "kuota_dudika_dudika_id_dudika_id_fk" FOREIGN KEY ("dudika_id") REFERENCES "public"."dudika"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ploting_siswa" ADD CONSTRAINT "ploting_siswa_siswa_user_id_users_id_fk" FOREIGN KEY ("siswa_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ploting_siswa" ADD CONSTRAINT "ploting_siswa_dudika_id_dudika_id_fk" FOREIGN KEY ("dudika_id") REFERENCES "public"."dudika"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ploting_siswa" ADD CONSTRAINT "ploting_siswa_guru_pembimbing_id_users_id_fk" FOREIGN KEY ("guru_pembimbing_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ploting_siswa" ADD CONSTRAINT "ploting_siswa_instruktur_id_users_id_fk" FOREIGN KEY ("instruktur_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presensi" ADD CONSTRAINT "presensi_ploting_id_ploting_siswa_id_fk" FOREIGN KEY ("ploting_id") REFERENCES "public"."ploting_siswa"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sertifikat" ADD CONSTRAINT "sertifikat_ploting_id_ploting_siswa_id_fk" FOREIGN KEY ("ploting_id") REFERENCES "public"."ploting_siswa"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_dudika_id_dudika_id_fk" FOREIGN KEY ("dudika_id") REFERENCES "public"."dudika"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "by_target_entity_id" ON "audit_logs" USING btree ("target_entity","target_id");--> statement-breakpoint
CREATE INDEX "by_actor" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "by_ploting_tanggal" ON "jurnal_harian" USING btree ("ploting_id","tanggal");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_dudika_jurusan_tahun" ON "kuota_dudika" USING btree ("dudika_id","jurusan","tahun_ajaran");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_ploting_tanggal" ON "presensi" USING btree ("ploting_id","tanggal");