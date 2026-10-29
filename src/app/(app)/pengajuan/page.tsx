'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { StatusBadge } from '@/components/kredens/status-badge'
import { formatTanggal } from '@/lib/format'
import { JENIS_PENGAJUAN_LABELS, STATUS_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import {
  FilePlus2,
  Loader2,
  Send,
  Trash2,
  ChevronRight,
  Info,
  ListChecks,
  FileText,
  History,
} from 'lucide-react'
import type { Pengajuan, RiwayatStatus, KewenanganKlinis, JadwalKredensial } from '@prisma/client'

type PengajuanDetail = Pengajuan & {
  kewenangan: KewenanganKlinis[]
  jadwal: JadwalKredensial[]
  riwayat: RiwayatStatus[]
}

const STEP_ORDER = [
  'DRAFT',
  'DIAJUKAN',
  'VERIFIKASI',
  'PENILAIAN_TIM',
  'REKOMENDASI_TIM',
  'KETETAPAN_KADIS',
  'SURAT_PENUGASAN',
  'SELESAI',
]

export default function PengajuanPage() {
  const [list, setList] = useState<PengajuanDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [jenis, setJenis] = useState('KREDENSIAL')
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/pengajuan')
    if (res.ok) setList(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/pengajuan').then(async (res) => {
      if (!cancelled) {
        if (res.ok) setList(await res.json())
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [load])

  async function handleCreate() {
    setCreating(true)
    const res = await fetch('/api/pengajuan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jenis }),
    })
    setCreating(false)
    if (res.ok) {
      toast.success('Pengajuan berhasil dibuat. Lengkapi biodata sebelum mengajukan.')
      setCreateOpen(false)
      load()
    } else {
      toast.error('Gagal membuat pengajuan')
    }
  }

  async function handleSubmit(id: string) {
    const res = await fetch(`/api/pengajuan/${id}/submit`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      toast.success('Pengajuan berhasil dikirim ke operator kredensial.')
      load()
    } else {
      toast.error(data.error ?? 'Gagal mengajukan')
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/pengajuan/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Draf pengajuan dihapus.')
      load()
    } else {
      const d = await res.json()
      toast.error(d.error ?? 'Gagal menghapus')
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pengajuan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola permohonan kredensial dan rekredensial kewenangan klinis Anda.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <FilePlus2 className="mr-2 h-4 w-4" /> Buat Pengajuan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pengajuan Baru</DialogTitle>
              <DialogDescription>
                Pilih jenis pengajuan kewenangan klinis.
              </DialogDescription>
            </DialogHeader>
            <RadioGroup value={jenis} onValueChange={setJenis} className="gap-3">
              <Label
                htmlFor="jenis-kred"
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                  jenis === 'KREDENSIAL' && 'border-primary bg-primary/5'
                )}
              >
                <RadioGroupItem value="KREDENSIAL" id="jenis-kred" className="mt-0.5" />
                <div>
                  <p className="font-semibold">Kredensial</p>
                  <p className="text-xs font-normal text-muted-foreground">
                    Permohonan pertama penetapan kewenangan klinis.
                  </p>
                </div>
              </Label>
              <Label
                htmlFor="jenis-rekred"
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                  jenis === 'REKREDENSIAL' && 'border-primary bg-primary/5'
                )}
              >
                <RadioGroupItem value="REKREDENSIAL" id="jenis-rekred" className="mt-0.5" />
                <div>
                  <p className="font-semibold">Rekredensial</p>
                  <p className="text-xs font-normal text-muted-foreground">
                    Pembaruan/perubahan kewenangan klinis yang sudah berlaku.
                  </p>
                </div>
              </Label>
            </RadioGroup>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Buat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <FilePlus2 className="h-12 w-12 text-muted-foreground/40" />
            <p className="font-semibold">Belum ada pengajuan</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Buat pengajuan baru, lalu lengkapi formulir dan rincian kewenangan klinis pada menu
              Biodata sebelum mengajukan.
            </p>
            <Button onClick={() => setCreateOpen(true)} className="mt-2">
              <FilePlus2 className="mr-2 h-4 w-4" /> Buat Pengajuan Sekarang
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {list.map((p) => (
            <PengajuanCard
              key={p.id}
              p={p}
              onSubmit={handleSubmit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PengajuanCard({
  p,
  onSubmit,
  onDelete,
}: {
  p: PengajuanDetail
  onSubmit: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const currentIdx = STEP_ORDER.indexOf(p.status)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="font-mono text-base">{p.kode}</CardTitle>
              <StatusBadge status={p.status} />
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                {JENIS_PENGAJUAN_LABELS[p.jenis]}
              </span>
            </div>
            <CardDescription className="mt-1.5">
              Dibuat {formatTanggal(p.createdAt)}
              {p.submittedAt ? ` · Diajukan ${formatTanggal(p.submittedAt)}` : ''}
              {p.kewenangan.length > 0 ? ` · ${p.kewenangan.length} kewenangan diusulkan` : ''}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {p.status === 'DRAFT' && (
              <>
                <Button size="sm" onClick={() => onSubmit(p.id)}>
                  <Send className="mr-1.5 h-3.5 w-3.5" /> Ajukan
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" className="text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus draf pengajuan?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Draf {p.kode} beserta seluruh isi formulir dan kewenangan klinis akan
                        dihapus permanen.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => onDelete(p.id)}
                      >
                        Hapus
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>
              {open ? 'Tutup' : 'Detail'} <ChevronRight className={cn('ml-1 h-4 w-4 transition-transform', open && 'rotate-90')} />
            </Button>
          </div>
        </div>
      </CardHeader>
      {open && (
        <CardContent className="space-y-5 border-t pt-5">
          {/* Timeline status */}
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <History className="h-4 w-4 text-primary" /> Alur Proses
            </h3>
            <div className="grid gap-2 sm:grid-cols-4">
              {STEP_ORDER.map((step, idx) => {
                const done = idx <= currentIdx && p.status !== 'DRAFT'
                return (
                  <div
                    key={step}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-xs font-medium',
                      idx === currentIdx
                        ? 'border-primary bg-primary/5 text-primary'
                        : done
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-border text-muted-foreground'
                    )}
                  >
                    {idx + 1}. {STATUS_LABELS[step]}
                  </div>
                )
              })}
            </div>
            {(p.riwayat?.length ?? 0) > 0 && (
              <div className="mt-3 space-y-1.5">
                {p.riwayat.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-baseline gap-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{STATUS_LABELS[r.status] ?? r.status}</span>
                    <span>{r.keterangan}</span>
                    <span className="text-muted-foreground/70">
                      {formatTanggal(r.createdAt)} · {r.oleh ?? '-'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Ringkasan isi */}
          <section className="grid gap-3 sm:grid-cols-3">
            <Link
              href="/biodata/formulir"
              className="flex items-center gap-3 rounded-xl border p-4 transition-colors hover:bg-accent"
            >
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Formulir</p>
                <p className="text-xs text-muted-foreground">STR, SIP, sertifikasi</p>
              </div>
            </Link>
            <Link
              href="/biodata/kewenangan-klinis"
              className="flex items-center gap-3 rounded-xl border p-4 transition-colors hover:bg-accent"
            >
              <ListChecks className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Kewenangan Klinis</p>
                <p className="text-xs text-muted-foreground">{p.kewenangan.length} item diusulkan</p>
              </div>
            </Link>
            <Link
              href="/kredensialing/rekomendasi-tim"
              className="flex items-center gap-3 rounded-xl border p-4 transition-colors hover:bg-accent"
            >
              <Info className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Hasil Kredensialing</p>
                <p className="text-xs text-muted-foreground">Rekomendasi tim &amp; kadis</p>
              </div>
            </Link>
          </section>
        </CardContent>
      )}
    </Card>
  )
}
