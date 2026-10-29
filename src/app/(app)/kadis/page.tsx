import { requirePageRole } from '@/lib/role-guard'
import { db } from '@/lib/db'
import { DaftarStaf } from '@/components/kredens/staf/daftar-staf'

export default async function KadisPage() {
  await requirePageRole(['KEPALA_DINAS_KESEHATAN'])

  const daftar = await db.pengajuan.findMany({
    where: { status: { in: ['REKOMENDASI_TIM', 'KETETAPAN_KADIS'] } },
    orderBy: { updatedAt: 'desc' },
    include: { user: { select: { nama: true, nip: true } } },
  })

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rekomendasi & Ketetapan Kewenangan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Terbitkan Surat Rekomendasi Penetapan Kewenangan Klinis beserta lampiran ketetapan untuk
          pengajuan yang telah direkomendasikan tim kredensial.
        </p>
      </div>
      <DaftarStaf
        judul="Pengajuan Menunggu Surat Rekomendasi"
        deskripsi="Surat hanya terbit setelah tim kredensial menetapkan rekomendasi (tahap REKOMENDASI TIM)."
        daftar={daftar}
        detailBase="/kadis"
        kosong="Belum ada pengajuan yang menunggu penerbitan surat rekomendasi."
        hintStatus="REKOMENDASI TIM / KETETAPAN KADIS"
      />
    </div>
  )
}
