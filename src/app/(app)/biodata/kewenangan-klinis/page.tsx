'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Loader2,
  Pencil,
  Plus,
  Info,
  Trash2,
  ListChecks,
  Search,
  ClipboardList,
  X,
  Download,
  Upload,
  FileCheck2,
} from 'lucide-react'
import { KODE_DIMINTA, KODE_REKOMENDASI } from '@/lib/constants'

type PengajuanRing = { id: string; kode: string; jenis: string; status: string }
type Kewenangan = {
  id: string; urutan: number; kodeRef: string | null; namaKewenangan: string
  kodeDiminta: string; kodeRekomendasi: string | null
}
type TemplateItem = { kode: string; nama: string; detail: string | null; kategori: string | null }
type TemplateResp = {
  profesi: string | null; sedia: boolean; total: number
  items: TemplateItem[]; pesan?: string
}
// v1.3.2 — status Formulir Kewenangan Klinis terunggah pada pengajuan terpilih
type FormulirStatus = {
  ada: boolean
  dokumen?: { id: string; namaFile: string; ukuran: number; tipeFile: string; updatedAt: string }
}

function ukuranTeks(n: number): string {
  return n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`
}

function formatTanggal(s: string): string {
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

const MAX_TAMPIL = 100

export default function KewenanganKlinisPage() {
  const [pengajuanList, setPengajuanList] = useState<PengajuanRing[]>([])
  const [selected, setSelected] = useState('')
  const [items, setItems] = useState<Kewenangan[]>([])
  const [loading, setLoading] = useState(true)
  const [template, setTemplate] = useState<TemplateResp | null>(null)
  const [busy, setBusy] = useState(false)

  // v1.3.2 — formulir kewenangan klinis: unduh PDF & unggah bertanda tangan
  const [formulir, setFormulir] = useState<FormulirStatus | null>(null)
  const [mengunggah, setMengunggah] = useState(false)
  const unggahRef = useRef<HTMLInputElement>(null)

  // dialog manual (tambah/sunting)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [edit, setEdit] = useState<Kewenangan | null>(null)
  const [form, setForm] = useState({ kodeRef: '', namaKewenangan: '', kodeDiminta: '1' })

  // dialog katalog template (ambil massal)
  const [katalogOpen, setKatalogOpen] = useState(false)
  const [cari, setCari] = useState('')
  const [kat, setKat] = useState('SEMUA')
  const [pilih, setPilih] = useState<Set<string>>(new Set())

  // pencari kode pada dialog manual
  const [cariKode, setCariKode] = useState('')

  useEffect(() => {
    (async () => {
      const [resP, resT] = await Promise.all([
        fetch('/api/pengajuan'),
        fetch('/api/kewenangan-template'),
      ])
      if (resP.ok) {
        const list: PengajuanRing[] = await resP.json()
        setPengajuanList(list)
        if (list.length > 0) setSelected((s) => s || list[0].id)
      }
      if (resT.ok) setTemplate(await resT.json())
      setLoading(false)
    })()
  }, [])

  const loadItems = useCallback(async (pid: string) => {
    const res = await fetch(`/api/pengajuan/${pid}/kewenangan`)
    if (res.ok) setItems(await res.json())
  }, [])

  useEffect(() => {
    if (!selected) return
    let cancelled = false
    fetch(`/api/pengajuan/${selected}/kewenangan`).then(async (res) => {
      if (res.ok && !cancelled) setItems(await res.json())
    })
    // v1.3.2 — status formulir bertanda tangan pengajuan ini
    fetch(`/api/asesi/formulir-kewenangan?pengajuanId=${selected}`)
      .then(async (res) => {
        if (!cancelled) setFormulir(res.ok ? await res.json() : { ada: false })
      })
      .catch(() => {
        if (!cancelled) setFormulir({ ada: false })
      })
    return () => {
      cancelled = true
    }
  }, [selected])

  const selectedP = pengajuanList.find((p) => p.id === selected)
  const editable = selectedP?.status === 'DRAFT'

  // kategori tersedia pada template (mis. Perawat: Diagnosa / Tindakan)
  const kategoriList = useMemo(() => {
    if (!template?.sedia) return []
    return Array.from(new Set(template.items.map((i) => i.kategori).filter(Boolean) as string[]))
  }, [template])

  const hasilFilter = useMemo(() => {
    if (!template?.sedia) return []
    const q = cari.trim().toLowerCase()
    return template.items.filter((i) => {
      if (kat !== 'SEMUA' && i.kategori !== kat) return false
      if (!q) return true
      return (
        i.kode.toLowerCase().includes(q) ||
        i.nama.toLowerCase().includes(q) ||
        (i.detail ?? '').toLowerCase().includes(q)
      )
    })
  }, [template, cari, kat])

  const kodeSudahAda = useMemo(
    () => new Set(items.map((i) => i.kodeRef).filter(Boolean) as string[]),
    [items]
  )

  const saranKode = useMemo(() => {
    if (!template?.sedia) return []
    const q = cariKode.trim().toLowerCase()
    if (!q) return []
    return template.items
      .filter(
        (i) =>
          i.kode.toLowerCase().includes(q) ||
          i.nama.toLowerCase().includes(q) ||
          (i.detail ?? '').toLowerCase().includes(q)
      )
      .slice(0, 30)
  }, [template, cariKode])

  function openAdd() {
    setEdit(null)
    setForm({ kodeRef: '', namaKewenangan: '', kodeDiminta: '1' })
    setCariKode('')
    setDialogOpen(true)
  }
  function openEdit(row: Kewenangan) {
    setEdit(row)
    setForm({ kodeRef: row.kodeRef ?? '', namaKewenangan: row.namaKewenangan, kodeDiminta: row.kodeDiminta })
    setCariKode('')
    setDialogOpen(true)
  }

  function togglePilih(kode: string, checked: boolean) {
    setPilih((prev) => {
      const next = new Set(prev)
      if (checked) next.add(kode)
      else next.delete(kode)
      return next
    })
  }

  async function simpanDariTemplate() {
    if (!selected || pilih.size === 0 || !template?.sedia) return
    setBusy(true)
    const dipilih = template.items
      .filter((i) => pilih.has(i.kode))
      .map((i) => ({ kodeRef: i.kode, namaKewenangan: i.nama }))
    const res = await fetch(`/api/pengajuan/${selected}/kewenangan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: dipilih }),
    })
    setBusy(false)
    const d = await res.json().catch(() => ({}))
    if (res.ok) {
      const lewati = dipilih.length - (Array.isArray(d) ? d.length : 0)
      toast.success(
        `${Array.isArray(d) ? d.length : dipilih.length} kewenangan ditambahkan dari template.` +
          (lewati > 0 ? ` ${lewati} item dilewati (sudah ada).` : '')
      )
      setPilih(new Set())
      setCari('')
      setKat('SEMUA')
      setKatalogOpen(false)
      loadItems(selected)
    } else {
      toast.error(d.error ?? 'Gagal menambahkan dari template')
    }
  }

  async function save() {
    if (!form.namaKewenangan.trim()) {
      toast.error('Nama diagnosa/keterampilan wajib diisi')
      return
    }
    setBusy(true)
    const res = await fetch(
      edit ? `/api/pengajuan/${selected}/kewenangan/${edit.id}` : `/api/pengajuan/${selected}/kewenangan`,
      {
        method: edit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, kodeRef: form.kodeRef || null }),
      }
    )
    setBusy(false)
    if (res.ok) {
      toast.success('Kewenangan klinis disimpan.')
      setDialogOpen(false)
      loadItems(selected)
    } else {
      const d = await res.json()
      toast.error(d.error ?? 'Gagal menyimpan')
    }
  }

  async function hapus(id: string) {
    const res = await fetch(`/api/pengajuan/${selected}/kewenangan/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Item dihapus.'); loadItems(selected) }
    else {
      const d = await res.json()
      toast.error(d.error ?? 'Gagal menghapus')
    }
  }

  // v1.3.2 — unggah formulir kewenangan klinis yang sudah diisi & ditandatangani
  async function unggahFormulir(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5 MB.')
      return
    }
    setMengunggah(true)
    try {
      const res = await fetch(`/api/asesi/formulir-kewenangan?pengajuanId=${selected}`, {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/pdf',
          'X-File-Name': encodeURIComponent(file.name),
        },
        body: await file.arrayBuffer(),
      })
      const data = await res.json().catch(() => null)
      if (res.ok) {
        toast.success(data?.pesan ?? 'Formulir berhasil diunggah.')
        const s = await fetch(`/api/asesi/formulir-kewenangan?pengajuanId=${selected}`)
        if (s.ok) setFormulir(await s.json())
      } else {
        toast.error(data?.error ?? 'Gagal mengunggah formulir.')
      }
    } catch {
      toast.error('Gagal mengunggah formulir — coba lagi.')
    } finally {
      setMengunggah(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rincian Kewenangan Klinis</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Daftar diagnosa/keterampilan yang Anda usulkan, mengacu pada daftar Kewenangan Klinis
            yang ditetapkan Kepala Dinas Kesehatan Kabupaten Kutai Barat.
          </p>
        </div>
        {/* v1.3.2 — unduh formulir PDF & unggah formulir bertanda tangan (kanan atas) */}
        {pengajuanList.length > 0 && (
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="outline" asChild>
              <a href={`/api/pengajuan/${selected}/kewenangan/formulir`}>
                <Download className="mr-1.5 h-4 w-4" /> Unduh Formulir (PDF)
              </a>
            </Button>
            <Button
              variant="outline"
              onClick={() => unggahRef.current?.click()}
              disabled={mengunggah}
            >
              {mengunggah ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-1.5 h-4 w-4" />
              )}
              Unggah Formulir
            </Button>
          </div>
        )}
      </div>
      <input
        ref={unggahRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) void unggahFormulir(f)
        }}
      />

      {pengajuanList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <ListChecks className="h-12 w-12 text-muted-foreground/40" />
            <p className="font-semibold">Belum ada pengajuan</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Rincian kewenangan klinis terhubung dengan pengajuan. Buat pengajuan terlebih
              dahulu pada menu Pengajuan.
            </p>
            <Button asChild className="mt-2">
              <Link href="/pengajuan">Ke Menu Pengajuan</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="max-w-sm space-y-1.5">
            <Label>Pilih Pengajuan</Label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih pengajuan..." />
              </SelectTrigger>
              <SelectContent>
                {pengajuanList.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.kode} · {p.jenis === 'KREDENSIAL' ? 'Kredensial' : 'Rekredensial'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* v1.3.2 — status formulir bertanda tangan */}
          {formulir?.ada && formulir.dokumen && (
            <div className="flex flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2">
                <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">Formulir bertanda tangan sudah diunggah</p>
                  <p className="text-xs text-emerald-800">
                    {formulir.dokumen.namaFile} · {ukuranTeks(formulir.dokumen.ukuran)} ·{' '}
                    {formatTanggal(formulir.dokumen.updatedAt)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" asChild>
                  <a href={`/api/dokumen/${formulir.dokumen.id}`} target="_blank">
                    Lihat
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => unggahRef.current?.click()}
                  disabled={mengunggah}
                >
                  Ganti
                </Button>
              </div>
            </div>
          )}

          {/* Sumber template sesuai profesi pada Riwayat Hidup */}
          {template && (
            <div
              className={
                template.sedia
                  ? 'flex items-start gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900'
                  : 'flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800'
              }
            >
              {template.sedia ? (
                <ClipboardList className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <div>
                {template.sedia ? (
                  <>
                    Profesi pada Riwayat Hidup Anda:{' '}
                    <span className="font-semibold">{template.profesi}</span> — daftar usulan
                    diambil dari <span className="font-semibold">Template Kewenangan Klinis standar Dinkes Kubar</span>{' '}
                    ({template.total} kewenangan).{' '}
                    <Link href="/biodata/formulir" className="underline underline-offset-2">
                      Ubah profesi
                    </Link>
                  </>
                ) : (
                  template.pesan
                )}
              </div>
            </div>
          )}

          {/* Legenda kode */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Kode untuk Tenaga Kesehatan Pengusul</CardTitle>
                <CardDescription>Gunakan sesuai kondisi kompetensi Anda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {Object.entries(KODE_DIMINTA).map(([kode, arti]) => (
                  <div key={kode} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                      {kode}
                    </span>
                    <span>{arti}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Kode untuk Tim Kredensial/Mitra Bestari</CardTitle>
                <CardDescription>Diisi oleh tim pada tahap penilaian</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {Object.entries(KODE_REKOMENDASI).map(([kode, arti]) => (
                  <div key={kode} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                      {kode}
                    </span>
                    <span>{arti}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {selectedP && !editable && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              Pengajuan {selectedP.kode} sudah dikirim, daftar ini tidak dapat diubah lagi.
            </div>
          )}

          <Card>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>Daftar Kewenangan Klinis Diusulkan</CardTitle>
                <CardDescription>
                  {items.length} item · {selectedP?.kode}
                  {template?.sedia ? ` · Template ${template.profesi}` : ''}
                </CardDescription>
              </div>
              {editable && (
                <div className="flex flex-wrap justify-end gap-2">
                  {template?.sedia && (
                    <Button size="sm" variant="outline" onClick={() => setKatalogOpen(true)}>
                      <Search className="mr-1.5 h-4 w-4" /> Ambil dari Template
                    </Button>
                  )}
                  <Button size="sm" onClick={openAdd}>
                    <Plus className="mr-1.5 h-4 w-4" /> Tambah Manual
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Belum ada kewenangan klinis yang diusulkan.
                  {editable &&
                    (template?.sedia
                      ? ' Gunakan "Ambil dari Template" untuk memilih dari daftar standar Dinkes.'
                      : ' Tambahkan minimal satu item sebelum mengajukan.')}
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">No</TableHead>
                        <TableHead className="w-28">Kode</TableHead>
                        <TableHead>Daftar Diagnosa/Keterampilan</TableHead>
                        <TableHead className="w-20">Diminta</TableHead>
                        <TableHead className="w-28">Rekomendasi</TableHead>
                        {editable && <TableHead className="w-24 text-right">Aksi</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((row, i) => (
                        <TableRow key={row.id}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell className="font-mono text-xs">{row.kodeRef ?? '-'}</TableCell>
                          <TableCell className="font-medium">
                            {row.namaKewenangan}
                            {row.kodeRef && template?.sedia && (
                              <Badge variant="secondary" className="ml-2 font-normal">
                                Template
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                              {row.kodeDiminta}
                            </span>
                          </TableCell>
                          <TableCell>
                            {row.kodeRekomendasi ? (
                              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-100 text-xs font-bold text-emerald-700">
                                {row.kodeRekomendasi}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          {editable && (
                            <TableCell className="text-right">
                              <Button size="icon" variant="ghost" onClick={() => openEdit(row)} aria-label="Sunting">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="icon" variant="ghost" className="text-red-600" aria-label="Hapus">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Hapus kewenangan?</AlertDialogTitle>
                                    <AlertDialogDescription>{row.namaKewenangan}</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => hapus(row.id)}>
                                      Hapus
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Dialog katalog template — ambil massal sesuai profesi */}
      <Dialog open={katalogOpen} onOpenChange={(o) => { setKatalogOpen(o); if (!o) { setPilih(new Set()); setCari(''); setKat('SEMUA') } }}>
        <DialogContent className="flex max-h-[85vh] flex-col gap-3 overflow-hidden sm:max-w-3xl">
          <DialogHeader className="shrink-0 space-y-1">
            <DialogTitle>
              Ambil dari Template {template?.sedia ? `— ${template.profesi}` : ''}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Daftar Kewenangan Klinis standar Dinkes Kubar ({template?.total ?? 0} kewenangan).
              Centang item lalu tambahkan ke usulan Anda. Gulir ke bawah/kanan bila daftar panjang.
            </p>
          </DialogHeader>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <div className="relative min-w-56 flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                placeholder="Cari kode atau nama kewenangan..."
                className="pl-8"
              />
            </div>
            {kategoriList.length > 0 && (
              <div className="flex gap-1.5">
                {['SEMUA', ...kategoriList].map((k) => (
                  <Button
                    key={k}
                    size="sm"
                    variant={kat === k ? 'default' : 'outline'}
                    className="h-9"
                    onClick={() => setKat(k)}
                  >
                    {k === 'SEMUA' ? 'Semua' : k}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Area daftar: gulir bebas atas-bawah & kiri-kanan; footer tetap terlihat */}
          <div className="min-h-0 flex-1 overflow-auto rounded-lg border">
            <div className="w-max min-w-full divide-y">
              {hasilFilter.length === 0 ? (
                <p className="whitespace-nowrap p-6 text-center text-sm text-muted-foreground">
                  Tidak ada hasil untuk pencarian &quot;{cari}&quot;.
                </p>
              ) : (
                hasilFilter.slice(0, MAX_TAMPIL).map((t) => {
                  const sudah = kodeSudahAda.has(t.kode)
                  return (
                    <label
                      key={t.kode}
                      className={
                        'flex cursor-pointer items-start gap-3 px-4 py-2.5 hover:bg-muted/60' +
                        (sudah ? ' cursor-not-allowed opacity-60' : '')
                      }
                    >
                      <Checkbox
                        className="mt-1 shrink-0"
                        checked={sudah || pilih.has(t.kode)}
                        disabled={sudah}
                        onCheckedChange={(v) => togglePilih(t.kode, v === true)}
                      />
                      <div className="min-w-0">
                        <p className="whitespace-nowrap text-sm font-medium leading-snug">
                          <span className="mr-2 font-mono text-xs text-muted-foreground">{t.kode}</span>
                          {t.nama}
                          {sudah && (
                            <Badge variant="secondary" className="ml-2 font-normal">
                              sudah diusulkan
                            </Badge>
                          )}
                        </p>
                        {t.detail && (
                          <p className="mt-0.5 whitespace-nowrap text-xs text-muted-foreground" title={t.detail}>
                            {t.detail}
                          </p>
                        )}
                        {t.kategori && (
                          <p className="mt-0.5 whitespace-nowrap text-[11px] uppercase tracking-wide text-muted-foreground/70">
                            {t.kategori}
                          </p>
                        )}
                      </div>
                    </label>
                  )
                })
              )}
            </div>
          </div>
          {hasilFilter.length > MAX_TAMPIL && (
            <p className="shrink-0 text-xs text-muted-foreground">
              Menampilkan {MAX_TAMPIL} dari {hasilFilter.length} hasil — perkaya kata kunci untuk
              mempersempit.
            </p>
          )}

          <DialogFooter className="shrink-0 items-center gap-2 border-t pt-3 sm:justify-between">
            <span className="text-sm text-muted-foreground">
              {pilih.size} item dipilih
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setKatalogOpen(false)}>
                Tutup
              </Button>
              <Button onClick={simpanDariTemplate} disabled={busy || pilih.size === 0}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Tambahkan {pilih.size > 0 ? `(${pilih.size})` : ''}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog tambah/sunting manual */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{edit ? 'Sunting' : 'Tambah'} Kewenangan Klinis</DialogTitle>
            {template?.sedia && !edit && (
              <p className="mt-1 text-sm text-muted-foreground">
                Ingin memilih dari daftar standar Dinkes? Gunakan{' '}
                <button
                  type="button"
                  className="underline underline-offset-2"
                  onClick={() => { setDialogOpen(false); setKatalogOpen(true) }}
                >
                  Ambil dari Template
                </button>
                .
              </p>
            )}
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label className="text-[13px]">
                Kode {template?.sedia ? `(template ${template.profesi})` : '(opsional)'}
              </Label>
              {form.kodeRef ? (
                <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
                  <Badge variant="secondary" className="font-mono">{form.kodeRef}</Badge>
                  <span className="min-w-0 flex-1 truncate text-sm">{form.namaKewenangan}</span>
                  {!edit && (
                    <button
                      type="button"
                      aria-label="Bersihkan kode"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setForm({ ...form, kodeRef: '', namaKewenangan: '' })}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <Input
                    value={cariKode}
                    onChange={(e) => setCariKode(e.target.value)}
                    placeholder={
                      template?.sedia
                        ? 'Cari kode/nama dari template... (boleh dikosongkan)'
                        : 'Tulis tanpa kode — isi nama di bawah'
                    }
                  />
                  {template?.sedia && saranKode.length > 0 && (
                    <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border bg-popover shadow-md">
                      <div className="w-max min-w-full">
                        {saranKode.map((s) => (
                          <button
                            key={s.kode}
                            type="button"
                            className="block w-full whitespace-nowrap px-3 py-2 text-left text-sm hover:bg-muted"
                            onClick={() => {
                              setForm({ ...form, kodeRef: s.kode, namaKewenangan: s.nama })
                              setCariKode('')
                            }}
                          >
                            <span className="mr-2 font-mono text-xs text-muted-foreground">{s.kode}</span>
                            {s.nama}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Daftar Diagnosa/Keterampilan</Label>
              <Input
                value={form.namaKewenangan}
                onChange={(e) => setForm({ ...form, namaKewenangan: e.target.value })}
                placeholder="Tulis nama diagnosa atau keterampilan"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Kode Permintaan (sebagai Pengusul)</Label>
              <Select value={form.kodeDiminta} onValueChange={(v) => setForm({ ...form, kodeDiminta: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(KODE_DIMINTA).map(([kode, arti]) => (
                    <SelectItem key={kode} value={kode}>
                      {kode} — {arti}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={save} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
