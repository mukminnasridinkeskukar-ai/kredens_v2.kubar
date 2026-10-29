import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { ReadOnlyEmpty, ReadOnlyBanner } from '@/components/kredens/read-only'
import { formatTanggal } from '@/lib/format'
import { FileBadge } from 'lucide-react'
import { PengajuanPicker } from '@/components/kredens/pengajuan-picker'

export default async function RekomendasiKadisPage({
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
        include: { rekomendasiKadis: true, user: { select: { nama: true } } },
      })
    : null

  const rk = pengajuan?.rekomendasiKadis

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rekomendasi Kadis</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Surat Rekomendasi Penetapan Kewenangan Klinis dari Kepala Dinas Kesehatan Kabupaten
          Kutai Barat.
        </p>
      </div>

      <ReadOnlyBanner text="Halaman ini bersifat hanya-lihat (read-only). Surat diterbitkan oleh Dinas Kesehatan setelah proses kredensialing selesai." />

      <PengajuanPicker
        options={daftarPengajuan}
        selectedId={terpilihId ?? ''}
        basePath="/kredensialing/rekomendasi-kadis"
      />

      {!pengajuan || !rk ? (
        <ReadOnlyEmpty
          title="Surat rekomendasi belum tersedia"
          description="Surat Rekomendasi Penetapan Kewenangan Klinis akan muncul setelah Kepala Dinas Kesehatan menetapkan hasil rekomendasi tim kredensial atas pengajuan Anda."
        />
      ) : (
        <Card>
          <CardContent className="p-6 sm:p-10">
            {/* Kepala surat */}
            <div className="flex justify-between border-b-4 border-double pb-4">
              <div className="space-y-1 text-sm">
                {[
                  ['Nomor', rk.nomorSurat],
                  ['Sifat', rk.sifat],
                  ['Lampiran', rk.lampiran],
                  ['Hal', rk.hal],
                ].map(([k, v]) => (
                  <p key={k as string}>
                    <span className="inline-block w-24 font-medium text-muted-foreground">{k}</span>
                    <span className="mr-2">:</span>
                    <span className="font-semibold">{v ?? '-'}</span>
                  </p>
                ))}
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold">Sendawar, {rk.tanggalSurat ? formatTanggal(rk.tanggalSurat) : '—'}</p>
                <p className="mt-3">Kepada</p>
                <p className="font-semibold">Yth. Kepala UPTD</p>
                <p>{rk.tujuanUptd ?? '—'}</p>
                <p className="text-muted-foreground">di-{rk.tempat ?? 'Tempat'}</p>
              </div>
            </div>

            {/* Isi */}
            <div className="mt-6 space-y-3 text-sm leading-relaxed">
              <p>
                Sehubungan dengan surat Saudara nomor{' '}
                <span className="font-semibold">{rk.refSuratNomor ?? '…'}</span> tanggal{' '}
                <span className="font-semibold">
                  {rk.refSuratTanggal ? formatTanggal(rk.refSuratTanggal) : '…'}
                </span>{' '}
                hal Permohonan Kredensial Tenaga Medis dan Tenaga Kesehatan{' '}
                {rk.tujuanUptd ?? 'UPTD'}, bersama ini kami sampaikan hal-hal sebagai berikut:
              </p>
              <ol className="list-decimal space-y-2 pl-6">
                <li>Telah dilakukan proses Kredensial terhadap Tenaga Kesehatan yang Saudara usulkan.</li>
                <li>
                  Telah ditetapkan kewenangan klinis terhadap tenaga kesehatan yang bertugas di
                  tempat Saudara sebagaimana terlampir.
                </li>
                <li>
                  Terhadap tenaga kesehatan dengan rekomendasi tim kredensial berupa
                  &ldquo;direkomendasikan dengan catatan&rdquo;, agar dilakukan pembinaan berupa
                  asistensi atau pendampingan.
                </li>
                <li>
                  Tenaga kesehatan yang tidak mendapatkan ketetapan kewenangan klinis agar
                  diusulkan untuk mendapatkan pembinaan lebih lanjut.
                </li>
              </ol>
              {rk.catatan && (
                <div className="rounded-xl border bg-muted/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Catatan
                  </p>
                  <p className="mt-1">{rk.catatan}</p>
                </div>
              )}
              <p>Atas perhatian Saudara kami ucapkan terima kasih.</p>
            </div>

            {/* Tanda tangan */}
            <div className="mt-10 flex justify-end">
              <div className="text-center text-sm">
                <p>Kepala,</p>
                <p className="font-semibold">Dinas Kesehatan Kabupaten Kutai Barat</p>
                <div className="h-16" />
                <p className="border-t border-foreground/70 px-6 pt-1 font-semibold">H. Dr. Hamdani, M.Kes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
