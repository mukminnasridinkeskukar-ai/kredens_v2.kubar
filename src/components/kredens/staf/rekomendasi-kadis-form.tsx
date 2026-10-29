'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { FileBadge, Save } from 'lucide-react'

export type RekomendasiKadisAwal = {
  nomorSurat: string | null
  tanggalSurat: string | null
  sifat: string | null
  lampiran: string | null
  hal: string | null
  refSuratNomor: string | null
  refSuratTanggal: string | null
  tujuanUptd: string | null
  tempat: string | null
  ketetapanNomor: string | null
  ketetapanTanggal: string | null
  ketetapanBerlakuSampai: string | null
  catatan: string | null
} | null

export function RekomendasiKadisForm({
  pengajuanId,
  awal,
  fasyankes,
}: {
  pengajuanId: string
  awal: RekomendasiKadisAwal
  fasyankes: string | null
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    nomorSurat: awal?.nomorSurat ?? '',
    tanggalSurat: awal?.tanggalSurat ?? '',
    sifat: awal?.sifat ?? 'Biasa',
    lampiran: awal?.lampiran ?? '1 (satu) Berkas',
    hal: awal?.hal ?? 'Rekomendasi Penetapan Kewenangan Klinis',
    refSuratNomor: awal?.refSuratNomor ?? '',
    refSuratTanggal: awal?.refSuratTanggal ?? '',
    tujuanUptd: awal?.tujuanUptd ?? fasyankes ?? '',
    tempat: awal?.tempat ?? 'Sendawar',
    ketetapanNomor: awal?.ketetapanNomor ?? '',
    ketetapanTanggal: awal?.ketetapanTanggal ?? '',
    ketetapanBerlakuSampai: awal?.ketetapanBerlakuSampai ?? '',
    catatan: awal?.catatan ?? '',
  })
  const [saving, setSaving] = useState(false)

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function simpan() {
    if (!form.nomorSurat.trim()) {
      toast.error('Nomor surat rekomendasi wajib diisi')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/staf/rekomendasi-kadis', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pengajuanId, ...form }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? 'Gagal menyimpan surat rekomendasi')
        return
      }
      toast.success('Surat rekomendasi berhasil diterbitkan')
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
          <FileBadge className="h-5 w-5 text-primary" /> Surat Rekomendasi & Ketetapan Kewenangan
        </CardTitle>
        <CardDescription>
          Diterbitkan Kepala Dinas Kesehatan setelah tim kredensial menetapkan rekomendasi.
          Penerbitan meneruskan pengajuan ke tahap Pimpinan Fasyankes (SPK).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="nomorSurat">Nomor Surat *</Label>
            <Input
              id="nomorSurat"
              value={form.nomorSurat}
              onChange={(e) => set('nomorSurat', e.target.value)}
              placeholder="900/451/DKK/2025"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tanggalSurat">Tanggal Surat</Label>
            <Input
              id="tanggalSurat"
              type="date"
              value={form.tanggalSurat}
              onChange={(e) => set('tanggalSurat', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sifat">Sifat</Label>
            <Input id="sifat" value={form.sifat} onChange={(e) => set('sifat', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lampiran">Lampiran</Label>
            <Input id="lampiran" value={form.lampiran} onChange={(e) => set('lampiran', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hal">Hal</Label>
            <Input id="hal" value={form.hal} onChange={(e) => set('hal', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tempat">Tempat</Label>
            <Input id="tempat" value={form.tempat} onChange={(e) => set('tempat', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="refNomor">Surat Permohonan — Nomor</Label>
            <Input
              id="refNomor"
              value={form.refSuratNomor}
              onChange={(e) => set('refSuratNomor', e.target.value)}
              placeholder="072/045/PMK/2025"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="refTanggal">Surat Permohonan — Tanggal</Label>
            <Input
              id="refTanggal"
              type="date"
              value={form.refSuratTanggal}
              onChange={(e) => set('refSuratTanggal', e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tujuan">Kepada — UPTD Tujuan</Label>
          <Input
            id="tujuan"
            value={form.tujuanUptd}
            onChange={(e) => set('tujuanUptd', e.target.value)}
            placeholder="Puskesmas Sendawar"
          />
        </div>
        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="mb-3 text-sm font-semibold">Ketetapan Kewenangan Klinis</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="ketNomor">Nomor Ketetapan</Label>
              <Input
                id="ketNomor"
                value={form.ketetapanNomor}
                onChange={(e) => set('ketetapanNomor', e.target.value)}
                placeholder="800/233/DKK/2025"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ketTanggal">Tanggal</Label>
              <Input
                id="ketTanggal"
                type="date"
                value={form.ketetapanTanggal}
                onChange={(e) => set('ketetapanTanggal', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ketBerlaku">Berlaku Sampai</Label>
              <Input
                id="ketBerlaku"
                type="date"
                value={form.ketetapanBerlakuSampai}
                onChange={(e) => set('ketetapanBerlakuSampai', e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="catatan">Catatan</Label>
          <Textarea id="catatan" rows={2} value={form.catatan} onChange={(e) => set('catatan', e.target.value)} />
        </div>
        <div className="flex justify-end">
          <Button onClick={simpan} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Menyimpan…' : 'Terbitkan Surat Rekomendasi'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
