import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { requirePageRole, sebagaiAsesor, isSuperadmin } from '@/lib/role-guard'
import { DetailStaf, RiwayatStaf, KartuAsesorPenilai } from '@/components/kredens/staf/detail-staf'
import { KewenanganEditor } from '@/components/kredens/staf/kewenangan-editor'

export default async function PenilaianDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requirePageRole(['ASESOR', 'MITRA_BESTARI'])
  const { id } = await params

  const p = await db.pengajuan.findUnique({
    where: { id },
    include: {
      user: { select: { nama: true, nip: true, jabatan: true, email: true } },
      formulir: true,
      kewenangan: { orderBy: { urutan: 'asc' } },
      riwayat: { orderBy: { createdAt: 'asc' } },
      penugasanAsesor: {
        orderBy: { createdAt: 'asc' },
        include: {
          asesor: { select: { id: true, nama: true, email: true, jabatan: true, instansi: true } },
        },
      },
    },
  })
  if (!p) notFound()

  // Asesor (peran utama maupun fungsi tambahan — v2.1) hanya boleh membuka
  // lembar penilaian pengajuan yang ditugaskan kepadanya (salah satu dari
  // tepat tiga asesor yang ditetapkan Operator). Mitra Bestari melihat semua.
  const lihatSemua = user.role === 'MITRA_BESTARI' || isSuperadmin(user.role)
  const ditugaskan = p.penugasanAsesor.some((t) => t.asesorId === user.id)
  if (!lihatSemua && sebagaiAsesor(user) && !ditugaskan) notFound()

  const bisaEdit = p.status === 'PENILAIAN_TIM'

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lembar Penilaian</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {bisaEdit
            ? 'Isi kode rekomendasi untuk setiap kewenangan, lalu simpan. Ketua tim yang akan menetapkan kesimpulan akhir.'
            : 'Pengajuan sudah melewati tahap penilaian — lembar ini hanya-lihat.'}
        </p>
      </div>

      <DetailStaf p={p} />
      <KartuAsesorPenilai penugasan={p.penugasanAsesor} />
      <KewenanganEditor pengajuanId={p.id} baris={p.kewenangan} bisaEdit={bisaEdit} />
      <RiwayatStaf riwayat={p.riwayat} />
    </div>
  )
}
