import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/kredens/status-badge'
import { JENIS_PENGAJUAN_LABELS } from '@/lib/constants'
import { formatTanggal } from '@/lib/format'
import { ArrowRight } from 'lucide-react'

export type BarisDaftar = {
  id: string
  kode: string
  jenis: string
  status: string
  fasyankes: string | null
  submittedAt: Date | null
  updatedAt: Date
  user: { nama: string; nip?: string | null }
  dokumen?: { id: string; jenis: string }[]
}

/** Badge jenis dokumen: SPK hijau (emerald), RKK biru-langit (sky). */
function BadgeDokumen({ jenis }: { jenis: string }) {
  const spk = jenis === 'SPK'
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
        spk
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-sky-200 bg-sky-50 text-sky-700'
      }`}
    >
      {jenis}
    </span>
  )
}

/** Tabel daftar pengajuan untuk halaman modul staf. */
export function DaftarStaf({
  judul,
  deskripsi,
  daftar,
  detailBase,
  kosong,
  hintStatus,
  tampilkanDokumen,
  tampilkanDokumenSemua,
}: {
  judul: string
  deskripsi?: string
  daftar: BarisDaftar[]
  detailBase: string
  kosong: string
  hintStatus?: string
  /** Kolom "Dokumen SPK" — hanya badge SPK (untuk daftar pimpinan). */
  tampilkanDokumen?: boolean
  /** Kolom "Dokumen" — badge SPK dan RKK terpisah (untuk superadmin). */
  tampilkanDokumenSemua?: boolean
}) {
  const adaKolomDokumen = Boolean(tampilkanDokumen || tampilkanDokumenSemua)
  return (
    <Card>
      <CardHeader>
        <CardTitle>{judul}</CardTitle>
        {deskripsi && <CardDescription>{deskripsi}</CardDescription>}
        {hintStatus && (
          <CardDescription className="text-amber-700">
            Menampilkan pengajuan berstatus: {hintStatus}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {daftar.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">{kosong}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="p-3 font-semibold">Kode</th>
                  <th className="p-3 font-semibold">Asesi</th>
                  <th className="p-3 font-semibold">Jenis</th>
                  <th className="p-3 font-semibold">Status</th>
                  {adaKolomDokumen && (
                    <th className="p-3 font-semibold">
                      {tampilkanDokumenSemua ? 'Dokumen' : 'Dokumen SPK'}
                    </th>
                  )}
                  <th className="p-3 font-semibold">Dikirim</th>
                  <th className="p-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {daftar.map((p) => {
                  const jenisAda = new Set((p.dokumen ?? []).map((d) => d.jenis))
                  return (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="p-3 font-mono text-xs font-semibold">{p.kode}</td>
                      <td className="p-3">
                        <p className="font-medium">{p.user?.nama ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">{p.fasyankes ?? '—'}</p>
                      </td>
                      <td className="p-3 text-xs">{JENIS_PENGAJUAN_LABELS[p.jenis] ?? p.jenis}</td>
                      <td className="p-3">
                        <StatusBadge status={p.status} />
                      </td>
                      {adaKolomDokumen && (
                        <td className="p-3">
                          {tampilkanDokumenSemua ? (
                            jenisAda.size === 0 ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {['SPK', 'RKK'].map((j) =>
                                  jenisAda.has(j) ? <BadgeDokumen key={j} jenis={j} /> : null
                                )}
                              </div>
                            )
                          ) : jenisAda.has('SPK') ? (
                            <BadgeDokumen jenis="SPK" />
                          ) : (
                            <span className="text-xs text-muted-foreground">Belum ada</span>
                          )}
                        </td>
                      )}
                      <td className="p-3 text-xs text-muted-foreground">
                        {p.submittedAt ? formatTanggal(p.submittedAt) : '—'}
                      </td>
                      <td className="p-3 text-right">
                        <Link
                          href={`${detailBase}/${p.id}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        >
                          Proses <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
