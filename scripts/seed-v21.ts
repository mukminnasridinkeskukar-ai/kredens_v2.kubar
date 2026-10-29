/**
 * v2.1 — pembaruan data demo lokal (SQLite sandbox) untuk fitur:
 *  1) fungsi tambahan akun, 2) ketua tim per profesi, 3) anggota tim 1–3.
 * Idempoten: aman dijalankan berulang.
 * Jalankan: bun scripts/seed-v21.ts
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  // 1) Ketua tim kredensial Dokter
  await db.user.update({
    where: { email: 'ketuatim@kredens.go.id' },
    data: { profesi: 'Dokter' },
  })
  console.log('ketuatim@ → profesi Dokter')

  // 2) Ketua tim kredensial Perawat (demo pembagian profesi)
  await db.user.upsert({
    where: { email: 'ketuatim.perawat@kredens.go.id' },
    update: { profesi: 'Perawat' },
    create: {
      email: 'ketuatim.perawat@kredens.go.id',
      nama: 'Ns. Dewi Sartika, M.Kep',
      role: 'KETUA_TIM_KREDENSIAL',
      profesi: 'Perawat',
      nip: '198203072008012005',
      jabatan: 'Ketua Tim Kredensial Perawat',
      instansi: 'Dinas Kesehatan Kubar',
      passwordHash: '$scrypt$demo-placeholder', // diganti di bawah bila akun baru
    },
  })
  console.log('ketuatim.perawat@ tersedia')

  // 3) Asesi demo diberi fungsi tambahan (contoh multi-fungsi)
  await db.user.update({
    where: { email: 'asesi@kredens.go.id' },
    data: { peranEkstra: 'ASESOR,PIMPINAN_FASYANKES' },
  })
  console.log('asesi@ → fungsi tambahan ASESOR + PIMPINAN_FASYANKES')

  // 4) Rekomendasi tim demo dilengkapi anggota 2 & 3
  const rt = await db.rekomendasiTim.findUnique({
    where: { pengajuanId: (await db.pengajuan.findUnique({ where: { kode: 'KR-2025-1001' }, select: { id: true } }))!.id },
  })
  if (rt && (!rt.anggotaNama2 || !rt.anggotaNama3)) {
    await db.rekomendasiTim.update({
      where: { id: rt.id },
      data: {
        anggotaNama2: rt.anggotaNama2 ?? 'Ns. Budi Santoso, S.Kep',
        anggotaNama3: rt.anggotaNama3 ?? 'dr. Amelia Putri',
      },
    })
    console.log('RekomendasiTim KR-2025-1001 → anggota 2 & 3 diisi')
  } else {
    console.log('RekomendasiTim KR-2025-1001 sudah lengkap')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
