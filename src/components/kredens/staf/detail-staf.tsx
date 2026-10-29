import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/kredens/status-badge'
import { formatTanggal } from '@/lib/format'
import { JENIS_PENGAJUAN_LABELS, KODE_DIMINTA, KODE_REKOMENDASI } from '@/lib/constants'
import { ArrowLeft, CalendarDays, MapPin, User, Users } from 'lucide-react'

type PengajuanDetail = {
  id: string
  kode: string
  jenis: string
  status: string
  fasyankes: string | null
  createdAt: Date
  submittedAt: Date | null
  user: { nama: string; nip?: string | null; jabatan?: string | null; email?: string }
  formulir?: {
    pernyataan: boolean
    strNomor: string | null
    strBerlaku: string | null
    sipNomor: string | null
    sipBerlaku: string | null
    suratPermohonanNomor: string | null
    suratPermohonanTanggal: string | null
    ptNomor: string | null
    ptTanggal: string | null
    kolegiumNomor: string | null
    kolegiumTanggal: string | null
    ujiKompetensiNomor: string | null
    ujiKompetensiTanggal: string | null
  } | null
  kewenangan: {
    id: string
    urutan: number
    kodeRef: string | null
    namaKewenangan: string
    kodeDiminta: string
    kodeRekomendasi: string | null
    catatanRekomendasi: string | null
  }[]
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value || '—'}</p>
    </div>
  )
}

/** Kartu identitas + formulir + kewenangan — dipakai seluruh halaman detail staf. */
export function DetailStaf({ p }: { p: PengajuanDetail }) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <span className="font-mono">{p.kode}</span>
            <StatusBadge status={p.status} />
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {JENIS_PENGAJUAN_LABELS[p.jenis] ?? p.jenis}
            </span>
          </CardTitle>
          <CardDescription>
            Diajukan {p.submittedAt ? formatTanggal(p.submittedAt) : '—'} · dibuat{' '}
            {formatTanggal(p.createdAt)}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Nama Asesi" value={p.user?.nama} />
          <Field label="NIP/NIK" value={p.user?.nip} />
          <Field label="Jabatan" value={p.user?.jabatan} />
          <Field label="Fasyankes" value={p.fasyankes} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dokumen & Kelengkapan (Formulir)</CardTitle>
          <CardDescription>
            Pernyataan kompetensi: {p.formulir?.pernyataan ? 'SUDAH ditandatangani' : 'BELUM ditandatangani'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="STR — Nomor" value={p.formulir?.strNomor} />
          <Field label="STR — Berlaku s.d." value={p.formulir?.strBerlaku} />
          <Field label="SIP — Nomor" value={p.formulir?.sipNomor} />
          <Field label="SIP — Berlaku s.d." value={p.formulir?.sipBerlaku} />
          <Field label="Sertifikasi PT — Nomor" value={p.formulir?.ptNomor} />
          <Field label="Sertifikasi PT — Tanggal" value={p.formulir?.ptTanggal} />
          <Field label="Kolegium — Nomor" value={p.formulir?.kolegiumNomor} />
          <Field label="Kolegium — Tanggal" value={p.formulir?.kolegiumTanggal} />
          <Field label="Uji Kompetensi — Nomor" value={p.formulir?.ujiKompetensiNomor} />
          <Field label="Uji Kompetensi — Tanggal" value={p.formulir?.ujiKompetensiTanggal} />
          <Field label="Surat Permohonan — Nomor" value={p.formulir?.suratPermohonanNomor} />
          <Field label="Surat Permohonan — Tanggal" value={p.formulir?.suratPermohonanTanggal} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rincian Kewenangan Klinis yang Diusulkan</CardTitle>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Kode Diminta (Asesi):</span>
            {Object.entries(KODE_DIMINTA).map(([k, v]) => (
              <span key={k}>
                {k} = {v}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Kode Rekomendasi (Tim):</span>
            {Object.entries(KODE_REKOMENDASI).map(([k, v]) => (
              <span key={k}>
                {k} = {v}
              </span>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {p.kewenangan.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada kewenangan yang diusulkan.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="p-3 font-semibold">No</th>
                    <th className="p-3 font-semibold">Diagnosa/Keterampilan</th>
                    <th className="p-3 text-center font-semibold">Diminta</th>
                    <th className="p-3 text-center font-semibold">Rekomendasi</th>
                    <th className="p-3 font-semibold">Catatan Tim</th>
                  </tr>
                </thead>
                <tbody>
                  {p.kewenangan.map((k) => (
                    <tr key={k.id} className="border-b last:border-0">
                      <td className="p-3">{k.urutan}</td>
                      <td className="p-3 font-medium">
                        {k.namaKewenangan}
                        {k.kodeRef && (
                          <span className="ml-1 text-xs text-muted-foreground">({k.kodeRef})</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-bold text-primary">{k.kodeDiminta}</td>
                      <td className="p-3 text-center font-bold text-emerald-700">
                        {k.kodeRekomendasi ?? '—'}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{k.catatanRekomendasi ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <User className="h-3.5 w-3.5" /> {p.user?.email ?? '—'}
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" /> {p.fasyankes ?? '—'}
        </span>
        <span className="flex items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5" /> Dibuat {formatTanggal(p.createdAt)}
        </span>
        <Link href=".." className="flex items-center gap-1 text-primary hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke daftar
        </Link>
      </p>
    </>
  )
}

/** Kartu daftar tiga asesor penilai yang ditetapkan Operator saat verifikasi lolos. */
export function KartuAsesorPenilai({
  penugasan,
}: {
  penugasan: {
    id: string
    ditetapkanOleh: string | null
    createdAt: Date
    asesor: { id: string; nama: string; email: string; jabatan?: string | null; instansi?: string | null }
  }[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> Asesor Penilai yang Ditugaskan
        </CardTitle>
        <CardDescription>
          Ditetapkan Operator saat berkas dinyatakan lengkap — hanya tiga asesor berikut yang dapat
          melakukan penilaian.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {penugasan.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada asesor yang ditugaskan (pengajuan belum lolos verifikasi).
          </p>
        ) : (
          <ol className="grid gap-3 sm:grid-cols-3">
            {penugasan.map((t, i) => (
              <li key={t.id} className="rounded-xl border p-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <p className="text-sm font-semibold leading-tight">{t.asesor.nama}</p>
                </div>
                <p className="mt-2 truncate text-xs text-muted-foreground">
                  {t.asesor.jabatan || 'Asesor Kredensial'}
                </p>
                <p className="truncate text-xs text-muted-foreground">{t.asesor.email}</p>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}

/** Kartu riwayat status (timeline vertikal sederhana). */
export function RiwayatStaf({
  riwayat,
}: {
  riwayat: { id: string; status: string; keterangan: string | null; oleh: string | null; createdAt: Date }[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat Proses</CardTitle>
        <CardDescription>Jejak lengkap tahapan pengajuan</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3 border-l-2 border-primary/20 pl-5">
          {riwayat.map((r) => (
            <li key={r.id} className="relative">
              <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-primary bg-background" />
              <p className="text-sm font-semibold">
                {r.status.replaceAll('_', ' ')}{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  · {formatTanggal(r.createdAt)} · oleh {r.oleh ?? '—'}
                </span>
              </p>
              {r.keterangan && <p className="text-sm text-muted-foreground">{r.keterangan}</p>}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
