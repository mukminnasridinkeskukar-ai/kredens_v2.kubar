// ============================================================
// KREDENS — Build untuk Vercel (dipanggil oleh Build Command)
// ------------------------------------------------------------
// Build Command di Vercel:
//   if [ -f scripts/vercel-build.mjs ]; then node scripts/vercel-build.mjs; else npx prisma generate --schema prisma/schema.postgres.prisma && npx next build; fi
//
// Skrip ini:
//   1. Memilih skema Prisma sesuai target (Vercel/Neon → PostgreSQL, lokal → SQLite)
//   2. Menjalankan `prisma generate`
//   3. Menjalankan `next build`
// Keluar dengan kode error asli bila ada langkah yang gagal.
// ============================================================
import { execSync } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'

const url = (process.env.DATABASE_URL ?? '').trim().toLowerCase()
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV != null
const isPostgres = isVercel || url.startsWith('postgresql') || url.startsWith('postgres')
const schema = isPostgres ? 'prisma/schema.postgres.prisma' : 'prisma/schema.prisma'

console.log('=========================================================')
console.log('[vercel-build] Node      :', process.version)
console.log('[vercel-build] Vercel    :', isVercel ? 'ya' : 'tidak')
console.log('[vercel-build] Target DB :', isPostgres ? 'PostgreSQL (Neon/produksi)' : 'SQLite (lokal)')
console.log('[vercel-build] Skema     :', schema)
console.log('[vercel-build] proxy.ts  :', existsSync('src/proxy.ts') ? 'ada ✔' : 'TIDAK ADA ✘')
console.log('=========================================================')

// --- Pembersih anti-bentrok (v1.2.3) -------------------------------------
// Sejak Next.js 16, konvensi middleware diganti nama menjadi proxy.
// Bila file lama `middleware.ts` (sisa upload sebelumnya) masih ada
// bersama `proxy.ts`, next build GAGAL dengan error:
//   "Both middleware file ... and proxy file ... are detected"
// Upload lewat web GitHub tidak pernah menghapus file lama, jadi di sini
// file sisa itu dibersihkan otomatis sebelum build.
const proksiAda = existsSync('src/proxy.ts') || existsSync('proxy.ts')
const sisaLama = [
  'src/middleware.ts',
  'middleware.ts',
  'src/middleware.js',
  'middleware.js',
]
for (const berkas of sisaLama) {
  if (existsSync(berkas)) {
    if (proksiAda) {
      rmSync(berkas)
      console.warn(`[vercel-build] ⚠  File sisa "${berkas}" dihapus otomatis (bentrok dengan proxy.ts — konvensi Next.js 16).`)
      console.warn('[vercel-build]    Disarankan juga menghapusnya di repo GitHub agar bersih permanen.')
    } else {
      console.warn(`[vercel-build] ℹ  "${berkas}" terdeteksi tanpa proxy.ts — dibiarkan sebagai middleware.`)
    }
  }
}
// ------------------------------------------------------------------------

function jalan(cmd, label) {
  console.log(`\n[vercel-build] > ${label}`)
  execSync(cmd, { stdio: 'inherit' })
}

// 1) Prisma Client sesuai skema target
try {
  jalan(`npx prisma generate --schema ${schema}`, 'prisma generate')
} catch (e) {
  console.error('[vercel-build] prisma generate gagal, mencoba ulang dengan --yes ...')
  jalan(`npx --yes prisma generate --schema ${schema}`, 'prisma generate (ulang)')
}

// 2) Build Next.js — Vercel menangani output standalone secara otomatis
jalan('npx next build', 'next build')

console.log('\n[vercel-build] Build selesai tanpa error ✔')
