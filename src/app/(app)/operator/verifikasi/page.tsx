import { requirePageRole } from '@/lib/role-guard'
import { db } from '@/lib/db'
import { DaftarStaf } from '@/components/kredens/staf/daftar-staf'

export default async function OperatorVerifikasiPage() {
  await requirePageRole(['OPERATOR_KREDENSIAL'])

  const daftar = await db.pengajuan.findMany({
    where: { status: { not: 'DRAFT' } },
    orderBy: { updatedAt: 'desc' },
    include: { user: { select: { nama: true, nip: true } } },
  })

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Verifikasi Berkas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Periksa kelengkapan dokumen pengajuan asesi, kemudian teruskan pengajuan yang lolos ke
          penilaian tim kredensial.
        </p>
      </div>
      <DaftarStaf
        judul="Seluruh Pengajuan Masuk"
        daftar={daftar}
        detailBase="/operator/verifikasi"
        kosong="Belum ada pengajuan yang dikirim asesi."
      />
    </div>
  )
}
