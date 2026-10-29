import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/role-guard'
import { DetailStaf, RiwayatStaf, KartuAsesorPenilai } from '@/components/kredens/staf/detail-staf'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Rincian Pengajuan — KREDENS' }

/**
 * Akses penuh data (2/2): rincian lengkap satu pengajuan apa pun, apa pun
 * status dan pemiliknya — tampilan baca-saja. Aksi proses tetap dilakukan
 * melalui modul staf per tahap (Verifikasi Berkas, Penilaian, dst.).
 */
export default async function SemuaDataDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getAuthSession()
  if (session.role !== 'SUPERADMIN') redirect('/dashboard')
  const { id } = await params

  const p = await db.pengajuan.findUnique({
    where: { id },
    include: {
      user: { select: { nama: true, nip: true, jabatan: true, email: true } },
      formulir: true,
      kewenangan: { orderBy: { urutan: 'asc' } },
      riwayat: { orderBy: { createdAt: 'asc' } },
      rekomendasiTim: true,
      rekomendasiKadis: true,
      spk: true,
      penugasanAsesor: {
        orderBy: { createdAt: 'asc' },
        include: {
          asesor: { select: { id: true, nama: true, email: true, jabatan: true, instansi: true } },
        },
      },
    },
  })
  if (!p) notFound()

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Rincian Pengajuan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tampilan baca-saja seluruh isi pengajuan: biodata singkat, formulir, rincian kewenangan
            klinis, hingga dokumen hasil proses.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/semua-data">
            <ArrowLeft className="h-4 w-4" /> Kembali ke daftar
          </Link>
        </Button>
      </div>

      <DetailStaf p={p} />

      <KartuAsesorPenilai penugasan={p.penugasanAsesor} />

      <RiwayatStaf riwayat={p.riwayat} />
    </div>
  )
}
