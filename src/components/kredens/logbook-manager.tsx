'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  AlertCircle,
  BadgeCheck,
  CalendarCheck2,
  ClipboardCheck,
  Clock3,
  FileEdit,
  Loader2,
  NotebookPen,
  Send,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LOGBOOK_STATUS, LOGBOOK_STATUS_COLORS, NAMA_BULAN } from '@/lib/constants'
import { formatTanggal } from '@/lib/format'

export type KewenanganRingkas = {
  id: string
  namaKewenangan: string
  kodeRef: string | null
  kodeRekomendasi: string | null
}

export type EntriLogbook = {
  id: string
  tanggal: string
  kewenanganId: string
  jumlahKasus: number
  catatan: string | null
}

export type LogbookData = {
  id: string
  bulan: number
  tahun: number
  status: string
  catatanPimpinan: string | null
  diverifikasiOleh: string | null
  diverifikasiPada: string | Date | null
  submittedAt: string | Date | null
  entri: EntriLogbook[]
} | null

export type LogbookRingkas = { id: string; bulan: number; tahun: number; status: string }

type Cek = Record<string, { cek: boolean; kasus: number; catatan: string }>

const pad2 = (n: number) => String(n).padStart(2, '0')
const tanggalIso = (tahun: number, bulan: number, hari: number) =>
  `${tahun}-${pad2(bulan)}-${pad2(hari)}`

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={LOGBOOK_STATUS_COLORS[status] ?? ''}>
      {LOGBOOK_STATUS[status] ?? status}
    </Badge>
  )
}

function BannerStatus({ logbook }: { logbook: NonNullable<LogbookData> }) {
  if (logbook.status === 'REVISI') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/70 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-red-800">
          <FileEdit className="h-4.5 w-4.5 shrink-0" /> Pimpinan fasyankes meminta perbaikan
        </p>
        {logbook.catatanPimpinan && (
          <p className="mt-1 text-sm leading-relaxed text-red-700">
            Catatan: {logbook.catatanPimpinan}
          </p>
        )}
        <p className="mt-1 text-xs text-red-600">
          Silakan perbaiki cek list harian di bawah, lalu ajukan ulang laporan.
        </p>
      </div>
    )
  }
  if (logbook.status === 'DIAJUKAN') {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-amber-800">
          <Clock3 className="h-4.5 w-4.5 shrink-0" /> Menunggu verifikasi pimpinan fasyankes
        </p>
        <p className="mt-1 text-xs text-amber-700">
          Diajukan{' '}
          {logbook.submittedAt ? `pada ${formatTanggal(logbook.submittedAt)}` : 'baru saja'} —
          isian terkunci sampai laporan diverifikasi atau diminta perbaikan.
        </p>
      </div>
    )
  }
  if (logbook.status === 'DIVERIFIKASI') {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
          <BadgeCheck className="h-4.5 w-4.5 shrink-0" />
          Terverifikasi oleh {logbook.diverifikasiOleh ?? 'Pimpinan Fasyankes'}
        </p>
        <p className="mt-1 text-xs text-emerald-700">
          {logbook.diverifikasiPada ? `Diverifikasi pada ${formatTanggal(logbook.diverifikasiPada)}. ` : ''}
          Laporan bulanan ini telah disahkan.
        </p>
        {logbook.catatanPimpinan && (
          <p className="mt-1 text-sm leading-relaxed text-emerald-700">
            Catatan: {logbook.catatanPimpinan}
          </p>
        )}
      </div>
    )
  }
  return null
}

function HariGrid({
  tahun,
  bulan,
  entri,
  terpilih,
  pilihHari,
}: {
  tahun: number
  bulan: number
  entri: EntriLogbook[]
  terpilih: number | null
  pilihHari: (h: number) => void
}) {
  const jumlahHari = new Date(tahun, bulan, 0).getDate()
  const berisi = new Set(entri.map((e) => e.tanggal))
  const kini = new Date()
  const hariIni = tanggalIso(kini.getFullYear(), kini.getMonth() + 1, kini.getDate())

  return (
    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
      {Array.from({ length: jumlahHari }, (_, i) => i + 1).map((h) => {
        const tgl = tanggalIso(tahun, bulan, h)
        const ada = berisi.has(tgl)
        const dow = new Date(tahun, bulan - 1, h).getDay()
        const akhirPekan = dow === 0 || dow === 6
        return (
          <button
            key={h}
            type="button"
            onClick={() => pilihHari(h)}
            title={formatTanggal(tgl)}
            aria-label={`Cek list tanggal ${h}`}
            className={`relative flex h-11 items-center justify-center rounded-lg border text-sm font-medium transition-colors min-h-[44px] ${
              terpilih === h
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : ada
                  ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20'
                  : akhirPekan
                    ? 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                    : 'border-border bg-background hover:bg-muted'
            }`}
          >
            {h}
            {ada && (
              <span
                className={`absolute bottom-1.5 h-1 w-1 rounded-full ${
                  terpilih === h ? 'bg-primary-foreground' : 'bg-primary'
                }`}
              />
            )}
            {tgl === hariIni && terpilih !== h && (
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
            )}
          </button>
        )
      })}
    </div>
  )
}

