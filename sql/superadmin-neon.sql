-- ============================================================
-- KREDENS — Membuat akun SUPERADMIN di Neon (PostgreSQL)
-- ============================================================
-- Cara pakai:
--   1. Buka Neon Console -> pilih project -> tab "SQL Editor"
--   2. Tempel seluruh isi file ini -> Run
--   3. Login ke aplikasi:
--        Email    : superadmin@kredens.go.id
--        Password : kredens123
--
-- Catatan:
-- - Idempoten: aman dijalankan berulang (ON CONFLICT email).
-- - Bila akun dengan email tsb sudah ada, role/aktif/sandi akan
--   disesuaikan kembali ke nilai di bawah (sandi di-reset ke
--   kredens123). Setelah login, ganti sandi lewat menu "Akun Saya".
-- - Hash password memakai format aplikasi: scrypt:<salt hex>:<hash hex>
--   (scrypt 64 byte, salt 16 byte hex) — identik dengan hashPassword()
--   di src/lib/password.ts, sehingga login langsung berhasil.
-- ============================================================

INSERT INTO "User" (
  "id",
  "email",
  "passwordHash",
  "nama",
  "role",
  "nip",
  "jabatan",
  "instansi",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  'superadmin-kredens-001',
  'superadmin@kredens.go.id',
  'scrypt:1a5afd0eb231917244eb06d64128a692:728c32890f4f9b67daeb342c848eabdd58c1eec347250947221287be90679813be504457b1dd010c6af7b4a6ac2f5b61f73237cbe37622b9f63ae46577aba7eb',
  'Super Administrator',
  'SUPERADMIN',
  NULL,
  'Administrator Sistem',
  'Dinas Kesehatan Kubar',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO UPDATE SET
  "role"         = 'SUPERADMIN',
  "isActive"     = true,
  "passwordHash" = EXCLUDED."passwordHash",
  "updatedAt"    = CURRENT_TIMESTAMP;

-- Verifikasi: harus muncul 1 baris dengan role SUPERADMIN
SELECT "id", "email", "nama", "role", "jabatan", "instansi", "isActive"
FROM "User"
WHERE "email" = 'superadmin@kredens.go.id';
