import { requirePageRole } from '@/lib/role-guard'
import { db } from '@/lib/db'
import { DaftarStaf } from '@/components/kredens/staf/daftar-staf'
import { ambilWewenangPimpinan, pimpinanBolehAkses } from '@/lib/wewenang'

export default async function PimpinanPage() {
  const user = await requirePageRole(['PIMPINAN_FASYANKES'])

  const pimpinan = await ambilWewenangPimpinan(user.id)

  const semua = await db.pengajuan.findMany({
    where: { status: { in: ['KETETAPAN_KADIS', 'SURAT_PENUGASAN', 'SELESAI'] } },
    orderBy: { updatedAt: 'desc' },
    include: {
      dokumen: { select: { id: true, jenis: true } },
      user: {
        select: {
          nama: true,
          nip: true,
          asesiProfile: { select: { tempatKerjaId: true, tempatBekerja: true } },
        },
      },
    },
  })

  // Pimpinan hanya melihat pengajuan asesi fasyankesnya sendiri
  // (utama: TempatKerja; fallback data lama: instansi vs nama fasyankes).
  const daftar = semua.filter((p) =>
    pimpinanBolehAkses(pimpinan, p.user.asesiProfile?.tempatKerjaId ?? null, p.fasyankes).ok
  )

  const namaFasyankes = pimpinan?.tempatKerja?.nama ?? pimpinan?.instansi ?? null

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Surat Penugasan Klinis</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Terbitkan SPK berdasarkan ketetapan kewenangan klinis dari Dinas Kesehatan, unggah
          pindaian dokumen SPK bertanda tangan, lalu tandai proses kredensial selesai.
        </p>
      </div>
      {namaFasyankes ? (
        <p className="rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Menampilkan pengajuan untuk fasyankes{' '}
          <span className="font-semibold text-foreground">{namaFasyankes}</span> — pengajuan
          fasyankes lain tidak muncul dan tidak dapat diproses.
        </p>
      ) : (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Fasyankes/tempat kerja akun Anda belum ditetapkan. Hubungi Superadmin agar akun ini
          dihubungkan ke fasyankes yang benar.
        </p>
      )}
      <DaftarStaf
        judul="Pengajuan Fasyankes Anda"
        deskripsi="SPK hanya terbit setelah Kepala Dinas menerbitkan surat rekomendasi (tahap KETETAPAN KADIS)."
        daftar={daftar}
        detailBase="/pimpinan"
        kosong="Belum ada pengajuan fasyankes Anda pada tahap ini."
        hintStatus="KETETAPAN KADIS / SURAT PENUGASAN"
        tampilkanDokumen
      />
    </div>
  )
}
