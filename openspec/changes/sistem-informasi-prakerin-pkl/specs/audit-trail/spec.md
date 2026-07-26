## ADDED Requirements

### Requirement: Immutable Audit Logging for Sensitive Actions
Sistem HARUS mencatat setiap tindakan sensitif ke tabel `audit_logs` secara imutabel (append-only) untuk menjaga kepatuhan dan akuntabilitas.

#### Scenario: Student evaluation score change is logged
- **WHEN** Instruktur DUDIKA mengubah nilai soft skill atau hard skill siswa
- **THEN** sistem mencatat ke audit_logs dengan `actor_id`, `action` = 'UPDATE_EVALUASI', `target_entity` = 'evaluasi_dudika', `target_id` (ploting_id), `payload_before` (nilai lama), dan `payload_after` (nilai baru)

#### Scenario: Certificate generation is logged
- **WHEN** Admin TU menerbitkan sertifikat PKL untuk siswa
- **THEN** sistem mencatat ke audit_logs dengan `action` = 'ISSUE_CERTIFICATE' dan payload_after berisi nomor_sertifikat yang terbit

#### Scenario: Quota modification is logged
- **WHEN** Waka Hubin mengubah kuota penerimaan siswa di DUDIKA tertentu
- **THEN** sistem mencatat ke audit_logs dengan `action` = 'UPDATE_KUOTA', `target_entity` = 'kuota_dudika', dan payload_before/after mencerminkan perubahan jumlah

#### Scenario: Audit logs are queryable by target entity and ID
- **WHEN** administrator membuka halaman riwayat audit
- **THEN** sistem menampilkan log yang diurutkan berdasarkan `target_entity` dan `target_id` menggunakan compound index pada kolom tersebut
