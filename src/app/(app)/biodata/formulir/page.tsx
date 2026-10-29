'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Loader2, Save, FileText, Info } from 'lucide-react'
import { formatTanggal } from '@/lib/format'

type PengajuanRing = { id: string; kode: string; jenis: string; status: string; submittedAt: string | null; createdAt: string }
type Formulir = Record<string, any>

function F({ label, value, onChange, type = 'text', placeholder, disabled }: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string; disabled?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px]">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} />
    </div>
  )
}

export default function FormulirPage() {
  const [pengajuanList, setPengajuanList] = useState<PengajuanRing[]>([])
  const [selected, setSelected] = useState<string>('')
  const [form, setForm] = useState<Formulir>({})
  const [namaPengusul, setNamaPengusul] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    (async () => {
      const [resP, resB] = await Promise.all([fetch('/api/pengajuan'), fetch('/api/biodata')])
      if (resP.ok) {
        const list: PengajuanRing[] = await resP.json()
        setPengajuanList(list)
        if (list.length > 0) setSelected((s) => s || list[0].id)
      }
      if (resB.ok) {
        const b = await resB.json()
        setNamaPengusul(b.namaLengkapGelar ?? '')
      }
      setLoading(false)
    })()
  }, [])

  const loadFormulir = useCallback(async (pid: string) => {
    const res = await fetch(`/api/pengajuan/${pid}/formulir`)
    if (res.ok) setForm(await res.json())
  }, [])

  useEffect(() => {
    if (!selected) return
    let cancelled = false
    fetch(`/api/pengajuan/${selected}/formulir`).then(async (res) => {
      if (res.ok && !cancelled) setForm(await res.json())
    })
    return () => {
      cancelled = true
    }
  }, [selected])

  async function save() {
    setSaving(true)
    const res = await fetch(`/api/pengajuan/${selected}/formulir`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) toast.success('Formulir berhasil disimpan.')
    else {
      const d = await res.json()
      toast.error(d.error ?? 'Gagal menyimpan formulir')
    }
  }

  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }))
  const selectedP = pengajuanList.find((p) => p.id === selected)
  const editable = selectedP?.status === 'DRAFT'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Formulir Kredensial dan Rekredensial</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dokumen persyaratan: STR, SIP, surat permohonan, dan sertifikasi kompetensi.
        </p>
      </div>

      {pengajuanList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/40" />
            <p className="font-semibold">Belum ada pengajuan</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Formulir terhubung dengan pengajuan. Buat pengajuan terlebih dahulu pada menu
              Pengajuan, kemudian kembali ke halaman ini untuk mengisinya.
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

          {!editable && selectedP && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              Pengajuan ini sudah diajukan, sehingga formulir hanya dapat dilihat dan tidak
              dapat disunting lagi.
            </div>
          )}

          {/* Pernyataan */}
          <Card>
            <CardHeader>
              <CardTitle>Permohonan Kewenangan Klinis Tenaga Kesehatan</CardTitle>
              <CardDescription>Dinas Kesehatan Kabupaten Kutai Barat</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-muted/50 p-4 text-sm leading-relaxed text-foreground/90">
                <p className="font-semibold">Nama Pengusul:</p>
                <p className="mt-1">{namaPengusul || '-'}</p>
                {selectedP && (
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{selectedP.kode}</p>
                )}
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed">
                Saya menyatakan bahwa saya kompeten untuk menangani kasus-kasus yang saya
                usulkan. Saya juga menyatakan kompeten untuk melakukan prosedur teknis
                sesuai dengan kewenangan klinis yang diusulkan, dan bersedia mengikuti
                proses kredensialing sesuai ketentuan Dinas Kesehatan Kabupaten Kutai
                Barat.
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="pernyataan"
                  checked={Boolean(form.pernyataan)}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, pernyataan: Boolean(v) }))}
                  disabled={!editable}
                />
                <Label htmlFor="pernyataan" className="text-[13px] font-medium">
                  Saya menyetujui pernyataan kompetensi di atas
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Sertifikasi */}
          <Card>
            <CardHeader>
              <CardTitle>Sertifikasi</CardTitle>
              <CardDescription>Bukti kompetensi formal yang dimiliki</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <F label="Perguruan Tinggi — Nomor" value={form.ptNomor ?? ''} onChange={set('ptNomor')} disabled={!editable} placeholder="Nomor ijazah/kelulusan" />
              <F label="Perguruan Tinggi — Tanggal" value={form.ptTanggal ?? ''} onChange={set('ptTanggal')} type="date" disabled={!editable} />
              <div />
              <F label="Kolegium (Sertifikat Kompetensi) — Nomor" value={form.kolegiumNomor ?? ''} onChange={set('kolegiumNomor')} disabled={!editable} />
              <F label="Kolegium — Tanggal" value={form.kolegiumTanggal ?? ''} onChange={set('kolegiumTanggal')} type="date" disabled={!editable} />
              <div />
              <F label="Uji Kompetensi Jabatan Fungsional — Nomor" value={form.ujiKompetensiNomor ?? ''} onChange={set('ujiKompetensiNomor')} disabled={!editable} />
              <F label="Uji Kompetensi — Tanggal" value={form.ujiKompetensiTanggal ?? ''} onChange={set('ujiKompetensiTanggal')} type="date" disabled={!editable} />
              <div />
            </CardContent>
          </Card>

          {/* Pelatihan 5 tahun terakhir — rujukan dari riwayat hidup */}
          <Card>
            <CardHeader>
              <CardTitle>Pelatihan/Workshop/Pengembangan Kompetensi (5 Tahun Terakhir)</CardTitle>
              <CardDescription>
                Daftar ini otomatis mengikuti data pada menu Riwayat Hidup bagian IV.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <Link href="/biodata/riwayat-hidup">Kelola di Riwayat Hidup</Link>
              </Button>
            </CardContent>
          </Card>

          <Separator />

          {/* STR / SIP / Surat permohonan */}
          <Card>
            <CardHeader>
              <CardTitle>Dokumen Surat</CardTitle>
              <CardDescription>STR, SIP, dan surat permohonan kredensial</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="mb-3 text-sm font-semibold">Surat Tanda Registrasi (STR)</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <F label="Nomor STR" value={form.strNomor ?? ''} onChange={set('strNomor')} disabled={!editable} />
                  <F label="Berlaku Hingga" value={form.strBerlaku ?? ''} onChange={set('strBerlaku')} type="date" disabled={!editable} />
                </div>
              </div>
              <div>
                <p className="mb-3 text-sm font-semibold">Surat Izin Praktik (SIP)</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <F label="Nomor SIP" value={form.sipNomor ?? ''} onChange={set('sipNomor')} disabled={!editable} />
                  <F label="Berlaku Hingga" value={form.sipBerlaku ?? ''} onChange={set('sipBerlaku')} type="date" disabled={!editable} />
                </div>
              </div>
              <div>
                <p className="mb-3 text-sm font-semibold">Surat Permohonan Kredensial</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <F label="Nomor Surat" value={form.suratPermohonanNomor ?? ''} onChange={set('suratPermohonanNomor')} disabled={!editable} />
                  <F label="Tanggal Surat" value={form.suratPermohonanTanggal ?? ''} onChange={set('suratPermohonanTanggal')} type="date" disabled={!editable} />
                </div>
              </div>
            </CardContent>
          </Card>

          {editable && (
            <div className="flex justify-end">
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Simpan Formulir
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
