import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { requirePageRole } from '@/lib/role-guard'
import { DetailStaf, RiwayatStaf } from '@/components/kredens/staf/detail-staf'
import { RekomendasiKadisForm } from '@/components/kredens/staf/rekomendasi-kadis-form'
import { PrintButton } from '@/components/kredens/print-button'

export default async function KadisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePageRole(['KEPALA_DINAS_KESEHATAN'])
  const { id } = await params

  const p = await db.pengajuan.findUnique({
    where: { id },
    include: {
      user: { select: { nama: true, nip: true, jabatan: true, email: true } },
      formulir: true,
      kewenangan: { orderBy: { urutan: 'asc' } },
      rekomendasiTim: true,
      rekomendasiKadis: true,
      riwayat: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!p) notFound()

  const bisaTerbitkan = p.status === 'REKOMENDASI_TIM'

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Surat Rekomendasi Kepala Dinas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {bisaTerbitkan
              ? 'Isi kelengkapan surat lalu terbitkan. Pengajuan akan diteruskan ke Pimpinan Fasyankes untuk SPK.'
              : 'Surat rekomendasi sudah terbit — data di bawah hanya-lihat.'}
          </p>
        </div>
        {p.rekomendasiKadis && <PrintButton />}
      </div>

      <DetailStaf p={p} />

      {bisaTerbitkan ? (
        <RekomendasiKadisForm
          pengajuanId={p.id}
          awal={p.rekomendasiKadis}
          fasyankes={p.fasyankes}
        />
      ) : (
        p.rekomendasiKadis && (
          <div className="grid gap-3 rounded-xl border p-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['Nomor Surat', p.rekomendasiKadis.nomorSurat],
              ['Tanggal Surat', p.rekomendasiKadis.tanggalSurat],
              ['Sifat', p.rekomendasiKadis.sifat],
              ['Kepada — UPTD', p.rekomendasiKadis.tujuanUptd],
              ['Nomor Ketetapan', p.rekomendasiKadis.ketetapanNomor],
              ['Berlaku Sampai', p.rekomendasiKadis.ketetapanBerlakuSampai],
            ].map(([k, v]) => (
              <div key={k as string} className="rounded-lg border p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {k}
                </p>
                <p className="mt-0.5 text-sm font-medium">{v || '—'}</p>
              </div>
            ))}
          </div>
        )
      )}

      <RiwayatStaf riwayat={p.riwayat} />
    </div>
  )
}
