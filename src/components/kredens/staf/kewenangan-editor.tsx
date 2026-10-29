'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Save } from 'lucide-react'

export type BarisKewenangan = {
  id: string
  urutan: number
  namaKewenangan: string
  kodeRef: string | null
  kodeDiminta: string
  kodeRekomendasi: string | null
  catatanRekomendasi: string | null
}

const OPSI_REKOMENDASI = [
  { kode: '1', label: '1 — Disetujui penuh' },
  { kode: '2', label: '2 — Disetujui dengan supervisi' },
  { kode: '3', label: '3 — Tidak disetujui (kompetensi)' },
  { kode: '4', label: '4 — Tidak disetujui (fasilitas)' },
]

export function KewenanganEditor({
  pengajuanId,
  baris,
  bisaEdit,
}: {
  pengajuanId: string
  baris: BarisKewenangan[]
  bisaEdit: boolean
}) {
  const router = useRouter()
  const [items, setItems] = useState(
    baris.map((b) => ({
      id: b.id,
      kodeRekomendasi: b.kodeRekomendasi ?? '',
      catatanRekomendasi: b.catatanRekomendasi ?? '',
    }))
  )
  const [saving, setSaving] = useState(false)

  function ubah(id: string, field: 'kodeRekomendasi' | 'catatanRekomendasi', value: string) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)))
  }

  async function simpan() {
    setSaving(true)
    try {
      const res = await fetch('/api/staf/kewenangan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pengajuanId,
          items: items.map((it) => ({
            id: it.id,
            kodeRekomendasi: it.kodeRekomendasi || null,
            catatanRekomendasi: it.catatanRekomendasi || null,
          })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? 'Gagal menyimpan penilaian')
        return
      }
      toast.success('Penilaian kewenangan klinis tersimpan')
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setSaving(false)
    }
  }

  const terisi = items.filter((i) => i.kodeRekomendasi).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Penilaian Kewenangan Klinis</CardTitle>
        <CardDescription>
          {bisaEdit
            ? `Beri kode rekomendasi untuk setiap kewenangan (${terisi}/${items.length} terisi).`
            : 'Kode rekomendasi hasil penilaian tim.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {baris.map((b, idx) => {
          const it = items.find((x) => x.id === b.id)!
          return (
            <div key={b.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">
                    {b.urutan}. {b.namaKewenangan}{' '}
                    {b.kodeRef && (
                      <span className="text-xs font-normal text-muted-foreground">({b.kodeRef})</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Diminta asesi: <span className="font-bold text-primary">{b.kodeDiminta}</span>
                  </p>
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`kode-${b.id}`}>Kode Rekomendasi Tim</Label>
                  <select
                    id={`kode-${b.id}`}
                    value={it.kodeRekomendasi}
                    onChange={(e) => ubah(b.id, 'kodeRekomendasi', e.target.value)}
                    disabled={!bisaEdit}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">— Belum dinilai —</option>
                    {OPSI_REKOMENDASI.map((o) => (
                      <option key={o.kode} value={o.kode}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`cat-${b.id}`}>Catatan (opsional)</Label>
                  {bisaEdit ? (
                    <Input
                      id={`cat-${b.id}`}
                      value={it.catatanRekomendasi}
                      onChange={(e) => ubah(b.id, 'catatanRekomendasi', e.target.value)}
                      placeholder="mis. perlu supervisi 3 bulan"
                    />
                  ) : (
                    <Textarea readOnly value={it.catatanRekomendasi || '—'} rows={1} />
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {bisaEdit && items.length > 0 && (
          <div className="flex justify-end">
            <Button onClick={simpan} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Menyimpan…' : 'Simpan Penilaian'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