function PanelCekHari({
  tanggal,
  kewenangan,
  cek,
  setCek,
  onSimpan,
  menyimpan,
  readOnly,
}: {
  tanggal: string
  kewenangan: KewenanganRingkas[]
  cek: Cek
  setCek: React.Dispatch<React.SetStateAction<Cek>>
  onSimpan: () => void
  menyimpan: boolean
  readOnly: boolean
}) {
  const jumlahCek = kewenangan.filter((k) => cek[k.id]?.cek).length

  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Cek List — {formatTanggal(tanggal)}</p>
          <p className="text-xs text-muted-foreground">
            {jumlahCek > 0
              ? `${jumlahCek} kewenangan dilaksanakan pada hari ini`
              : 'Centang kewenangan yang Anda laksanakan pada hari ini'}
          </p>
        </div>
        {!readOnly && (
          <Button size="sm" onClick={onSimpan} disabled={menyimpan} className="min-h-[36px]">
            {menyimpan ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck2 className="h-4 w-4" />}
            Simpan Cek List
          </Button>
        )}
      </div>

      <div className="mt-3 space-y-2">
        {kewenangan.map((k) => {
          const aktif = cek[k.id]?.cek ?? false
          return (
            <div key={k.id} className="rounded-lg border bg-background p-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id={`cek-${k.id}`}
                  checked={aktif}
                  disabled={readOnly}
                  onCheckedChange={(v) =>
                    setCek((prev) => ({
                      ...prev,
                      [k.id]: { ...prev[k.id], cek: v === true },
                    }))
                  }
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <Label htmlFor={`cek-${k.id}`} className="cursor-pointer text-sm font-medium leading-snug">
                    {k.namaKewenangan}
                  </Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {k.kodeRef ? `Kode ${k.kodeRef} · ` : ''}
                    {k.kodeRekomendasi === '1' ? 'Berwenang penuh' : 'Dengan supervisi'}
                  </p>
                </div>
              </div>
              {aktif && !readOnly && (
                <div className="mt-3 grid gap-2 sm:grid-cols-[130px_1fr]">
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="Jml kasus"
                    value={cek[k.id]?.kasus ? String(cek[k.id]?.kasus) : ''}
                    onChange={(e) =>
                      setCek((prev) => ({
                        ...prev,
                        [k.id]: { ...prev[k.id], kasus: Math.max(0, Math.floor(Number(e.target.value) || 0)) },
                      }))
                    }
                  />
                  <Input
                    placeholder="Catatan (opsional)"
                    value={cek[k.id]?.catatan ?? ''}
                    onChange={(e) =>
                      setCek((prev) => ({
                        ...prev,
                        [k.id]: { ...prev[k.id], catatan: e.target.value },
                      }))
                    }
                  />
                </div>
              )}
              {aktif && readOnly && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Jumlah kasus: {cek[k.id]?.kasus ?? 0}
                  {cek[k.id]?.catatan ? ` · ${cek[k.id]?.catatan}` : ''}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function LogbookManager({
  pengajuanId,
  pengajuanKode,
  kewenangan,
  daftarLogbook,
  logbookAwal,
  bulanAwal,
  tahunAwal,
}: {
  pengajuanId: string
  pengajuanKode: string
  kewenangan: KewenanganRingkas[]
  daftarLogbook: LogbookRingkas[]
  logbookAwal: LogbookData
  bulanAwal: number
  tahunAwal: number
}) {
  const router = useRouter()
  const [bulan, setBulan] = useState(bulanAwal)
  const [tahun, setTahun] = useState(tahunAwal)
  const [logbook, setLogbook] = useState<LogbookData>(logbookAwal)
  const [hari, setHari] = useState<number | null>(null)
  const [cek, setCek] = useState<Cek>({})
  const [memuat, setMemuat] = useState(false)
  const [menyimpan, setMenyimpan] = useState(false)
  const [dialogAjukan, setDialogAjukan] = useState(false)
  const [mengajukan, setMengajukan] = useState(false)

  const readOnly = logbook ? ['DIAJUKAN', 'DIVERIFIKASI'].includes(logbook.status) : false
  const tahunIni = new Date().getFullYear()
  const tahunOptions = [tahunIni, tahunIni - 1, tahunIni - 2]
  const jumlahHariBulanIni = logbook?.entri.length ?? 0
  const totalHariTercatat = logbook ? new Set(logbook.entri.map((e) => e.tanggal)).size : 0

  const rekap = useMemo(
    () =>
      kewenangan.map((k) => {
        const es = logbook?.entri.filter((e) => e.kewenanganId === k.id) ?? []
        return {
          ...k,
          hari: new Set(es.map((e) => e.tanggal)).size,
          kasus: es.reduce((a, e) => a + (e.jumlahKasus || 0), 0),
        }
      }),
    [kewenangan, logbook]
  )

  function pilihHari(h: number) {
    setHari(h)
    const tanggal = tanggalIso(tahun, bulan, h)
    const map: Cek = {}
    for (const k of kewenangan) map[k.id] = { cek: false, kasus: 0, catatan: '' }
    if (logbook) {
      for (const e of logbook.entri.filter((x) => x.tanggal === tanggal)) {
        if (map[e.kewenanganId]) {
          map[e.kewenanganId] = { cek: true, kasus: e.jumlahKasus, catatan: e.catatan ?? '' }
        }
      }
    }
    setCek(map)
  }

  async function gantiPeriode(b: number, t: number) {
    setBulan(b)
    setTahun(t)
    setHari(null)
    setCek({})
    setMemuat(true)
    try {
      const res = await fetch(`/api/logbook?pengajuanId=${pengajuanId}&bulan=${b}&tahun=${t}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal memuat laporan')
      setLogbook(json.logbook ?? null)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Gagal memuat laporan')
    } finally {
      setMemuat(false)
    }
  }

  async function simpanHari() {
    if (hari == null) return
    const tanggal = tanggalIso(tahun, bulan, hari)
    setMenyimpan(true)
    try {
      const entri = kewenangan
        .filter((k) => cek[k.id]?.cek)
        .map((k) => ({
          kewenanganId: k.id,
          jumlahKasus: cek[k.id]?.kasus ?? 0,
          catatan: cek[k.id]?.catatan ?? '',
        }))
      const res = await fetch('/api/logbook', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pengajuanId, bulan, tahun, tanggal, entri }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal menyimpan cek list')
      setLogbook(json.logbook)
      toast.success(
        entri.length > 0
          ? `Cek list ${formatTanggal(tanggal)} tersimpan (${entri.length} kewenangan)`
          : `Cek list ${formatTanggal(tanggal)} dikosongkan`
      )
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Gagal menyimpan cek list')
    } finally {
      setMenyimpan(false)
    }
  }

  async function ajukan() {
    if (!logbook) return
    setMengajukan(true)
    try {
      const res = await fetch('/api/logbook/ajukan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logbookId: logbook.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal mengajukan laporan')
      setLogbook((prev) =>
        prev ? { ...prev, status: 'DIAJUKAN', submittedAt: new Date().toISOString() } : prev
      )
      toast.success('Laporan diajukan — menunggu verifikasi pimpinan fasyankes')
      setDialogAjukan(false)
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Gagal mengajukan laporan')
    } finally {
      setMengajukan(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Kontrol periode */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/40 p-3">
        <NotebookPen className="h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            Laporan Bulanan — {NAMA_BULAN[bulan - 1]} {tahun}
          </p>
          <p className="text-xs text-muted-foreground">
            Pengajuan {pengajuanKode} · {kewenangan.length} kewenangan disetujui ·{' '}
            {daftarLogbook.length} laporan tersimpan
          </p>
        </div>
        <StatusBadge status={logbook?.status ?? 'DRAFT'} />
        <div className="flex gap-2">
          <Select value={String(bulan)} onValueChange={(v) => gantiPeriode(Number(v), tahun)}>
            <SelectTrigger className="w-[135px] bg-background" aria-label="Pilih bulan">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NAMA_BULAN.map((n, i) => (
                <SelectItem key={n} value={String(i + 1)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(tahun)} onValueChange={(v) => gantiPeriode(bulan, Number(v))}>
            <SelectTrigger className="w-[100px] bg-background" aria-label="Pilih tahun">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tahunOptions.map((t) => (
                <SelectItem key={t} value={String(t)}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {logbook && <BannerStatus logbook={logbook} />}

      {/* Daftar kewenangan disetujui (referensi) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" /> Kewenangan Klinis Disetujui
          </CardTitle>
          <CardDescription>
            Berasal dari hasil rekomendasi tim kredensial (kode 1 atau 2) — hanya kewenangan
            inilah yang dicatat dalam logbook.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {kewenangan.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Belum ada kewenangan yang disetujui tim kredensial untuk pengajuan ini.
              </p>
            </div>
          ) : (
            kewenangan.map((k, i) => (
              <div key={k.id} className="flex items-start gap-3 rounded-xl border p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <p className="min-w-0 flex-1 text-sm font-medium leading-snug">{k.namaKewenangan}</p>
                <Badge
                  variant="outline"
                  className={
                    k.kodeRekomendasi === '1'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      : 'border-amber-300 bg-amber-50 text-amber-700'
                  }
                >
                  {k.kodeRekomendasi === '1' ? 'Penuh' : 'Supervisi'}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Cek list harian */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck2 className="h-5 w-5 text-primary" /> Cek List Harian
          </CardTitle>
          <CardDescription>
            Pilih tanggal pada kalender bulan {NAMA_BULAN[bulan - 1]}, lalu centang kewenangan
            yang dilaksanakan beserta jumlah kasusnya. Titik hijau menandai tanggal yang sudah
            ada isian.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {memuat ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Memuat laporan...
            </div>
          ) : kewenangan.length === 0 ? (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Cek list harian dapat diisi setelah ada kewenangan yang disetujui tim kredensial.
            </p>
          ) : (
            <div className="space-y-4">
              <HariGrid
                tahun={tahun}
                bulan={bulan}
                entri={logbook?.entri ?? []}
                terpilih={hari}
                pilihHari={pilihHari}
              />
              {hari != null && (
                <PanelCekHari
                  tanggal={tanggalIso(tahun, bulan, hari)}
                  kewenangan={kewenangan}
                  cek={cek}
                  setCek={setCek}
                  onSimpan={simpanHari}
                  menyimpan={menyimpan}
                  readOnly={readOnly}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rekap & pengajuan */}
      <Card>
        <CardHeader>
          <CardTitle>Rekap Laporan {NAMA_BULAN[bulan - 1]} {tahun}</CardTitle>
          <CardDescription>
            {totalHariTercatat > 0
              ? `${totalHariTercatat} hari tercatat dengan ${jumlahHariBulanIni} isian kegiatan.`
              : 'Belum ada isian pada bulan ini.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rekap.some((r) => r.hari > 0) ? (
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
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="p-3">
                          <p className="font-medium leading-snug">{r.namaKewenangan}</p>
                          {r.kodeRef && (
                            <p className="font-mono text-xs text-muted-foreground">{r.kodeRef}</p>
                          )}
                        </td>
                        <td className="p-3 tabular-nums">{r.hari}</td>
                        <td className="p-3 tabular-nums">{r.kasus}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Rekap akan muncul setelah Anda mengisi cek list harian.
            </p>
          )}

          {!readOnly && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <AlertCircle className="h-3.5 w-3.5" />
                Laporan bulanan wajib diverifikasi pimpinan fasyankes Anda.
              </p>
              <Button
                onClick={() => setDialogAjukan(true)}
                disabled={!logbook || jumlahHariBulanIni === 0 || mengajukan}
                className="min-h-[40px]"
              >
                {mengajukan ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Ajukan Verifikasi ke Pimpinan Fasyankes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Konfirmasi pengajuan */}
      <AlertDialog open={dialogAjukan} onOpenChange={setDialogAjukan}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ajukan laporan bulanan?</AlertDialogTitle>
            <AlertDialogDescription>
              Laporan {NAMA_BULAN[bulan - 1]} {tahun} berisi {jumlahHariBulanIni} isian cek list
              akan diajukan kepada pimpinan fasyankes Anda untuk diverifikasi. Setelah diajukan,
              isian terkunci sampai laporan diverifikasi atau diminta perbaikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mengajukan}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                ajukan()
              }}
              disabled={mengajukan}
            >
              {mengajukan ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Ajukan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
