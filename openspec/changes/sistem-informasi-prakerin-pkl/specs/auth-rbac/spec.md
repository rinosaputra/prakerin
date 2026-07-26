## ADDED Requirements

### Requirement: Multi-Role Authentication via JWT
Sistem HARUS mengautentikasi pengguna menggunakan JSON Web Token (JWT) yang divalidasi pada Next.js Middleware sebelum permintaan mencapai layer rendering page atau API handler.

#### Scenario: User login successfully with valid credentials
- **WHEN** user mengirimkan email dan password melalui halaman login
- **THEN** sistem memverifikasi kredensial dan menerbitkan JWT session cookie dengan payload berisi `role` dan `sub` (user ID)

#### Scenario: Unauthenticated user is redirected to login
- **WHEN** user mengakses halaman `/dashboard/*` tanpa session token
- **THEN** middleware mengalihkan user ke `/login`

#### Scenario: Expired token redirects to login
- **WHEN** user mengakses halaman dengan JWT yang sudah kadaluarsa
- **THEN** middleware merespons redirect ke `/login`

### Requirement: Role-Based Access Control via Middleware
Sistem HARUS membatasi akses route berdasarkan peran pengguna melalui pattern matching di Next.js Middleware menggunakan regex pada setiap role.

#### Scenario: Admin TU can access /dashboard/tu routes
- **WHEN** pengguna dengan role `ADMIN_TU` mengakses `/dashboard/tu/dudika`
- **THEN** middleware mengizinkan akses

#### Scenario: Siswa cannot access /dashboard/guru routes
- **WHEN** pengguna dengan role `SISWA` mengakses `/dashboard/guru/verifikasi-jurnal`
- **THEN** middleware mengalihkan ke `/unauthorized`

#### Scenario: Instruktur DUDIKA cannot access /dashboard/kaprogli routes
- **WHEN** pengguna dengan role `INSTRUKTUR_DUDIKA` mengakses `/dashboard/kaprogli/ploting`
- **THEN** middleware mengalihkan ke `/unauthorized`

#### Scenario: Each role has one allowed dashboard prefix
- **WHEN** semua 6 role (`ADMIN_TU`, `WAKA_HUBIN`, `KAPROGLI`, `GURU_PEMBIMBING`, `SISWA`, `INSTRUKTUR_DUDIKA`) mengakses dashboard mereka masing-masing
- **THEN** setiap role hanya dapat mengakses path sesuai pattern `ROLE_PATTERNS` yang telah didefinisikan

### Requirement: Frictionless Magic Link Authentication for Instruktur DUDIKA
Sistem HARUS menyediakan autentikasi tanpa kata sandi untuk Instruktur DUDIKA menggunakan One-Time Token (Magic Link) berbasis Vercel KV.

#### Scenario: Magic link is generated and sent to instruktur
- **WHEN** Kaprogli atau Admin TU memicu generasi token evaluasi
- **THEN** sistem menghasilkan cryptographic token menggunakan `crypto.randomBytes(32).toString('hex')`, menyimpannya di Vercel KV dengan key `token:dudika:<token_hash>` dan TTL 72 jam, kemudian mengirim tautan ke instruktur

#### Scenario: Instruktur clicks valid magic link
- **WHEN** instruktur mengklik tautan `https://pkl.smk.sch.id/dudika/evaluasi?token=<valid_token>`
- **THEN** middleware memvalidasi token di Vercel KV, menerbitkan Ephemeral Session Cookie JWT dengan Max-Age 4 jam, dan mengarahkan instruktur ke Form Evaluasi Kinerja

#### Scenario: Instruktur clicks expired or invalid magic link
- **WHEN** instruktur mengklik tautan dengan token yang sudah kadaluarsa (> 72 jam) atau tidak ditemukan
- **THEN** sistem menampilkan halaman penolakan akses

#### Scenario: Single-use token invalidation after evaluation submission
- **WHEN** instruktur menyelesaikan pengisian evaluasi dan menekan tombol simpan
- **THEN** sistem secara otomatis menghapus token dari Vercel KV untuk mencegah manipulasi nilai berulang

#### Scenario: Rate limiting prevents brute-force magic link attempts
- **WHEN** user mencoba 6 kali akses magic link yang tidak valid dalam 1 menit
- **THEN** sistem menerapkan rate limiting dan menolak percobaan ke-6 dengan status HTTP 429
