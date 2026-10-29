'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { FileSignature, Save } from 'lucide-react'

export type SpkAwal = {
  nomorSpk: string | null
  tanggalSpk: string | null
  uptd: string | null
  nomorSkKewenangan: string | null
  berlakuSampai: string | null
  kepalaUptd: string | null
} | null

export function SpkForm({
  pengajuanId,
  awal,
  namaPimpinan,
}: {
  pengajuanId: string
  awal: SpkAwal
  namaPimpinan: string
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    nomorSpk: awal?.nomorSpk ?? '',
    tanggalSpk: awal?.tanggalSpk ?? '',
    uptd: awal?.uptd ?? '',
    nomorSkKewenangan: awal?.nomorSkKewenangan ?? '',
    berlakuSampai: awal?.berlakuSampai ?? '',
    kepalaUptd: awal?.kepalaUptd ?? namaPimpinan,
  })
  const [saving, setSaving] = useState(false)

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function simpan() {
    if (!form.nomorSpk.trim()) {
      toast.error('Nomor SPK wajib diisi')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/staf/spk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pengajuanId, ...form }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? 'Gagal menyimpan SPK')
        return
      }
      toast.success('Surat Penugasan Klinis berhasil diterbitkan')
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSignature className="h-5 w-5 text-primary" /> Penerbitan Surat Penugasan Klinis
        </CardTitle>
        <CardDescription>
          Diterbitkan Kepala UPTD/Fasyankes berdasarkan ketetapan kewenangan klinis dari Dinas
          Kesehatan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="nomorSpk">Nomor SPK *</Label>
            <Input
              id="nomorSpk"
              value={form.nomorSpk}
              onChange={(e) => set('nomorSpk', e.target.value)}
              placeholder="800/0122/PKM-TGR/2025"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tanggalSpk">Tanggal SPK</Label>
            <Input
              id="tanggalSpk"
              type="date"
              value={form.tanggalSpk}
              onChange={(e) => set('tanggalSpk', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="uptd">UPTD / Fasyankes</Label>
            <Input id="uptd" value={form.uptd} onChange={(e) => set('uptd', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nomorSk">Nomor SK Ketetapan Kewenangan</Label>
            <Input
              id="nomorSk"
              value={form.nomorSkKewenangan}
              onChange={(e) => set('nomorSkKewenangan', e.target.value)}
              placeholder="800/233/DKK/2025"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="berlaku">Penugasan Berlaku Sampai</Label>
            <Input
              id="berlaku"
              type="date"
              value={form.berlakuSampai}
              onChange={(e) => set('berlakuSampai', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kepala">Nama Kepala UPTD</Label>
            <Input id="kepala" value={form.kepalaUptd} onChange={(e) => set('kepalaUptd', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={simpan} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Menyimpan…' : 'Terbitkan Surat Penugasan'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
