import { requirePageRole } from '@/lib/role-guard'
import { db } from '@/lib/db'
import { DaftarStaf } from '@/components/kredens/staf/daftar-staf'

export default async function KetuaTimPage() {
  // v2.1 — ketua tim kredensial terbagi berdasarkan profesi masing-masing:
  // akun ketua tim dengan profesi tertentu hanya menangani pengajuan asesi
  // dengan jenisProfesi yang sama. Ketua tim tanpa profesi melihat semua
  // (kompatibel dengan data lama).
  const user = await requirePageRole(['KETUA_TIM_KREDENSIAL'])
  const profesiKetua = user.profesi?.trim()

  const daftar = await db.pengajuan.findMany({
    where: {
      status: { in: ['PENILAIAN_TIM', 'REKOMENDASI_TIM'] },
      ...(profesiKetua
        ? { user: { asesiProfile: { jenisProfesi: profesiKetua } } }
        : {}),
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      user: { select: { nama: true, nip: true, asesiProfile: { select: { jenisProfesi: true } } } },
    },
  })

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rekomendasi Tim Kredensial</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {profesiKetua
            ? `Tim kredensial profesi ${profesiKetua} — pastikan seluruh kewenangan pengajuan asesi ${profesiKetua} sudah dinilai tim, lalu tetapkan kesimpulan rekomendasi untuk diteruskan kepada Kepala Dinas Kesehatan.`
            : 'Pastikan seluruh kewenangan sudah dinilai tim, lalu tetapkan kesimpulan rekomendasi untuk diteruskan kepada Kepala Dinas Kesehatan.'}
        </p>
      </div>
      {profesiKetua && (
        <p className="rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Akun ini adalah Ketua Tim Kredensial profesi{' '}
          <span className="font-semibold text-foreground">{profesiKetua}</span> — hanya pengajuan
          asesi profesi tersebut yang muncul di sini. Profesi diatur oleh Superadmin pada menu
          Kelola Akun.
        </p>
      )}
      <DaftarStaf
        judul={`Pengajuan Tahap Penilaian & Rekomendasi${profesiKetua ? ` — Profesi ${profesiKetua}` : ''}`}
        deskripsi="Rekomendasi dapat ditetapkan selama pengajuan berada pada tahap PENILAIAN TIM."
        daftar={daftar}
        detailBase="/ketua-tim"
        kosong={
          profesiKetua
            ? `Belum ada pengajuan asesi ${profesiKetua} yang siap ditetapkan rekomendasinya.`
            : 'Belum ada pengajuan yang siap ditetapkan rekomendasinya.'
        }
        hintStatus="PENILAIAN TIM / REKOMENDASI TIM"
      />
    </div>
  )
}
