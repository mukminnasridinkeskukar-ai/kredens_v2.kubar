import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { ReadOnlyEmpty, ReadOnlyBanner } from '@/components/kredens/read-only'
import { DokumenUnduh } from '@/components/kredens/dokumen-unduh'
import { formatTanggal } from '@/lib/format'
import { FileSignature } from 'lucide-react'
import { PengajuanPicker } from '@/components/kredens/pengajuan-picker'

export default async function SuratPenugasanKlinisPage({
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
          spk: true,
          rekomendasiKadis: true,
          user: true,
          dokumen: {
            where: { jenis: 'SPK' },
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

  const spk = pengajuan?.spk
  const dokumenSpk = pengajuan?.dokumen?.[0] ?? null

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Surat Penugasan Klinis</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Surat penugasan klinis yang diterbitkan Kepala UPTD berdasarkan ketetapan kewenangan
          klinis dari Dinas Kesehatan.
        </p>
      </div>

      <ReadOnlyBanner text="Halaman ini bersifat hanya-lihat (read-only). Surat diterbitkan oleh Kepala UPTD/Fasyankes setelah ketetapan kewenangan klinis terbit." />

      <PengajuanPicker
        options={daftarPengajuan}
        selectedId={terpilihId ?? ''}
        basePath="/spk-rkk/surat-penugasan-klinis"
      />

      {dokumenSpk && (
        <DokumenUnduh
          dokumen={dokumenSpk}
          judul="Dokumen Surat Penugasan Klinis (Pindaian)"
          keterangan="diterbitkan pimpinan fasyankes Anda"
        />
      )}

      {!pengajuan || !spk ? (
        <ReadOnlyEmpty
          title="Surat penugasan belum tersedia"
          description="Surat Penugasan Klinis akan muncul setelah Kepala UPTD menerbitkan penugasan berdasarkan surat ketetapan kewenangan klinis Anda."
        />
      ) : (
        <Card>
          <CardContent className="p-6 sm:p-10">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <FileSignature className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Surat Penugasan Klinis
              </p>
              <p className="font-mono text-lg font-bold">{spk.nomorSpk ?? '—'}</p>
            </div>

            <div className="mt-8 space-y-4 text-sm leading-relaxed">
              <p>
                Yang bertanda tangan di bawah ini Kepala UPTD{' '}
                <span className="font-semibold">{spk.uptd ?? pengajuan.rekomendasiKadis?.tujuanUptd ?? '…'}</span>{' '}
                memberikan Penugasan Klinis kepada:
              </p>
              <div className="rounded-xl border bg-muted/40 p-4">
                <p>
                  <span className="inline-block w-32 text-muted-foreground">Nama</span>:{' '}
                  <span className="font-semibold">{pengajuan.user?.nama ?? session.user.name}</span>
                </p>
                <p>
                  <span className="inline-block w-32 text-muted-foreground">NIP/NIK</span>:{' '}
                  <span className="font-mono">{pengajuan.user?.nip ?? '—'}</span>
                </p>
              </div>
              <p>
                Untuk memberikan pelayanan kesehatan di UPTD {spk.uptd ?? '…'} sesuai dengan
                surat ketetapan kewenangan klinis nomor{' '}
                <span className="font-semibold">{spk.nomorSkKewenangan ?? '—'}</span>.
              </p>
              <p>
                Penugasan klinis ini berlaku sampai dengan tanggal{' '}
                <span className="font-semibold">
                  {spk.berlakuSampai ? formatTanggal(spk.berlakuSampai) : '—'}
                </span>{' '}
                atau waktu lain dalam hal terjadi perubahan kewenangan klinis sesuai dengan
                keputusan Kepala Dinas Kesehatan Kabupaten Kutai Barat.
              </p>
            </div>

            <div className="mt-10 flex justify-end">
              <div className="text-center text-sm">
                <p>Sendawar, {spk.tanggalSpk ? formatTanggal(spk.tanggalSpk) : '—'}</p>
                <p className="font-semibold">Kepala UPTD {spk.uptd ?? '…'}</p>
                <div className="h-16" />
                <p className="border-t border-foreground/70 px-6 pt-1 font-semibold">
                  {spk.kepalaUptd ?? '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
