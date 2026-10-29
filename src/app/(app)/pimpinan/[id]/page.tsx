import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { requirePageRole } from '@/lib/role-guard'
import { DetailStaf, RiwayatStaf } from '@/components/kredens/staf/detail-staf'
import { SpkForm } from '@/components/kredens/staf/spk-form'
import { DokumenUpload } from '@/components/kredens/dokumen-upload'
import { StatusAksi } from '@/components/kredens/staf/status-aksi'
import { PrintButton } from '@/components/kredens/print-button'
import { ambilWewenangPimpinan, pimpinanBolehAkses } from '@/lib/wewenang'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function PimpinanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requirePageRole(['PIMPINAN_FASYANKES'])
  const { id } = await params

  const p = await db.pengajuan.findUnique({
    where: { id },
    include: {
      user: { select: { nama: true, nip: true, jabatan: true, email: true, asesiProfile: { select: { tempatKerjaId: true } } } },
      formulir: true,
      kewenangan: { orderBy: { urutan: 'asc' } },
      rekomendasiKadis: true,
      spk: true,
      dokumen: {
        select: {
          id: true,
          jenis: true,
          namaFile: true,
          tipeFile: true,
          ukuran: true,
          diunggahOleh: true,
          createdAt: true,
        },
      },
      riwayat: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!p) notFound()

  // Wewenang fasyankes: pimpinan hanya memproses asesi fasyankesnya sendiri
  const pimpinan = await ambilWewenangPimpinan(user.id)
  const cek = pimpinanBolehAkses(
    pimpinan,
    p.user.asesiProfile?.tempatKerjaId ?? null,
    p.fasyankes
  )
  if (!cek.ok) notFound()

  const dokumenSpk = p.dokumen.find((d) => d.jenis === 'SPK') ?? null
  const bisaTerbitkan = ['KETETAPAN_KADIS', 'SURAT_PENUGASAN'].includes(p.status)
  const bisaUnggahDokumen = ['KETETAPAN_KADIS', 'SURAT_PENUGASAN', 'SELESAI'].includes(p.status)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Penerbitan Surat Penugasan Klinis</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {bisaTerbitkan
              ? 'Isi data SPK lalu terbitkan. Setelah terbit, tandai proses kredensial selesai.'
              : p.spk
                ? 'Proses kredensial sudah selesai — SPK bersifat hanya-lihat.'
                : 'Pengajuan belum sampai pada tahap penerbitan SPK.'}
          </p>
        </div>
        {p.spk && <PrintButton />}
      </div>

      <DetailStaf p={p} />

      {bisaTerbitkan && (
        <SpkForm pengajuanId={p.id} awal={p.spk} namaPimpinan={user.name ?? ''} />
      )}

      {bisaUnggahDokumen && (
        <DokumenUpload
          pengajuanId={p.id}
          jenis="SPK"
          apiPath="/api/pimpinan/spk/upload"
          judul="Unggah Dokumen SPK (Pindaian Bertanda Tangan)"
          deskripsi="Gunakan Template Contoh (PDF, siap cetak) atau Template Contoh (Word, dapat diedit — beri kop fasyankes Anda di bagian atas) sebagai format dasar surat — data pengajuan sudah terisi otomatis. Lengkapi bagian bertitik, tandatangani & cap, pindai (PDF/JPG/PNG, maks 5 MB), lalu unggah di sini. Asesi dapat langsung mengunduh dokumen ini dari akunnya pada menu SPK dan RKK."
          dokumen={dokumenSpk}
          templateHref={`/api/pimpinan/spk/template?pengajuanId=${p.id}`}
          templateDocxHref={`/api/pimpinan/spk/template?pengajuanId=${p.id}&format=docx`}
        />
      )}

      {p.status === 'SURAT_PENUGASAN' && (
        <Card>
          <CardHeader>
            <CardTitle>Penutupan Proses</CardTitle>
            <CardDescription>
              SPK telah terbit ({p.spk?.nomorSpk ?? '—'}). Tandai proses kredensial sebagai
              selesai agar tercatat tuntas di sistem.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StatusAksi pengajuanId={p.id} aksiList={['TANDAI_SELESAI']} />
          </CardContent>
        </Card>
      )}

      <RiwayatStaf riwayat={p.riwayat} />
    </div>
  )
}
