// ============================================================
// KREDENS — Pemilih skema Prisma otomatis
// ------------------------------------------------------------
// Menentukan skema Prisma yang dipakai saat `prisma generate`:
//  - DATABASE_URL berawalan "postgresql"/"postgres"  → schema.postgres.prisma (Neon/produksi)
//  - selain itu (mis. file:./db/custom.db)           → schema.prisma (SQLite/pratinjau lokal)
// Dijalankan otomatis lewat hook "postinstall" sehingga build
// Vercel selalu menghasilkan Prisma Client yang cocok dengan
// DATABASE_URL yang diatur di Environment Variables.
// ============================================================
import { execSync } from 'node:child_process'

const url = (process.env.DATABASE_URL ?? '').trim().toLowerCase()
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV != null
const isPostgres =
  isVercel ||
  url.startsWith('postgresql') ||
  url.startsWith('postgres')
const schema = isPostgres ? 'prisma/schema.postgres.prisma' : 'prisma/schema.prisma'

console.log(`[prisma-generate] ${isPostgres ? 'Target PostgreSQL/Vercel terdeteksi' : 'Target lokal (SQLite)'} → menggunakan ${schema}`)
execSync(`npx prisma generate --schema ${schema}`, { stdio: 'inherit' })
