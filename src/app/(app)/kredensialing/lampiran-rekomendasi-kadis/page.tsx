import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ReadOnlyEmpty, ReadOnlyBanner } from '@/components/kredens/read-only'
import { formatTanggal } from '@/lib/format'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PengajuanPicker } from '@/components/kredens/pengajuan-picker'

export default async function LampiranRekomKadisPage({
  searchParams,
}: {
  searchParams: Promise<{ pengajuan?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  const { pengajuan: pilihan } = await searchParams

  const daftarPengajuan = await db.pengajuan.findMany({
    where: { userId: session.user.id, status: { notIn: ['DRAFT'] } },
    orderBy: { submittedAt: 'desc' },
    select: { id: true, kode: true, jenis: true, status: true },
  })

  const terpilihId =
    (pilihan && daftarPengajuan.find((p) => p.id === pilihan)?.id) ??
    daftarPengajuan[0]?.id

  const pengajuan = terpilihId
    ? await db.pengajuan.findFirst({
        where: { id: terpilihId, userId: session.user.id },
        include: { rekomendasiKadis: true, user: true, spk: true },
      })
    : null

  const rk = pengajuan?.rekomendasiKadis

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lampiran Rekomendasi Kadis</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Daftar Ketetapan Kewenangan Klinis Tenaga Kesehatan — lampiran surat rekomendasi
          Kepala Dinas Kesehatan.
        </p>
      </div>

      <ReadOnlyBanner text="Halaman ini bersifat hanya-lihat (read-only). Lampiran diterbitkan bersama surat rekomendasi oleh Dinas Kesehatan." />

      <PengajuanPicker
        options={daftarPengajuan}
        selectedId={terpilihId ?? ''}
        basePath="/kredensialing/lampiran-rekomendasi-kadis"
      />

      {!pengajuan || !rk ? (
        <ReadOnlyEmpty
          title="Lampiran belum tersedia"
          description="Lampiran daftar ketetapan akan muncul bersama dengan Surat Rekomendasi Kepala Dinas Kesehatan pada tahap KETETAPAN KADIS."
        />
      ) : (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-lg">Lampiran Surat</CardTitle>
            <CardDescription>
              Nomor: <span className="font-mono font-semibold text-foreground">{rk.nomorSurat ?? '—'}</span>{' '}
              · Tanggal: {rk.tanggalSurat ? formatTanggal(rk.tanggalSurat) : '—'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-1 text-center text-sm font-semibold">
              Daftar Ketetapan Kewenangan Klinis Tenaga Kesehatan
            </p>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              di {rk.tujuanUptd ?? rk.tempat ?? '—'}
            </p>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead rowSpan={2} className="align-middle">No</TableHead>
                    <TableHead rowSpan={2} className="align-middle">Nama Tenaga Kesehatan</TableHead>
                    <TableHead rowSpan={2} className="align-middle">NIP/NIK</TableHead>
                    <TableHead colSpan={3} className="text-center">Ketetapan Kewenangan Klinis</TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead>Nomor</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Berlaku Sampai</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>1</TableCell>
                    <TableCell className="font-medium">
                      {pengajuan.user?.nama ?? session.user.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {pengajuan.user?.nip ?? '—'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{rk.ketetapanNomor ?? '—'}</TableCell>
                    <TableCell>
                      {rk.ketetapanTanggal ? formatTanggal(rk.ketetapanTanggal) : '—'}
                    </TableCell>
                    <TableCell>
                      {rk.ketetapanBerlakuSampai ? formatTanggal(rk.ketetapanBerlakuSampai) : '—'}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Ketetapan menjadi dasar penerbitan Surat Penugasan Klinis oleh Kepala UPTD tempat
              tenaga kesehatan bertugas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
