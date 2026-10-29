import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardAsesi } from '@/components/kredens/dashboard-asesi'
import { DashboardPlaceholder } from '@/components/kredens/dashboard-placeholder'
import { DashboardStaf } from '@/components/kredens/staf/dashboard-staf'
import { db } from '@/lib/db'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  // Superadmin: panel staf lengkap dengan seluruh data + kartu kelola akun
  if (session.user.role !== 'ASESI') {
    const modulSiap = [
      'OPERATOR_KREDENSIAL',
      'ASESOR',
      'MITRA_BESTARI',
      'KETUA_TIM_KREDENSIAL',
      'KEPALA_DINAS_KESEHATAN',
      'PIMPINAN_FASYANKES',
      'SUPERADMIN',
    ]
    if (!modulSiap.includes(session.user.role)) {
      return <DashboardPlaceholder role={session.user.role} nama={session.user.name ?? ''} />
    }

    const pengajuanList = await db.pengajuan.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        user: { select: { nama: true, nip: true } },
        kewenangan: true,
      },
      // Asesor hanya mengerjakan pengajuan yang ditugaskan Operator kepadanya
      // (salah satu dari tepat tiga asesor penilai).
      ...(session.user.role === 'ASESOR'
        ? { where: { penugasanAsesor: { some: { asesorId: session.user.id } } } }
        : {}),
    })
    const akunMenunggu =
      session.user.role === 'OPERATOR_KREDENSIAL' || session.user.role === 'SUPERADMIN'
        ? await db.user.count({ where: { isActive: false } })
        : 0
    // Logbook bulanan yang menunggu verifikasi pimpinan fasyankes
    // (pimpinan hanya menerima laporan asesi fasyankesnya sendiri).
    let logbookMenunggu = 0
    if (session.user.role === 'PIMPINAN_FASYANKES' || session.user.role === 'SUPERADMIN') {
      const me = await db.user.findUnique({
        where: { id: session.user.id },
        select: { instansi: true },
      })
      const instansi = me?.instansi?.trim()
      logbookMenunggu = await db.logbookBulanan.count({
        where: {
          status: 'DIAJUKAN',
          ...(session.user.role === 'PIMPINAN_FASYANKES' && instansi
            ? { pengajuan: { fasyankes: instansi } }
            : {}),
        },
      })
    }
    return (
      <DashboardStaf
        role={session.user.role}
        nama={session.user.name ?? ''}
        pengajuanList={pengajuanList}
        akunMenunggu={akunMenunggu}
        logbookMenunggu={logbookMenunggu}
      />
    )
  }

  const [pengajuanList, profile] = await Promise.all([
    db.pengajuan.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        kewenangan: true,
        jadwal: { orderBy: { tanggal: 'asc' } },
      },
    }),
    db.asesiProfile.findUnique({
      where: { userId: session.user.id },
      include: { pendidikan: true, pengalaman: true, pelatihan: true },
    }),
  ])

  const biodataLengkap = (() => {
    if (!profile) return 0
    const fields = [
      profile.namaLengkapGelar,
      profile.tempatLahir,
      profile.tanggalLahir,
      profile.nik,
      profile.jenisProfesi,
      profile.levelKompetensi,
      profile.jenisKelamin,
      profile.alamat,
      profile.telepon,
      profile.statusKepegawaian,
      profile.jenjangJabatan,
      profile.tempatBekerja,
    ]
    const filled = fields.filter(Boolean).length
    const tables =
      (profile.pendidikan.length > 0 ? 1 : 0) +
      (profile.pengalaman.length > 0 ? 1 : 0) +
      (profile.pelatihan.length > 0 ? 1 : 0)
    return Math.round(((filled / fields.length) * 0.7 + (tables / 3) * 0.3) * 100)
  })()

  return (
    <DashboardAsesi
      pengajuanList={pengajuanList}
      biodataLengkap={biodataLengkap}
      nama={session.user.name ?? ''}
      peranEkstra={session.user.peranEkstra ?? null}
    />
  )
}
