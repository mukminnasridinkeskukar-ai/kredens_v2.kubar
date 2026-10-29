import { requirePageRole } from '@/lib/role-guard'
import { db } from '@/lib/db'
import { JadwalManager } from '@/components/kredens/staf/jadwal-manager'

export default async function OperatorJadwalPage() {
  await requirePageRole(['OPERATOR_KREDENSIAL'])

  const [jadwalList, pengajuanOptions] = await Promise.all([
    db.jadwalKredensial.findMany({
      orderBy: { tanggal: 'desc' },
      include: { pengajuan: { select: { kode: true } } },
    }),
    db.pengajuan.findMany({
      where: { status: { not: 'DRAFT' } },
      orderBy: { kode: 'asc' },
      select: { id: true, kode: true, user: { select: { nama: true } } },
    }),
  ])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kelola Jadwal Kredensial</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Atur agenda telaah berkas, asesmen, penilaian lapangan, rekomendasi tim, dan ketetapan.
        </p>
      </div>
      <JadwalManager
        jadwalList={jadwalList}
        pengajuanOptions={pengajuanOptions.map((o) => ({
          id: o.id,
          kode: o.kode,
          nama: o.user.nama,
        }))}
      />
    </div>
  )
}
