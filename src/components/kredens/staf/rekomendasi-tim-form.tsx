'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Save, ShieldCheck, UserPlus } from 'lucide-react'
import { KEPUTUSAN_TIM_LABELS } from '@/lib/constants'

export type RekomendasiTimAwal = {
  kesimpulan: string
  tanggal: string | null
  simpulan: string | null
  catatan: string | null
  ketuaNama: string | null
  anggotaNama: string | null
  anggotaNama2: string | null
  anggotaNama3: string | null
} | null

export function RekomendasiTimForm({
  pengajuanId,
  awal,
  namaKetua,
  calonAnggota = [],
}: {
  pengajuanId: string
  awal: RekomendasiTimAwal
  namaKetua: string
  /** v2.1 — nama asesor penilai yang ditetapkan Operator; dipakai sebagai
   *  saran isian anggota tim (perwakilan penilai) bila kolom masih kosong. */
  calonAnggota?: string[]
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    kesimpulan: awal?.kesimpulan ?? '',
    tanggal: awal?.tanggal ?? '',
    simpulan: awal?.simpulan ?? '',
    catatan: awal?.catatan ?? '',
    ketuaNama: awal?.ketuaNama ?? namaKetua,
    anggotaNama: awal?.anggotaNama ?? calonAnggota[0] ?? '',
    anggotaNama2: awal?.anggotaNama2 ?? calonAnggota[1] ?? '',
    anggotaNama3: awal?.anggotaNama3 ?? calonAnggota[2] ?? '',
  })
  const [saving, setSaving] = useState(false)

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function simpan() {
    if (!form.kesimpulan) {
      toast.error('Pilih kesimpulan rekomendasi terlebih dahulu')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/staf/rekomendasi-tim', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pengajuanId, ...form }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? 'Gagal menyimpan rekomendasi tim')
        return
      }
      toast.success('Rekomendasi tim berhasil ditetapkan')
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
          <ShieldCheck className="h-5 w-5 text-primary" /> Kesimpulan &amp; Penetapan Rekomendasi Tim
        </CardTitle>
        <CardDescription>
          Disusun Ketua Tim Kredensial berdasarkan hasil penilaian anggota tim. Penetapan
          meneruskan pengajuan ke tahap Rekomendasi Tim (Kepala Dinas). Nama anggota tim
          (perwakilan penilai) tercatat pada lembar rekomendasi.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="kesimpulan">Kesimpulan Rekomendasi *</Label>
            <select
              id="kesimpulan"
              value={form.kesimpulan}
              onChange={(e) => set('kesimpulan', e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">— Pilih kesimpulan —</option>
              {Object.entries(KEPUTUSAN_TIM_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tanggal">Tanggal Penilaian</Label>
            <Input id="tanggal" type="date" value={form.tanggal} onChange={(e) => set('tanggal', e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="simpulan">Simpulan Penilaian</Label>
          <Textarea
            id="simpulan"
            rows={3}
            value={form.simpulan}
            onChange={(e) => set('simpulan', e.target.value)}
            placeholder="Ringkasan hasil penilaian tim terhadap kompetensi tenaga kesehatan…"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="catatan">Catatan Tim</Label>
          <Textarea
            id="catatan"
            rows={2}
            value={form.catatan}
            onChange={(e) => set('catatan', e.target.value)}
            placeholder="mis. perlu pembinaan berupa asistensi/pendampingan…"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ketua">Ketua Tim Kredensial</Label>
            <Input id="ketua" value={form.ketuaNama} onChange={(e) => set('ketuaNama', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="anggota">Anggota Tim — Perwakilan Penilai 1</Label>
            <Input
              id="anggota"
              value={form.anggotaNama}
              onChange={(e) => set('anggotaNama', e.target.value)}
              placeholder="mis. drg. Siti Aminah, M.Kes"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="anggota2">Anggota Tim — Perwakilan Penilai 2</Label>
            <Input
              id="anggota2"
              value={form.anggotaNama2}
              onChange={(e) => set('anggotaNama2', e.target.value)}
              placeholder="mis. Ns. Budi Santoso, S.Kep"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="anggota3">Anggota Tim — Perwakilan Penilai 3</Label>
            <Input
              id="anggota3"
              value={form.anggotaNama3}
              onChange={(e) => set('anggotaNama3', e.target.value)}
              placeholder="mis. dr. Amelia Putri"
            />
          </div>
        </div>
        {calonAnggota.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-3">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <UserPlus className="h-3.5 w-3.5 text-primary" /> Asesor penilai yang ditetapkan Operator:
            </span>
            {calonAnggota.map((n, i) => (
              <button
                key={`${n}-${i}`}
                type="button"
                onClick={() => {
                  const kolom = ['anggotaNama', 'anggotaNama2', 'anggotaNama3'][i] as keyof typeof form
                  set(kolom, n)
                }}
                className="rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
                title={`Isi kolom Perwakilan Penilai ${i + 1} dengan nama ini`}
              >
                {i + 1}. {n}
              </button>
            ))}
            <span className="text-[11px] text-muted-foreground">
              Klik nama untuk mengisinya ke kolom anggota.
            </span>
          </div>
        )}
        <div className="flex justify-end">
          <Button onClick={simpan} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Menyimpan…' : 'Simpan & Tetapkan Rekomendasi'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
