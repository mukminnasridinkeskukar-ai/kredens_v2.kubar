import { requirePageRole, sebagaiAsesor } from '@/lib/role-guard'
import { db } from '@/lib/db'
import { DaftarStaf } from '@/components/kredens/staf/daftar-staf'
import { ROLE_LABELS } from '@/lib/constants'

export default async function PenilaianPage() {
  const user = await requirePageRole(['ASESOR', 'MITRA_BESTARI'])

  // v2.1 — fungsi ASESOR dapat berupa peran utama maupun fungsi tambahan akun.
  const asesor = sebagaiAsesor(user)
  const labelKonteks = asesor ? 'Asesor' : (ROLE_LABELS[user.role] ?? user.role)

  const daftar = await db.pengajuan.findMany({
    where: {
      status: { in: ['PENILAIAN_TIM', 'REKOMENDASI_TIM'] },
      // Asesor hanya melihat pengajuan yang ditugaskan kepadanya oleh Operator
      // (tepat tiga asesor per pengajuan). Mitra Bestari melihat semuanya.
      ...(asesor ? { penugasanAsesor: { some: { asesorId: user.id } } } : {}),
    },
    orderBy: { updatedAt: 'desc' },
    include: { user: { select: { nama: true, nip: true } } },
  })

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Penilaian Kewenangan Klinis</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sebagai {labelKonteks}, telaah kewenangan klinis yang diusulkan asesi dan beri
          kode rekomendasi 1–4 pada setiap baris.
          {asesor &&
            ' Anda hanya melihat pengajuan yang ditugaskan kepada Anda oleh Operator Kredensial.'}
        </p>
      </div>
      <DaftarStaf
        judul={asesor ? 'Pengajuan yang Ditugaskan kepada Anda' : 'Pengajuan Tahap Penilaian'}
        deskripsi={
          asesor
            ? 'Operator Kredensial menetapkan tepat tiga asesor penilai saat berkas dinyatakan lengkap. Hanya asesor yang ditugaskan yang dapat menilai.'
            : 'Penilaian dapat diisi selama pengajuan berada pada tahap PENILAIAN TIM.'
        }
        daftar={daftar}
        detailBase="/penilaian"
        kosong={
          asesor
            ? 'Belum ada pengajuan yang ditugaskan kepada Anda. Pengajuan muncul di sini setelah Operator menetapkan Anda sebagai salah satu dari tiga asesor penilai.'
            : 'Belum ada pengajuan yang menunggu penilaian tim.'
        }
        hintStatus="PENILAIAN TIM / REKOMENDASI TIM"
      />
    </div>
  )
}
