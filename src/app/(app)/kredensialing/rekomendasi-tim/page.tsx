import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/kredens/status-badge'
import { ReadOnlyEmpty, ReadOnlyBanner } from '@/components/kredens/read-only'
import { formatTanggal } from '@/lib/format'
import {
  KEPUTUSAN_TIM_LABELS,
  KODE_DIMINTA,
  KODE_REKOMENDASI,
} from '@/lib/constants'
import { CheckCircle2, XCircle, AlertCircle, UserCheck, Users } from 'lucide-react'
import { PengajuanPicker } from '@/components/kredens/pengajuan-picker'

export default async function RekomendasiTimPage({
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
          rekomendasiTim: true,
          kewenangan: { orderBy: { urutan: 'asc' } },
        },
      })
    : null

  const rt = pengajuan?.rekomendasiTim

  const kesimpulanIcon =
    rt?.kesimpulan === 'TIDAK_DIREKOMENDASIKAN' ? (
      <XCircle className="h-5 w-5 text-red-500" />
    ) : rt?.kesimpulan === 'DIREKOMENDASIKAN_DENGAN_CATATAN' ? (
      <AlertCircle className="h-5 w-5 text-amber-500" />
    ) : (
      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
    )

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rekomendasi Tim Kredensial</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kesimpulan hasil penilaian Tim Kredensial/Mitra Bestari terhadap pengajuan Anda.
        </p>
      </div>

      <ReadOnlyBanner text="Halaman ini bersifat hanya-lihat (read-only). Data diisi oleh Tim Kredensial/Mitra Bestari setelah proses penilaian selesai." />

      <PengajuanPicker
        options={daftarPengajuan}
        selectedId={terpilihId ?? ''}
        basePath="/kredensialing/rekomendasi-tim"
      />

      {!pengajuan || !rt ? (
        <ReadOnlyEmpty
          title="Rekomendasi tim belum tersedia"
          description="Rekomendasi akan muncul setelah pengajuan Anda dinilai oleh Tim Kredensial/Mitra Bestari. Pastikan pengajuan telah dikirim dan lengkapi seluruh persyaratannya."
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-3">
                {kesimpulanIcon}
                {KEPUTUSAN_TIM_LABELS[rt.kesimpulan] ?? rt.kesimpulan}
              </CardTitle>
              <CardDescription>
                Pengajuan {pengajuan.kode} · Status:{' '}
                <StatusBadge status={pengajuan.status} className="ml-1 align-middle" />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Tanggal Penilaian</p>
                  <p className="mt-1 font-semibold">{rt.tanggal ? formatTanggal(rt.tanggal) : '-'}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Simpulan</p>
                  <p className="mt-1 text-sm leading-relaxed">
                    {rt.simpulan ??
                      `${session.user.name} telah menjalani kredensial terhadap kewenangan klinis yang diusulkan.`}
                  </p>
                </div>
              </div>
              {rt.catatan && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Catatan Tim</p>
                  <p className="mt-1 text-sm leading-relaxed text-amber-900">{rt.catatan}</p>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <UserCheck className="h-4 w-4 text-primary" /> Ketua Tim Kredensial
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{rt.ketuaNama ?? '-'}</p>
                </div>
                {/* v2.1 — anggota tim (perwakilan penilai): hingga tiga asesor */}
                {[
                  { label: 'Perwakilan Penilai 1', nama: rt.anggotaNama },
                  { label: 'Perwakilan Penilai 2', nama: rt.anggotaNama2 },
                  { label: 'Perwakilan Penilai 3', nama: rt.anggotaNama3 },
                ].map((a) => (
                  <div key={a.label} className="rounded-xl border p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <Users className="h-4 w-4 text-primary" /> {a.label}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{a.nama ?? '-'}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Rincian rekomendasi per kewenangan */}
          <Card>
            <CardHeader>
              <CardTitle>Rincian Kewenangan Klinis — Hasil Telaah</CardTitle>
              <CardDescription>Kolom Rekomendasi diisi oleh tim kredensial</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-xs sm:grid-cols-2">
                <div className="rounded-lg bg-muted/60 p-3">
                  <p className="font-semibold text-foreground">Kode Pengusul</p>
                  {Object.entries(KODE_DIMINTA).map(([k, v]) => (
                    <p key={k} className="mt-0.5 text-muted-foreground">
                      {k} = {v}
                    </p>
                  ))}
                </div>
                <div className="rounded-lg bg-muted/60 p-3">
                  <p className="font-semibold text-foreground">Kode Tim Kredensial</p>
                  {Object.entries(KODE_REKOMENDASI).map(([k, v]) => (
                    <p key={k} className="mt-0.5 text-muted-foreground">
                      {k} = {v}
                    </p>
                  ))}
                </div>
              </div>
              <div className="mt-4 overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left">
                      <th className="p-3 font-semibold">No</th>
                      <th className="p-3 font-semibold">Diagnosa/Keterampilan</th>
                      <th className="p-3 text-center font-semibold">Diminta</th>
                      <th className="p-3 text-center font-semibold">Rekomendasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pengajuan.kewenangan.map((k, i) => (
                      <tr key={k.id} className="border-b last:border-0">
                        <td className="p-3">{i + 1}</td>
                        <td className="p-3 font-medium">{k.namaKewenangan}</td>
                        <td className="p-3 text-center font-bold text-primary">{k.kodeDiminta}</td>
                        <td className="p-3 text-center font-bold text-emerald-700">
                          {k.kodeRekomendasi ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Penetapan kewenangan (bila sudah ada) */}
          {rt.penetapanNomor && (
            <Card>
              <CardHeader>
                <CardTitle>Penetapan Kewenangan Klinis</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Nomor</p>
                  <p className="mt-1 font-mono text-sm font-semibold">{rt.penetapanNomor}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Tanggal</p>
                  <p className="mt-1 font-semibold">{rt.penetapanTanggal ? formatTanggal(rt.penetapanTanggal) : '-'}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Berlaku Sampai</p>
                  <p className="mt-1 font-semibold">
                    {rt.penetapanBerlakuSampai ? formatTanggal(rt.penetapanBerlakuSampai) : '-'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
