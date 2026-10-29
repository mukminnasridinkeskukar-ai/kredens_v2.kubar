import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { requirePageRole } from '@/lib/role-guard'
import { DetailStaf, RiwayatStaf, KartuAsesorPenilai } from '@/components/kredens/staf/detail-staf'
import { StatusAksi } from '@/components/kredens/staf/status-aksi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function OperatorVerifikasiDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePageRole(['OPERATOR_KREDENSIAL'])
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

  // Daftar asesor aktif untuk dialog penetapan tiga asesor penilai.
  // v2.1 — mencakup juga akun yang menjalankan fungsi ASESOR sebagai fungsi
  // tambahan (peranEkstra), bukan hanya peran utama ASESOR.
  const asesorList = await db.user.findMany({
    where: {
      isActive: true,
      OR: [{ role: 'ASESOR' }, { peranEkstra: { contains: 'ASESOR' } }],
    },
    orderBy: { nama: 'asc' },
    select: { id: true, nama: true, email: true, jabatan: true, instansi: true, role: true, peranEkstra: true },
  })

  const aksi =
    p.status === 'DIAJUKAN'
      ? (['MULAI_VERIFIKASI', 'VERIFIKASI_LANJUT', 'KEMBALIKAN_DRAF'] as const)
      : p.status === 'VERIFIKASI'
        ? (['VERIFIKASI_LANJUT', 'KEMBALIKAN_DRAF'] as const)
        : p.status === 'SURAT_PENUGASAN'
          ? (['TANDAI_SELESAI'] as const)
          : null

  const perluPenugasan = p.status === 'DIAJUKAN' || p.status === 'VERIFIKASI'

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Telaah Berkas Pengajuan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verifikasi kelengkapan dokumen sebelum meneruskan ke tim kredensial. Berkas yang lolos
          wajib ditetapkan ke <span className="font-semibold">tiga asesor penilai</span>.
        </p>
      </div>

      <DetailStaf p={p} />

      {(p.status !== 'DIAJUKAN' && p.status !== 'DRAFT') && (
        <KartuAsesorPenilai penugasan={p.penugasanAsesor} />
      )}

      {aksi && (
        <Card>
          <CardHeader>
            <CardTitle>Aksi Operator</CardTitle>
            <CardDescription>
              {p.status === 'DIAJUKAN' &&
                'Mulai verifikasi untuk menandai berkas sedang diperiksa, atau langsung menyetujui bila kelengkapan sudah terlihat jelas. Saat meneruskan, Anda akan diminta menetapkan tiga asesor penilai.'}
              {p.status === 'VERIFIKASI' &&
                'Tetapkan hasil verifikasi: lolos ke penilaian tim dengan menetapkan tiga asesor penilai, atau kembalikan ke asesi untuk dilengkapi.'}
              {p.status === 'SURAT_PENUGASAN' &&
                'SPK sudah diterbitkan Pimpinan Fasyankes. Tandai proses kredensial selesai setelah memastikan seluruh dokumen terbit.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StatusAksi
              pengajuanId={p.id}
              aksiList={[...aksi]}
              asesorList={perluPenugasan ? asesorList : []}
            />
          </CardContent>
        </Card>
      )}

      <RiwayatStaf riwayat={p.riwayat} />
    </div>
  )
}
