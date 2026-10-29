import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ReadOnlyEmpty, ReadOnlyBanner } from '@/components/kredens/read-only'
import { DokumenUnduh } from '@/components/kredens/dokumen-unduh'
import { formatTanggal } from '@/lib/format'
import { KODE_REKOMENDASI } from '@/lib/constants'
import { Badge } from '@/components/ui/badge'
import { PengajuanPicker } from '@/components/kredens/pengajuan-picker'

export default async function RKKPage({
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
        include: {
          kewenangan: { orderBy: { urutan: 'asc' } },
          rekomendasiTim: true,
          dokumen: {
            where: { jenis: 'RKK' },
            select: {
              id: true,
              namaFile: true,
              tipeFile: true,
              ukuran: true,
              diunggahOleh: true,
              createdAt: true,
            },
          },
        },
      })
    : null

  const rt = pengajuan?.rekomendasiTim
  const dokumenRkk = pengajuan?.dokumen?.[0] ?? null
  const disetujui = pengajuan?.kewenangan.filter((k) => k.kodeRekomendasi === '1' || k.kodeRekomendasi === '2') ?? []

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rincian Kewenangan Klinis (RKK)</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kewenangan klinis final yang ditetapkan berdasarkan hasil rekomendasi tim kredensial.
        </p>
      </div>

      <ReadOnlyBanner text="Halaman ini bersifat hanya-lihat (read-only). RKK final merupakan hasil ketetapan tim kredensial dan Kepala Dinas Kesehatan." />

      <PengajuanPicker
        options={daftarPengajuan}
        selectedId={terpilihId ?? ''}
        basePath="/spk-rkk/rkk"
      />

      {!pengajuan || disetujui.length === 0 ? (
        <ReadOnlyEmpty
          title="RKK final belum tersedia"
          description="Rincian Kewenangan Klinis final akan tampil setelah tim kredensial menetapkan rekomendasi kewenangan yang disetujui (kode 1 atau 2)."
        />
      ) : (
        <>
          {dokumenRkk && (
            <DokumenUnduh
              dokumen={dokumenRkk}
              judul="Dokumen Rincian Kewenangan Klinis (Pindaian)"
              keterangan="hasil penetapan tim kredensial"
            />
          )}
          <Card>
            <CardHeader>
              <CardTitle>Kewenangan Klinis Disetujui</CardTitle>
              <CardDescription>
                {disetujui.length} dari {pengajuan.kewenangan.length} kewenangan yang diusulkan
                mendapat persetujuan · Pengajuan {pengajuan.kode}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {disetujui.map((k, i) => (
                <div key={k.id} className="flex items-start gap-3 rounded-xl border p-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-snug">{k.namaKewenangan}</p>
                    {k.kodeRef && (
                      <p className="font-mono text-xs text-muted-foreground">Kode: {k.kodeRef}</p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      k.kodeRekomendasi === '1'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-amber-300 bg-amber-50 text-amber-700'
                    }
                  >
                    {k.kodeRekomendasi === '1' ? 'Berwenang penuh' : 'Dengan supervisi'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Ketetapan */}
          <Card>
            <CardHeader>
              <CardTitle>Ketetapan Kewenangan</CardTitle>
              <CardDescription>Dasar hukum berlakunya kewenangan klinis Anda</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">No. Ketetapan</p>
                <p className="mt-1 break-all font-mono text-sm font-semibold">
                  {rt?.penetapanNomor ?? '—'}
                </p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Tanggal</p>
                <p className="mt-1 text-sm font-semibold">
                  {rt?.penetapanTanggal ? formatTanggal(rt.penetapanTanggal) : '—'}
                </p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Berlaku Sampai</p>
                <p className="mt-1 text-sm font-semibold">
                  {rt?.penetapanBerlakuSampai ? formatTanggal(rt.penetapanBerlakuSampai) : '—'}
                </p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Ditetapkan Oleh</p>
                <p className="mt-1 text-sm font-semibold">Kepala Dinas Kesehatan</p>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Keterangan kode rekomendasi: {Object.entries(KODE_REKOMENDASI).map(([k, v]) => `${k} = ${v}`).join('; ')}.
          </p>
        </>
      )}
    </div>
  )
}
