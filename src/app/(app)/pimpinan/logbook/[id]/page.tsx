import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requirePageRole } from '@/lib/role-guard'
import { db } from '@/lib/db'
import { ambilWewenangPimpinan, pimpinanBolehAkses } from '@/lib/wewenang'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LogbookVerifikasi } from '@/components/kredens/logbook-verifikasi'
import { LOGBOOK_STATUS, LOGBOOK_STATUS_COLORS, NAMA_BULAN } from '@/lib/constants'
import { formatTanggal } from '@/lib/format'
import { ArrowLeft, BadgeCheck, FileEdit, UserRound } from 'lucide-react'

export default async function LogbookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requirePageRole(['PIMPINAN_FASYANKES'])
  const { id } = await params

  const pimpinan = await ambilWewenangPimpinan(user.id)

  const logbook = await db.logbookBulanan.findUnique({
    where: { id },
    include: {
      pengajuan: {
        select: {
          kode: true,
          fasyankes: true,
          user: {
            select: {
              nama: true,
              jabatan: true,
              asesiProfile: { select: { tempatKerjaId: true } },
            },
          },
          kewenangan: { orderBy: { urutan: 'asc' } },
        },
      },
      entri: { orderBy: [{ tanggal: 'asc' }, { createdAt: 'asc' }] },
    },
  })
  if (!logbook) notFound()

  // Kewenangan pimpinan: tempat kerja = tempat kerja asesi
  // (utama via TempatKerja, fallback pencocokan nama untuk data lama).
  if (!pimpinanBolehAkses(pimpinan, logbook.pengajuan.user.asesiProfile?.tempatKerjaId ?? null, logbook.pengajuan.fasyankes).ok) {
    notFound()
  }

  const p = logbook.pengajuan
  const kewenanganById = new Map(p.kewenangan.map((k) => [k.id, k]))
  const disetujui = p.kewenangan.filter((k) => k.kodeRekomendasi === '1' || k.kodeRekomendasi === '2')

  // Kelompokkan entri per tanggal
  const perTanggal = new Map<string, typeof logbook.entri>()
  for (const e of logbook.entri) {
    const arr = perTanggal.get(e.tanggal) ?? []
    arr.push(e)
    perTanggal.set(e.tanggal, arr)
  }

  const rekap = disetujui.map((k) => {
    const es = logbook.entri.filter((e) => e.kewenanganId === k.id)
    return {
      k,
      hari: new Set(es.map((e) => e.tanggal)).size,
      kasus: es.reduce((a, e) => a + (e.jumlahKasus || 0), 0),
    }
  })

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/pimpinan/logbook"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke daftar logbook
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            Logbook {NAMA_BULAN[logbook.bulan - 1]} {logbook.tahun}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Laporan kegiatan bulanan asesi · Pengajuan {p.kode}
            {p.fasyankes ? ` · ${p.fasyankes}` : ''}
          </p>
        </div>
        <Badge variant="outline" className={LOGBOOK_STATUS_COLORS[logbook.status] ?? ''}>
          {LOGBOOK_STATUS[logbook.status] ?? logbook.status}
        </Badge>
      </div>

      {/* Info asesi */}
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <UserRound className="h-5 w-5 text-primary" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">{p.user?.nama ?? 'Asesi'}</p>
            <p className="text-sm text-muted-foreground">
              {[p.user?.jabatan, p.fasyankes].filter(Boolean).join(' · ') || '—'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Status banner */}
      {logbook.status === 'REVISI' && (
        <div className="rounded-xl border border-red-200 bg-red-50/70 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-red-800">
            <FileEdit className="h-4.5 w-4.5 shrink-0" /> Dikembalikan untuk perbaikan
          </p>
          {logbook.catatanPimpinan && (
            <p className="mt-1 text-sm text-red-700">Catatan: {logbook.catatanPimpinan}</p>
          )}
        </div>
      )}
      {logbook.status === 'DIVERIFIKASI' && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <BadgeCheck className="h-4.5 w-4.5 shrink-0" />
            Terverifikasi oleh {logbook.diverifikasiOleh ?? 'Pimpinan Fasyankes'}
            {logbook.diverifikasiPada ? ` · ${formatTanggal(logbook.diverifikasiPada)}` : ''}
          </p>
          {logbook.catatanPimpinan && (
            <p className="mt-1 text-sm text-emerald-700">Catatan: {logbook.catatanPimpinan}</p>
          )}
        </div>
      )}

      {/* Cek list harian (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>Cek List Harian</CardTitle>
          <CardDescription>
            {perTanggal.size > 0
              ? `${perTanggal.size} hari tercatat dengan ${logbook.entri.length} isian kegiatan.`
              : 'Laporan tidak memiliki isian.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {perTanggal.size === 0 ? (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Tidak ada isian cek list pada laporan ini.
            </p>
          ) : (
            [...perTanggal.entries()].map(([tanggal, entri]) => (
              <div key={tanggal} className="rounded-xl border">
                <p className="border-b bg-muted/40 px-4 py-2.5 text-sm font-semibold">
                  {formatTanggal(tanggal)}
                </p>
                <div className="space-y-2 p-3">
                  {entri.map((e) => {
                    const k = kewenanganById.get(e.kewenanganId)
                    return (
                      <div key={e.id} className="flex flex-wrap items-start justify-between gap-2 rounded-lg border p-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-snug">
                            {k?.namaKewenangan ?? 'Kewenangan'}
                          </p>
                          {k?.kodeRef && (
                            <p className="font-mono text-xs text-muted-foreground">
                              Kode {k.kodeRef}
                              {k.kodeRekomendasi === '2' ? ' · supervisi' : ''}
                            </p>
                          )}
                          {e.catatan && (
                            <p className="mt-1 text-xs italic text-muted-foreground">{e.catatan}</p>
                          )}
                        </div>
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold">
                          {e.jumlahKasus} kasus
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Rekap per kewenangan */}
      <Card>
        <CardHeader>
          <CardTitle>Rekap Kewenangan</CardTitle>
          <CardDescription>Ringkasan pelaksanaan per kewenangan pada bulan ini.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="p-3 font-semibold">Kewenangan</th>
                  <th className="p-3 font-semibold">Hari</th>
                  <th className="p-3 font-semibold">Total Kasus</th>
                </tr>
              </thead>
              <tbody>
                {rekap
                  .filter((r) => r.hari > 0)
                  .map((r) => (
                    <tr key={r.k.id} className="border-b last:border-0">
                      <td className="p-3 font-medium leading-snug">{r.k.namaKewenangan}</td>
                      <td className="p-3 tabular-nums">{r.hari}</td>
                      <td className="p-3 tabular-nums">{r.kasus}</td>
                    </tr>
                  ))}
                {rekap.every((r) => r.hari === 0) && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-sm text-muted-foreground">
                      Belum ada pelaksanaan tercatat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Keputusan pimpinan */}
      {logbook.status === 'DIAJUKAN' && (
        <LogbookVerifikasi
          logbookId={logbook.id}
          periode={`${NAMA_BULAN[logbook.bulan - 1]} ${logbook.tahun}`}
          namaAsesi={p.user?.nama ?? 'Asesi'}
        />
      )}
    </div>
  )
}
