import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/role-guard'
import { DaftarStaf } from '@/components/kredens/staf/daftar-staf'
import { StatusBadge } from '@/components/kredens/status-badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatTanggal } from '@/lib/format'
import { FileText, ExternalLink, Download } from 'lucide-react'

export const metadata = { title: 'Semua Pengajuan — KREDENS' }

const LABEL_DOKUMEN: Record<string, string> = {
  SPK: 'SPK — Surat Penugasan Klinis',
  RKK: 'RKK — Rekomendasi Kewenangan Klinis',
  FORM_KEWENANGAN: 'Formulir Kewenangan Klinis (bertanda tangan)',
}

function ukuranTeks(bait: number): string {
  if (bait >= 1024 * 1024) return `${(bait / 1024 / 1024).toFixed(2)} MB`
  if (bait >= 1024) return `${(bait / 1024).toFixed(0)} KB`
  return `${bait} B`
}

/**
 * Akses penuh data (1/2): seluruh pengajuan dari seluruh asesi, semua status
 * — termasuk draf yang belum dikirim — untuk dilihat superadmin.
 *
 * v1.2.4: panel "Dokumen Pindaian Masuk (SPK & RKK)" — seluruh pindaian yang
 * terunggah lintas pengajuan, urut terbaru (metadata saja; isi berkas tidak
 * dimuat), dengan tombol Lihat/Unduh langsung ke /api/dokumen/[id].
 */
export default async function SemuaDataPage() {
  const session = await getAuthSession()
  if (session.role !== 'SUPERADMIN') redirect('/dashboard')

  const daftar = await db.pengajuan.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      user: { select: { nama: true, nip: true } },
      dokumen: { select: { id: true, jenis: true } },
    },
  })

  const hitung = daftar.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1
    return acc
  }, {})

  // Metadata seluruh dokumen (tanpa kolom `data` — blob tidak dimuat)
  const semuaDokumen = await db.dokumenPengajuan.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      jenis: true,
      namaFile: true,
      tipeFile: true,
      ukuran: true,
      diunggahOleh: true,
      updatedAt: true,
      pengajuan: {
        select: {
          kode: true,
          status: true,
          user: { select: { nama: true } },
        },
      },
    },
  })
  const dokumenTampil = semuaDokumen.slice(0, 10)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Semua Pengajuan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Seluruh data pengajuan kredensial dari seluruh asesi pada semua tahap — termasuk draf
          yang belum dikirim. Buka salah satu untuk melihat rincian lengkapnya.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(hitung).map(([status, n]) => (
          <span
            key={status}
            className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground"
          >
            {status.replaceAll('_', ' ')}: <span className="font-bold text-foreground">{n}</span>
          </span>
        ))}
      </div>

      {semuaDokumen.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Dokumen Pindaian Masuk (SPK &amp; RKK)
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                {semuaDokumen.length}
              </span>
            </CardTitle>
            <CardDescription>
              Seluruh pindaian dokumen yang telah diunggah dari semua pengajuan, diurutkan dari
              yang terbaru{semuaDokumen.length > 10 ? ` — menampilkan 10 terbaru dari ${semuaDokumen.length}` : ''}.
              Gunakan tombol Lihat/Unduh untuk membuka berkasnya langsung.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {dokumenTampil.map((d) => (
              <div
                key={d.id}
                className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-foreground">
                      {d.pengajuan.kode}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                        d.jenis === 'SPK'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : d.jenis === 'FORM_KEWENANGAN'
                            ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                            : 'border-sky-200 bg-sky-50 text-sky-700'
                      }`}
                    >
                      {d.jenis}
                    </span>
                    <StatusBadge status={d.pengajuan.status} />
                  </div>
                  <p className="mt-1 truncate text-sm font-medium text-foreground">
                    {LABEL_DOKUMEN[d.jenis] ?? d.jenis} · {d.pengajuan.user.nama}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {d.namaFile} · {ukuranTeks(d.ukuran)}
                    {d.diunggahOleh ? ` · Diunggah oleh ${d.diunggahOleh}` : ''} ·{' '}
                    {formatTanggal(String(d.updatedAt))}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <a
                    href={`/api/dokumen/${d.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5"
                  >
                    <ExternalLink className="h-4 w-4" /> Lihat
                  </a>
                  <a
                    href={`/api/dokumen/${d.id}?unduh=1`}
                    className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5"
                  >
                    <Download className="h-4 w-4" /> Unduh
                  </a>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <DaftarStaf
        judul={`Total ${daftar.length} pengajuan`}
        daftar={daftar}
        detailBase="/semua-data"
        kosong="Belum ada pengajuan apa pun di platform."
        tampilkanDokumenSemua
      />
    </div>
  )
}
