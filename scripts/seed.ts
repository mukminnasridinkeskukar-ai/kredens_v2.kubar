/**
 * Seed data demo KREDENS (manual, untuk pengembangan lokal).
 * Jalankan: bun run seed   (atau: npx tsx scripts/seed.ts)
 *
 * Logika seed berada di src/lib/seed-demo.ts — satu sumber yang sama
 * dengan auto-setup produksi (GET /api/setup atau login pertama).
 */
import { db } from '../src/lib/db'
import { seedDemo, backfillSandiTersimpan } from '../src/lib/seed-demo'

async function main() {
  console.log('Seeding KREDENS demo data...')
  const hasil = await seedDemo()
  console.log(`- ${hasil.akun} akun role dibuat/diperbarui (sandi: kredens123)`)
  console.log(`- Pengajuan demo baru: ${hasil.pengajuanBaru.join(', ') || '(tidak ada — sudah pernah diisi)'}`)
  const bf = await backfillSandiTersimpan()
  console.log(`- Salinan sandi demo diisi untuk ${bf.diisi} akun lama (v1.3.0)`)
  console.log('Seed selesai.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
