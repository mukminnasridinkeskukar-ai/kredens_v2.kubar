-- v2.3 — Kolom foto profil akun pada tabel User (Neon PostgreSQL).
-- Aman dijalankan berulang (IF NOT EXISTS). Sama dengan patch pada
-- src/lib/bootstrap-ddl.ts yang juga berjalan otomatis saat boot.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "foto" BYTEA;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "fotoTipe" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "fotoPada" TIMESTAMP(3);
