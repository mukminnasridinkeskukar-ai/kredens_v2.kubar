'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { CheckCircle2, ClipboardCheck, RotateCcw, Stamp, Users } from 'lucide-react'

export type OpsiAsesor = {
  id: string
  nama: string
  jabatan?: string | null
  instansi?: string | null
  email: string
  /** v2.1 — penanda akun yang menjalankan fungsi ASESOR sebagai fungsi tambahan */
  role?: string
  peranEkstra?: string | null
}

type Aksi =
  | 'MULAI_VERIFIKASI'
  | 'VERIFIKASI_LANJUT'
  | 'KEMBALIKAN_DRAF'
  | 'TANDAI_SELESAI'

const LABEL: Record<Aksi, { teks: string; icon: React.ElementType; variant?: 'default' | 'outline' | 'destructive' }> = {
  MULAI_VERIFIKASI: { teks: 'Mulai Verifikasi Berkas', icon: ClipboardCheck },
  VERIFIKASI_LANJUT: { teks: 'Lolos Verifikasi — Lanjut ke Penilaian Tim', icon: CheckCircle2 },
  KEMBALIKAN_DRAF: { teks: 'Kembalikan ke Asesi (Draf)', icon: RotateCcw, variant: 'outline' },
  TANDAI_SELESAI: { teks: 'Tandai Proses Selesai', icon: Stamp },
}

export function StatusAksi({
  pengajuanId,
  aksiList,
  asesorList = [],
}: {
  pengajuanId: string
  aksiList: Aksi[]
  /** Daftar asesor aktif. Wajib untuk aksi VERIFIKASI_LANJUT — operator
   * memilih tepat tiga asesor penilai sebelum pengajuan diteruskan. */
  asesorList?: OpsiAsesor[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [dialogTerbuka, setDialogTerbuka] = useState(false)
  const [terpilih, setTerpilih] = useState<string[]>([])

  const dipilihValid = terpilih.length === 3

  function toggleAsesor(id: string, ceklis: boolean) {
    setTerpilih((prev) => {
      if (!ceklis) return prev.filter((v) => v !== id)
      if (prev.includes(id)) return prev
      if (prev.length >= 3) {
        toast.info('Maksimal tiga asesor — hapus pilihan lain terlebih dahulu.')
        return prev
      }
      return [...prev, id]
    })
  }

  const namaTerpilih = useMemo(
    () =>
      terpilih
        .map((id) => asesorList.find((a) => a.id === id)?.nama ?? '')
        .filter(Boolean),
    [terpilih, asesorList]
  )

  async function kirimLanjut() {
    setLoading('VERIFIKASI_LANJUT')
    try {
      const res = await fetch('/api/staf/pengajuan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pengajuanId,
          aksi: 'VERIFIKASI_LANJUT',
          asesorIds: terpilih,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? 'Gagal memproses aksi')
        return
      }
      toast.success(
        `Berkas diteruskan ke penilaian tim — 3 asesor ditetapkan: ${namaTerpilih.join(', ')}`
      )
      setDialogTerbuka(false)
      setTerpilih([])
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setLoading(null)
    }
  }

  async function jalankan(aksi: Aksi) {
    if (aksi === 'VERIFIKASI_LANJUT') {
      setTerpilih([])
      setDialogTerbuka(true)
      return
    }
    setLoading(aksi)
    try {
      const res = await fetch('/api/staf/pengajuan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pengajuanId, aksi }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? 'Gagal memproses aksi')
        return
      }
      toast.success('Status pengajuan berhasil diperbarui')
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {aksiList.map((a) => {
        const l = LABEL[a]
        const Icon = l.icon
        return (
          <Button
            key={a}
            variant={l.variant ?? 'default'}
            onClick={() => jalankan(a)}
            disabled={loading != null}
          >
            <Icon className="mr-2 h-4 w-4" />
            {loading === a ? 'Memproses…' : l.teks}
          </Button>
        )
      })}

      <Dialog open={dialogTerbuka} onOpenChange={setDialogTerbuka}>
        <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-xl">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Tetapkan Tiga Asesor Penilai
            </DialogTitle>
            <DialogDescription>
              Berkas dinyatakan lengkap. Pilih <span className="font-semibold">tepat tiga</span>{' '}
              asesor — hanya ketiganya yang dapat melakukan penilaian pada pengajuan ini.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1">
            {asesorList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-6 text-center text-sm text-amber-800">
                Belum ada akun Asesor yang aktif. Aktifkan pendaftaran asesor terlebih dahulu
                melalui menu Kelola Akun.
              </div>
            ) : (
              <div className="space-y-2">
                {asesorList.map((a) => {
                  const dicek = terpilih.includes(a.id)
                  return (
                    <label
                      key={a.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                        dicek ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={dicek}
                        onCheckedChange={(v) => toggleAsesor(a.id, v === true)}
                        className="mt-0.5"
                        aria-label={`Pilih ${a.nama}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold leading-tight">
                          {a.nama}
                          {a.role && a.role !== 'ASESOR' && (
                            <span className="rounded-full border border-dashed border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                              fungsi tambahan
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {[a.jabatan, a.instansi].filter(Boolean).join(' · ') || 'Asesor Kredensial'}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{a.email}</p>
                      </div>
                      {dicek && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                          #{terpilih.indexOf(a.id) + 1}
                        </span>
                      )}
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          <DialogFooter className="mt-2 shrink-0 flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              <span
                className={`inline-flex h-6 items-center rounded-full px-2 ${
                  dipilihValid ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-foreground'
                }`}
              >
                {terpilih.length}/3 asesor dipilih
              </span>
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDialogTerbuka(false)} disabled={loading != null}>
                Batal
              </Button>
              <Button onClick={kirimLanjut} disabled={!dipilihValid || loading != null}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {loading === 'VERIFIKASI_LANJUT' ? 'Memproses…' : 'Lolos & Teruskan'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
