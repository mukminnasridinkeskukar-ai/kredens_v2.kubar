import Link from 'next/link'
import { requirePageRole } from '@/lib/role-guard'
import { db } from '@/lib/db'
import { ambilWewenangPimpinan, pimpinanBolehAkses } from '@/lib/wewenang'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LOGBOOK_STATUS, LOGBOOK_STATUS_COLORS, NAMA_BULAN } from '@/lib/constants'
import { formatTanggal } from '@/lib/format'
import { ArrowRight, BookCheck, CalendarCheck2, Inbox } from 'lucide-react'

function BarisLogbook({
  l,
}: {
  l: {
    id: string
    bulan: number
    tahun: number
    status: string
    updatedAt: Date
    pengajuan: { kode: string; fasyankes: string | null; user: { nama: string } | null }
    _hitung: { hari: number; isian: number }
  }
}) {
  return (
    <div className="flex flex-col gap-3 border-b p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-foreground">{l.pengajuan.user?.nama ?? 'Asesi'}</p>
          <Badge variant="outline" className={LOGBOOK_STATUS_COLORS[l.status] ?? ''}>
            {LOGBOOK_STATUS[l.status] ?? l.status}
          </Badge>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Laporan {NAMA_BULAN[l.bulan - 1]} {l.tahun} · Pengajuan {l.pengajuan.kode}
          {l.pengajuan.fasyankes ? ` · ${l.pengajuan.fasyankes}` : ''}
        </p>
        <p className="text-xs text-muted-foreground">
          {l._hitung.hari} hari tercatat · {l._hitung.isian} isian kegiatan · Diperbarui{' '}
          {formatTanggal(l.updatedAt)}
        </p>
      </div>
      <Link
        href={`/pimpinan/logbook/${l.id}`}
        className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        {l.status === 'DIAJUKAN' ? 'Verifikasi' : 'Lihat Detail'}{' '}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}

export default async function LogbookPimpinanPage() {
  const user = await requirePageRole(['PIMPINAN_FASYANKES'])

  // Pimpinan hanya melihat laporan asesi fasyankesnya sendiri
  // (utama: TempatKerja; fallback data lama: instansi vs nama fasyankes).
  const pimpinan = await ambilWewenangPimpinan(user.id)

  const daftarSemua = await db.logbookBulanan.findMany({
    where: {
      status: { in: ['DIAJUKAN', 'DIVERIFIKASI', 'REVISI'] },
    },
    orderBy: [{ updatedAt: 'desc' }],
    include: {
      pengajuan: {
        select: {
          kode: true,
          fasyankes: true,
          user: { select: { nama: true, asesiProfile: { select: { tempatKerjaId: true } } } },
        },
      },
      entri: { select: { tanggal: true } },
    },
  })

  const daftar = daftarSemua.filter((l) =>
    pimpinanBolehAkses(pimpinan, l.pengajuan.user.asesiProfile?.tempatKerjaId ?? null, l.pengajuan.fasyankes).ok
  )

  const bentuk = daftar.map((l) => ({
    id: l.id,
    bulan: l.bulan,
    tahun: l.tahun,
    status: l.status,
    updatedAt: l.updatedAt,
    pengajuan: l.pengajuan,
    _hitung: {
      hari: new Set(l.entri.map((e) => e.tanggal)).size,
      isian: l.entri.length,
    },
  }))

  const menunggu = bentuk.filter((l) => l.status === 'DIAJUKAN')
  const lainnya = bentuk.filter((l) => l.status !== 'DIAJUKAN')

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Verifikasi Logbook Bulanan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sahkan laporan kegiatan bulanan asesi fasyankes Anda, atau minta perbaikan bila isian
          belum sesuai. Logbook memuat cek list harian pelaksanaan kewenangan klinis yang telah
          disetujui tim kredensial.
        </p>
      </div>

      {(() => {
        const namaFasyankes = pimpinan?.tempatKerja?.nama ?? pimpinan?.instansi ?? null
        if (!namaFasyankes) {
          return (
            <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Fasyankes/tempat kerja akun Anda belum ditetapkan. Hubungi Superadmin agar akun ini
              dihubungkan ke fasyankes yang benar.
            </p>
          )
        }
        return (
          <p className="rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Menampilkan laporan untuk fasyankes{' '}
            <span className="font-semibold text-foreground">{namaFasyankes}</span> — laporan asesi
            fasyankes lain tidak dapat Anda verifikasi.
          </p>
        )
      })()}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-primary" /> Menunggu Verifikasi
            {menunggu.length > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                {menunggu.length}
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Laporan bulanan yang diajukan asesi dan menunggu persetujuan Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {menunggu.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-10 text-center">
              <BookCheck className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Belum ada laporan logbook yang menunggu verifikasi.
              </p>
            </div>
          ) : (
            <div>
              {menunggu.map((l) => (
                <BarisLogbook key={l.id} l={l} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck2 className="h-5 w-5 text-primary" /> Riwayat Laporan
          </CardTitle>
          <CardDescription>
            Laporan yang telah diverifikasi atau dikembalikan untuk perbaikan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lainnya.length === 0 ? (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Belum ada riwayat laporan.
            </p>
          ) : (
            <div>
              {lainnya.map((l) => (
                <BarisLogbook key={l.id} l={l} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
