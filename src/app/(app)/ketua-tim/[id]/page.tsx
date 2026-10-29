import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { requirePageRole } from '@/lib/role-guard'
import { DetailStaf, RiwayatStaf } from '@/components/kredens/staf/detail-staf'
import { KewenanganEditor } from '@/components/kredens/staf/kewenangan-editor'
import { RekomendasiTimForm } from '@/components/kredens/staf/rekomendasi-tim-form'
import { DokumenUpload } from '@/components/kredens/dokumen-upload'

export default async function KetuaTimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // v2.1 — ketua tim kredensial terbagi per profesi: pengajuan hanya dapat
  // dibuka bila profesi asesinya sama dengan profesi ketua tim.
  const user = await requirePageRole(['KETUA_TIM_KREDENSIAL'])
  const { id } = await params

  const p = await db.pengajuan.findUnique({
    where: { id },
    include: {
      user: { select: { nama: true, nip: true, jabatan: true, email: true, asesiProfile: { select: { jenisProfesi: true } } } },
      formulir: true,
      kewenangan: { orderBy: { urutan: 'asc' } },
      rekomendasiTim: true,
      penugasanAsesor: {
        orderBy: { createdAt: 'asc' },
        include: { asesor: { select: { nama: true, jabatan: true } } },
      },
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

  const profesiKetua = user.profesi?.trim()
  const profesiAsesi = p.user.asesiProfile?.jenisProfesi ?? null
  if (profesiKetua && profesiAsesi && profesiAsesi !== profesiKetua) notFound()

  const dokumenRkk = p.dokumen.find((d) => d.jenis === 'RKK') ?? null
  const bisaEdit = ['PENILAIAN_TIM', 'REKOMENDASI_TIM'].includes(p.status)
  const bisaUnggahDokumen = ['REKOMENDASI_TIM', 'KETETAPAN_KADIS', 'SURAT_PENUGASAN', 'SELESAI'].includes(
    p.status
  )

  // v2.1 — kandidat anggota tim (perwakilan penilai): tiga asesor yang
  // ditetapkan Operator pada pengajuan ini. Nama-nama ini memudahkan ketua
  // tim mengisi kolom anggota tanpa mengetik ulang.
  const calonAnggota = p.penugasanAsesor
    .map((t) => t.asesor?.nama)
    .filter((n): n is string => Boolean(n))

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Penetapan Rekomendasi Tim</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {profesiKetua && (
            <span className="mr-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              Tim Kredensial Profesi {profesiKetua}
            </span>
          )}
          {bisaEdit
            ? 'Koreksi penilaian bila perlu, lalu tetapkan kesimpulan rekomendasi tim kredensial.'
            : 'Pengajuan sudah melewati tahap tim kredensial — halaman ini hanya-lihat.'}
        </p>
      </div>

      <DetailStaf p={p} />
      <KewenanganEditor pengajuanId={p.id} baris={p.kewenangan} bisaEdit={bisaEdit} />

      {bisaUnggahDokumen && (
        <DokumenUpload
          pengajuanId={p.id}
          jenis="RKK"
          apiPath="/api/ketua-tim/rkk/upload"
          judul="Unggah Dokumen Rincian Kewenangan Klinis (Pindaian Bertanda Tangan)"
          deskripsi="Pindai dokumen RKK hasil penetapan tim kredensial yang telah ditandatangani (PDF/JPG/PNG, maks 5 MB), lalu unggah di sini. Asesi dapat langsung mengunduh dokumen ini dari akunnya pada menu SPK dan RKK."
          dokumen={dokumenRkk}
        />
      )}
      {bisaEdit && (
        <RekomendasiTimForm
          pengajuanId={p.id}
          awal={p.rekomendasiTim}
          namaKetua={user.name ?? ''}
          calonAnggota={calonAnggota}
        />
      )}
      <RiwayatStaf riwayat={p.riwayat} />
    </div>
  )
}
