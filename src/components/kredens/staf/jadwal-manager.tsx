'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { CalendarPlus, Pencil, Trash2 } from 'lucide-react'
import { JADWAL_TAHAP, JADWAL_STATUS } from '@/lib/constants'
import { formatTanggal } from '@/lib/format'

export type BarisJadwal = {
  id: string
  tanggal: string
  waktu: string | null
  tempat: string | null
  tahap: string
  keterangan: string | null
  status: string
  pengajuanId: string | null
  pengajuan?: { kode: string } | null
}

export type OpsiPengajuan = { id: string; kode: string; nama: string }

const KOSONG = {
  id: '',
  tanggal: '',
  waktu: '',
  tempat: '',
  tahap: 'TELAAH_BERKAS',
  status: 'TERJADWAL',
  pengajuanId: '',
  keterangan: '',
}

export function JadwalManager({
  jadwalList,
  pengajuanOptions,
}: {
  jadwalList: BarisJadwal[]
  pengajuanOptions: OpsiPengajuan[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ ...KOSONG })
  const [saving, setSaving] = useState(false)
  const [hapusId, setHapusId] = useState<string | null>(null)

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function bukaBaru() {
    setForm({ ...KOSONG })
    setOpen(true)
  }

  function bukaEdit(j: BarisJadwal) {
    setForm({
      id: j.id,
      tanggal: j.tanggal,
      waktu: j.waktu ?? '',
      tempat: j.tempat ?? '',
      tahap: j.tahap,
      status: j.status,
      pengajuanId: j.pengajuanId ?? '',
      keterangan: j.keterangan ?? '',
    })
    setOpen(true)
  }

  async function simpan() {
    if (!form.tanggal || !form.tahap) {
      toast.error('Tanggal dan tahap wajib diisi')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/jadwal', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(form.id ? { id: form.id } : {}),
          tanggal: form.tanggal,
          waktu: form.waktu || null,
          tempat: form.tempat || null,
          tahap: form.tahap,
          status: form.status,
          pengajuanId: form.pengajuanId || null,
          keterangan: form.keterangan || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? 'Gagal menyimpan jadwal')
        return
      }
      toast.success(form.id ? 'Jadwal diperbarui' : 'Jadwal dibuat')
      setOpen(false)
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setSaving(false)
    }
  }

  async function hapus() {
    if (!hapusId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/jadwal?id=${hapusId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? 'Gagal menghapus jadwal')
        return
      }
      toast.success('Jadwal dihapus')
      setHapusId(null)
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setSaving(false)
    }
  }

  const warnaStatus: Record<string, string> = {
    TERJADWAL: 'bg-amber-50 text-amber-700 border-amber-200',
    SELESAI: 'bg-green-100 text-green-800 border-green-300',
    DIBATALKAN: 'bg-slate-100 text-slate-600 border-slate-200',
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Semua Jadwal Kredensial</CardTitle>
          <CardDescription>
            Kelola agenda telaah berkas, asesmen, penilaian lapangan, rekomendasi, dan ketetapan.
          </CardDescription>
        </div>
        <Button onClick={bukaBaru}>
          <CalendarPlus className="mr-2 h-4 w-4" /> Buat Jadwal
        </Button>
      </CardHeader>
      <CardContent>
        {jadwalList.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Belum ada jadwal. Buat jadwal untuk pengajuan yang sedang berjalan.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="p-3 font-semibold">Tanggal</th>
                  <th className="p-3 font-semibold">Tahap</th>
                  <th className="p-3 font-semibold">Pengajuan</th>
                  <th className="p-3 font-semibold">Tempat / Waktu</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {jadwalList.map((j) => (
                  <tr key={j.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{formatTanggal(j.tanggal)}</td>
                    <td className="p-3">{JADWAL_TAHAP[j.tahap] ?? j.tahap}</td>
                    <td className="p-3 font-mono text-xs">{j.pengajuan?.kode ?? '—'}</td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {j.tempat ?? '—'}
                      {j.waktu ? ` · ${j.waktu}` : ''}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className={warnaStatus[j.status] ?? ''}>
                        {JADWAL_STATUS[j.status] ?? j.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => bukaEdit(j)} aria-label="Ubah jadwal">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setHapusId(j.id)}
                          aria-label="Hapus jadwal"
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{form.id ? 'Ubah Jadwal' : 'Buat Jadwal Kredensial'}</DialogTitle>
              <DialogDescription>
                Jadwal akan terlihat oleh asesi pada menu Jadwal Kredensial.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="j-tanggal">Tanggal *</Label>
                <Input id="j-tanggal" type="date" value={form.tanggal} onChange={(e) => set('tanggal', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="j-waktu">Waktu</Label>
                <Input
                  id="j-waktu"
                  value={form.waktu}
                  onChange={(e) => set('waktu', e.target.value)}
                  placeholder="08.00 - 12.00 WITA"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="j-tahap">Tahap *</Label>
                <select
                  id="j-tahap"
                  value={form.tahap}
                  onChange={(e) => set('tahap', e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {Object.entries(JADWAL_TAHAP).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="j-status">Status</Label>
                <select
                  id="j-status"
                  value={form.status}
                  onChange={(e) => set('status', e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {Object.entries(JADWAL_STATUS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="j-pengajuan">Pengajuan Terkait (opsional)</Label>
                <select
                  id="j-pengajuan"
                  value={form.pengajuanId}
                  onChange={(e) => set('pengajuanId', e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">— Umum / tanpa pengajuan —</option>
                  {pengajuanOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.kode} · {o.nama}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="j-tempat">Tempat</Label>
                <Input
                  id="j-tempat"
                  value={form.tempat}
                  onChange={(e) => set('tempat', e.target.value)}
                  placeholder="Ruang Rapat Dinas Kesehatan Kubar"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="j-ket">Keterangan</Label>
                <Textarea id="j-ket" rows={2} value={form.keterangan} onChange={(e) => set('keterangan', e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button onClick={simpan} disabled={saving}>
                {saving ? 'Menyimpan…' : 'Simpan Jadwal'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={hapusId != null} onOpenChange={(o) => !o && setHapusId(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Hapus jadwal ini?</DialogTitle>
              <DialogDescription>Jadwal yang dihapus tidak dapat dikembalikan.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setHapusId(null)}>
                Batal
              </Button>
              <Button variant="destructive" onClick={hapus} disabled={saving}>
                {saving ? 'Menghapus…' : 'Hapus'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
