'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Database, Download, FileUp, Loader2, Trash2, Upload } from 'lucide-react'
import { CONTOH_CSV } from '@/lib/csv'

type Rekap = { profesi: string; jumlah: number }
type RekapResp = { total: number; profesiValid: string[]; rekap: Rekap[] }
type Item = { id: string; kode: string; nama: string; detail: string | null; kategori: string | null; urutan: number }
type ImporResp = {
  ok?: boolean; dibaca?: number; masuk?: number; duplikat?: number; delimiter?: string
  rekap?: Rekap[]
  error?: string; errors?: { baris: number; pesan: string }[]; totalErrors?: number
}

export function TemplateManager() {
  const [rekap, setRekap] = useState<RekapResp | null>(null)
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [imporBusy, setImporBusy] = useState(false)
  const [hasil, setHasil] = useState<ImporResp | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // penampil isi satu profesi
  const [lihat, setLihat] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [itemsBusy, setItemsBusy] = useState(false)

  const muatRekap = useCallback(async () => {
    const res = await fetch('/api/template-kewenangan')
    if (res.ok) setRekap(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    let off = false
    ;(async () => {
      const res = await fetch('/api/template-kewenangan')
      if (res.ok && !off) setRekap(await res.json())
      if (!off) setLoading(false)
    })()
    return () => {
      off = true
    }
  }, [])

  useEffect(() => {
    if (!lihat) return
    let off = false
    ;(async () => {
      try {
        const res = await fetch(`/api/template-kewenangan?profesi=${encodeURIComponent(lihat)}`)
        if (res.ok && !off) {
          const d = await res.json()
          setItems(Array.isArray(d) ? d : (d.items ?? []))
        }
      } finally {
        if (!off) setItemsBusy(false)
      }
    })()
    return () => {
      off = true
    }
  }, [lihat])

  function pilihLihat(v: string) {
    setLihat(v)
    setItems([])
    setItemsBusy(v !== '')
  }

  function unduhContoh() {
    const blob = new Blob(['\ufeff' + CONTOH_CSV], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'contoh-template-kewenangan.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function impor() {
    if (!file) return
    setImporBusy(true)
    setHasil(null)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/template-kewenangan', { method: 'POST', body: fd })
    const d: ImporResp = await res.json().catch(() => ({ error: 'Respons tidak valid' }))
    setImporBusy(false)
    setHasil(d)
    if (res.ok) {
      toast.success(`${d.masuk} kewenangan masuk, ${d.duplikat} duplikat dilewati.`)
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
      muatRekap()
    } else {
      toast.error(d.error ?? 'Impor gagal')
    }
  }

  async function hapusProfesi(p: string) {
    const res = await fetch(`/api/template-kewenangan?profesi=${encodeURIComponent(p)}`, { method: 'DELETE' })
    const d = await res.json().catch(() => ({}))
    if (res.ok) {
      toast.success(`Template ${p} dihapus (${d.terhapus} item).`)
      if (lihat === p) { setLihat(''); setItems([]) }
      muatRekap()
    } else {
      toast.error(d.error ?? 'Gagal menghapus')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const sudahAda = new Set((rekap?.rekap ?? []).map((r) => r.profesi))

  return (
    <div className="space-y-6">
      {/* Rekap per profesi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4" /> Template Tersedia
          </CardTitle>
          <CardDescription>
            Total {rekap?.total ?? 0} kewenangan terbagi pada {rekap?.rekap.length ?? 0} profesi.
            Asesi hanya melihat template sesuai jenis profesi pada Riwayat Hidupnya.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {rekap && rekap.rekap.length > 0 ? (
            rekap.rekap.map((r) => (
              <div
                key={r.profesi}
                className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2"
              >
                <span className="text-sm font-medium">{r.profesi}</span>
                <Badge variant="secondary">{r.jumlah}</Badge>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-red-600" aria-label={`Hapus ${r.profesi}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus template {r.profesi}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Seluruh {r.jumlah} kewenangan profesi {r.profesi} akan dihapus. Usulan asesi
                        yang sudah tersimpan tidak ikut terhapus. Anda dapat mengunggah ulang CSV
                        kapan saja.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => hapusProfesi(r.profesi)}>
                        Hapus
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada template. Unggah CSV di bawah.</p>
          )}
        </CardContent>
      </Card>

      {/* Unggah CSV */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileUp className="h-4 w-4" /> Unggah Template (CSV)
          </CardTitle>
          <CardDescription>
            Tambah kewenangan untuk profesi lain secara massal. Delimiter koma, titik-koma, atau
            tab didukung otomatis. Seluruh baris ditolak bila ada satu saja baris bermasalah.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="max-w-sm"
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); setHasil(null) }}
            />
            <Button onClick={impor} disabled={!file || imporBusy}>
              {imporBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Impor CSV
            </Button>
            <Button variant="outline" onClick={unduhContoh}>
              <Download className="mr-2 h-4 w-4" /> Unduh contoh CSV
            </Button>
          </div>

          <div className="space-y-1.5 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Format kolom (baris pertama = header):</p>
            <p><code className="rounded bg-muted px-1.5 py-0.5 text-xs">profesi,kode,nama,detail,kategori,urutan</code> — hanya <b>profesi, kode, nama</b> yang wajib.</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {rekap?.profesiValid.map((p) => (
                <Badge
                  key={p}
                  variant={sudahAda.has(p) ? 'secondary' : 'outline'}
                  className="font-normal"
                >
                  {p}{sudahAda.has(p) ? ` (${rekap.rekap.find((r) => r.profesi === p)?.jumlah})` : ''}
                </Badge>
              ))}
            </div>
          </div>

          {hasil && !hasil.ok && hasil.errors && hasil.errors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <p className="font-semibold">
                {hasil.totalErrors} baris bermasalah (menampilkan maks 20):
              </p>
              <ul className="mt-1.5 max-h-40 space-y-0.5 overflow-auto">
                {hasil.errors.map((e) => (
                  <li key={e.baris}>Baris {e.baris}: {e.pesan}</li>
                ))}
              </ul>
            </div>
          )}
          {hasil?.ok && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              Impor sukses: {hasil.masuk} kewenangan masuk, {hasil.duplikat} duplikat dilewati
              (delimiter terbaca: {hasil.delimiter === '\t' ? 'tab' : hasil.delimiter}).
            </div>
          )}
        </CardContent>
      </Card>

      {/* Penampil isi template */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lihat Isi Template</CardTitle>
          <CardDescription>
            Gulir ke bawah/kanan bila daftar panjang.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="max-w-sm space-y-1.5">
            <Label>Pilih Profesi</Label>
            <Select value={lihat} onValueChange={pilihLihat}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih profesi..." />
              </SelectTrigger>
              <SelectContent>
                {(rekap?.rekap ?? []).map((r) => (
                  <SelectItem key={r.profesi} value={r.profesi}>
                    {r.profesi} ({r.jumlah})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {lihat && (
            <div className="max-h-[50vh] overflow-auto rounded-lg border">
              {itemsBusy ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : items.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">Tidak ada item.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">No</TableHead>
                      <TableHead className="w-28">Kode</TableHead>
                      <TableHead>Daftar Diagnosa/Keterampilan</TableHead>
                      <TableHead className="w-36">Kategori</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((it, i) => (
                      <TableRow key={it.id}>
                        <TableCell>{it.urutan || i + 1}</TableCell>
                        <TableCell className="whitespace-nowrap font-mono text-xs">{it.kode}</TableCell>
                        <TableCell className="whitespace-nowrap">{it.nama}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {it.kategori ?? '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
