'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { Loader2, Pencil, Plus, Save, Trash2 } from 'lucide-react'
import {
  JENIS_KELAMIN,
  JENIS_PROFESI,
  LEVEL_KOMPETENSI,
  STATUS_KEPEGAWAIAN,
} from '@/lib/constants'

type Profil = Record<string, any>
type OpsiTempatKerja = { id: string; nama: string }
type Pendidikan = { id: string; jenjang: string; namaInstitusi: string; tahun: string | null; nomorIjazah: string | null }
type Pengalaman = { id: string; tempatKerja: string; jabatan: string; periodeMulai: string | null; periodeSelesai: string | null; masihBekerja: boolean }
type Pelatihan = { id: string; namaKegiatan: string; penyelenggara: string | null; tahun: string | null; jumlahJp: string | null; nomorSertifikat: string | null }

const BLANK: Record<string, string> = {
  namaLengkapGelar: '', tempatLahir: '', tanggalLahir: '', nip: '', nik: '',
  jenisProfesi: '', levelKompetensi: '', jenisKelamin: '', alamat: '', telepon: '',
  email: '', statusKepegawaian: '', jenjangJabatan: '', tempatBekerja: '', tempatKerjaId: '',
}

function Field({
  label, value, onChange, type = 'text', placeholder, textarea,
}: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string; textarea?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px]">{label}</Label>
      {textarea ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={2} />
      ) : (
        <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  )
}

function SelectField({
  label, value, onChange, options, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void
  options: readonly string[]; placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px]">{label}</Label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder ?? 'Pilih...'} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default function RiwayatHidupPage() {
  const [form, setForm] = useState<Record<string, string>>(BLANK)
  const [pendidikan, setPendidikan] = useState<Pendidikan[]>([])
  const [pengalaman, setPengalaman] = useState<Pengalaman[]>([])
  const [pelatihan, setPelatihan] = useState<Pelatihan[]>([])
  const [opsiTK, setOpsiTK] = useState<OpsiTempatKerja[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    (async () => {
      const [res, resTK] = await Promise.all([fetch('/api/biodata'), fetch('/api/tempat-kerja')])
      if (res.ok) {
        const d = await res.json()
        setForm({
          ...BLANK,
          ...Object.fromEntries(Object.entries(BLANK).map(([k]) => [k, d[k] ?? ''])),
          tempatKerjaId: d.tempatKerja?.id ?? d.tempatKerjaId ?? '',
        })
        setPendidikan(d.pendidikan ?? [])
        setPengalaman(d.pengalaman ?? [])
        setPelatihan(d.pelatihan ?? [])
      }
      if (resTK.ok) {
        const d2 = await resTK.json()
        setOpsiTK((d2.items ?? []).map((t: { id: string; nama: string }) => ({ id: t.id, nama: t.nama })))
      }
      setLoading(false)
    })()
  }, [])

  async function saveProfil() {
    setSaving(true)
    const res = await fetch('/api/biodata', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) toast.success('Data pribadi berhasil disimpan.')
    else toast.error('Gagal menyimpan data pribadi')
  }

  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

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
        <h1 className="text-2xl font-bold">Riwayat Hidup</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Daftar riwayat hidup lengkap sesuai format Dinas Kesehatan Kabupaten Kutai Barat.
          Seluruh bagian dapat Anda sunting kapan saja.
        </p>
      </div>

      {/* I. DATA PRIBADI */}
      <Card>
        <CardHeader>
          <CardTitle>I. Data Pribadi</CardTitle>
          <CardDescription>Identitas dan data kepegawaian Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama Lengkap dengan Gelar" value={form.namaLengkapGelar} onChange={set('namaLengkapGelar')} placeholder="dr. Nama Lengkap, Sp.X" />
            <Field label="Tempat Lahir" value={form.tempatLahir} onChange={set('tempatLahir')} placeholder="Sendawar" />
            <Field label="Tanggal Lahir" value={form.tanggalLahir} onChange={set('tanggalLahir')} type="date" />
            <Field label="NIP / NIK" value={form.nip} onChange={set('nip')} placeholder="NIP atau 16 digit NIK" />
            <Field label="NIK (bila berbeda dari NIP)" value={form.nik} onChange={set('nik')} />
            <SelectField label="Jenis Profesi Kesehatan" value={form.jenisProfesi} onChange={set('jenisProfesi')} options={JENIS_PROFESI} />
            <SelectField label="Level Kompetensi" value={form.levelKompetensi} onChange={set('levelKompetensi')} options={LEVEL_KOMPETENSI} />
            <SelectField label="Jenis Kelamin" value={form.jenisKelamin} onChange={set('jenisKelamin')} options={JENIS_KELAMIN} />
            <SelectField label="Status Kepegawaian" value={form.statusKepegawaian} onChange={set('statusKepegawaian')} options={STATUS_KEPEGAWAIAN} />
            <Field label="Jenjang Jabatan" value={form.jenjangJabatan} onChange={set('jenjangJabatan')} placeholder="Terampil / Ahli Pertama / ..." />
            <div className="space-y-1.5">
              <Label className="text-[13px]">Tempat Bekerja (Fasyankes)</Label>
              {opsiTK.length > 0 ? (
                <Select
                  value={form.tempatKerjaId || undefined}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      tempatKerjaId: v === 'legacy' ? '' : v,
                      tempatBekerja:
                        v === 'legacy'
                          ? f.tempatBekerja
                          : opsiTK.find((t) => t.id === v)?.nama ?? f.tempatBekerja,
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih fasyankes tempat Anda bekerja..." />
                  </SelectTrigger>
                  <SelectContent>
                    {opsiTK.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.nama}</SelectItem>
                    ))}
                    {form.tempatKerjaId === '' && form.tempatBekerja !== '' && (
                      <SelectItem value="legacy">{form.tempatBekerja} (nilai lama — pilih ulang untuk terhubung pimpinan)</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={form.tempatBekerja}
                  onChange={(e) => setForm((f) => ({ ...f, tempatBekerja: e.target.value }))}
                  placeholder="Puskesmas ..."
                />
              )}
              <p className="text-[11px] text-muted-foreground">
                Pilihan berasal dari daftar fasyankes resmi platform. Tempat kerja menentukan
                pimpinan fasyankes yang memverifikasi logbook dan menerbitkan SPK Anda.
              </p>
            </div>
            <Field label="Nomor Telepon/Ponsel" value={form.telepon} onChange={set('telepon')} placeholder="08xx-xxxx-xxxx" />
            <Field label="Alamat Email" value={form.email} onChange={set('email')} type="email" />
          </div>
          <Field label="Alamat" value={form.alamat} onChange={set('alamat')} textarea placeholder="Alamat domisili lengkap" />
          <div className="flex justify-end">
            <Button onClick={saveProfil} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Simpan Data Pribadi
            </Button>
          </div>
        </CardContent>
      </Card>

      <PendidikanSection data={pendidikan} reload={(rows) => setPendidikan(rows)} />
      <PengalamanSection data={pengalaman} reload={(rows) => setPengalaman(rows)} />
      <PelatihanSection data={pelatihan} reload={(rows) => setPelatihan(rows)} />
    </div>
  )
}

// ================= II. RIWAYAT PENDIDIKAN =================
function PendidikanSection({ data, reload }: { data: Pendidikan[]; reload: (r: Pendidikan[]) => void }) {
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<Pendidikan | null>(null)
  const [form, setForm] = useState({ jenjang: '', namaInstitusi: '', tahun: '', nomorIjazah: '' })
  const [busy, setBusy] = useState(false)

  async function fetchAll() {
    const res = await fetch('/api/biodata')
    if (res.ok) reload((await res.json()).pendidikan ?? [])
  }

  function openAdd() {
    setEdit(null)
    setForm({ jenjang: '', namaInstitusi: '', tahun: '', nomorIjazah: '' })
    setOpen(true)
  }
  function openEdit(row: Pendidikan) {
    setEdit(row)
    setForm({ jenjang: row.jenjang, namaInstitusi: row.namaInstitusi, tahun: row.tahun ?? '', nomorIjazah: row.nomorIjazah ?? '' })
    setOpen(true)
  }

  async function save() {
    if (!form.jenjang.trim() || !form.namaInstitusi.trim()) {
      toast.error('Jenjang dan nama institusi wajib diisi')
      return
    }
    setBusy(true)
    const res = await fetch(edit ? `/api/biodata/pendidikan/${edit.id}` : '/api/biodata/pendidikan', {
      method: edit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setBusy(false)
    if (res.ok) {
      toast.success('Riwayat pendidikan disimpan.')
      setOpen(false)
      fetchAll()
    } else toast.error('Gagal menyimpan')
  }

  async function hapus(id: string) {
    const res = await fetch(`/api/biodata/pendidikan/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Data dihapus.'); fetchAll() }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>II. Riwayat Pendidikan</CardTitle>
          <CardDescription>Pendidikan terakhir beserta ijazahnya</CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={openAdd}>
          <Plus className="mr-1.5 h-4 w-4" /> Tambah
        </Button>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Belum ada riwayat pendidikan.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">No</TableHead>
                  <TableHead>Jenjang</TableHead>
                  <TableHead>Nama Institusi</TableHead>
                  <TableHead>Tahun</TableHead>
                  <TableHead>Nomor Ijazah</TableHead>
                  <TableHead className="w-24 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, i) => (
                  <TableRow key={row.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">{row.jenjang}</TableCell>
                    <TableCell>{row.namaInstitusi}</TableCell>
                    <TableCell>{row.tahun ?? '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{row.nomorIjazah ?? '-'}</TableCell>
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
                            <AlertDialogTitle>Hapus data pendidikan?</AlertDialogTitle>
                            <AlertDialogDescription>{row.jenjang} — {row.namaInstitusi}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => hapus(row.id)}>Hapus</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{edit ? 'Sunting' : 'Tambah'} Riwayat Pendidikan</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="Jenjang Pendidikan" value={form.jenjang} onChange={(v) => setForm({ ...form, jenjang: v })} placeholder="S1 / Profesi / S2 ..." />
            <Field label="Nama Institusi" value={form.namaInstitusi} onChange={(v) => setForm({ ...form, namaInstitusi: v })} placeholder="Universitas ..." />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tahun Lulus" value={form.tahun} onChange={(v) => setForm({ ...form, tahun: v })} placeholder="2020" />
              <Field label="Nomor Ijazah" value={form.nomorIjazah} onChange={(v) => setForm({ ...form, nomorIjazah: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={save} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// ================= III. PENGALAMAN KERJA =================
function PengalamanSection({ data, reload }: { data: Pengalaman[]; reload: (r: Pengalaman[]) => void }) {
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<Pengalaman | null>(null)
  const [form, setForm] = useState({ tempatKerja: '', jabatan: '', periodeMulai: '', periodeSelesai: '', masihBekerja: false })
  const [busy, setBusy] = useState(false)

  async function fetchAll() {
    const res = await fetch('/api/biodata')
    if (res.ok) reload((await res.json()).pengalaman ?? [])
  }

  function openAdd() {
    setEdit(null)
    setForm({ tempatKerja: '', jabatan: '', periodeMulai: '', periodeSelesai: '', masihBekerja: false })
    setOpen(true)
  }
  function openEdit(row: Pengalaman) {
    setEdit(row)
    setForm({
      tempatKerja: row.tempatKerja, jabatan: row.jabatan,
      periodeMulai: row.periodeMulai ?? '', periodeSelesai: row.periodeSelesai ?? '',
      masihBekerja: row.masihBekerja,
    })
    setOpen(true)
  }

  async function save() {
    if (!form.tempatKerja.trim() || !form.jabatan.trim()) {
      toast.error('Tempat kerja dan jabatan wajib diisi')
      return
    }
    setBusy(true)
    const res = await fetch(edit ? `/api/biodata/pengalaman/${edit.id}` : '/api/biodata/pengalaman', {
      method: edit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setBusy(false)
    if (res.ok) { toast.success('Pengalaman kerja disimpan.'); setOpen(false); fetchAll() }
    else toast.error('Gagal menyimpan')
  }

  async function hapus(id: string) {
    const res = await fetch(`/api/biodata/pengalaman/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Data dihapus.'); fetchAll() }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>III. Pengalaman Kerja</CardTitle>
          <CardDescription>Riwayat penugasan dan jabatan</CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={openAdd}>
          <Plus className="mr-1.5 h-4 w-4" /> Tambah
        </Button>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Belum ada pengalaman kerja.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">No</TableHead>
                  <TableHead>Tempat Kerja</TableHead>
                  <TableHead>Jabatan</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead className="w-24 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, i) => (
                  <TableRow key={row.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">{row.tempatKerja}</TableCell>
                    <TableCell>{row.jabatan}</TableCell>
                    <TableCell>
                      {row.periodeMulai ?? '-'} — {row.masihBekerja ? 'sekarang' : row.periodeSelesai ?? '-'}
                    </TableCell>
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
                            <AlertDialogTitle>Hapus pengalaman kerja?</AlertDialogTitle>
                            <AlertDialogDescription>{row.jabatan} — {row.tempatKerja}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => hapus(row.id)}>Hapus</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{edit ? 'Sunting' : 'Tambah'} Pengalaman Kerja</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="Tempat Kerja" value={form.tempatKerja} onChange={(v) => setForm({ ...form, tempatKerja: v })} placeholder="Puskesmas/UPTD/RS ..." />
            <Field label="Jabatan" value={form.jabatan} onChange={(v) => setForm({ ...form, jabatan: v })} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Periode Mulai" value={form.periodeMulai} onChange={(v) => setForm({ ...form, periodeMulai: v })} type="date" />
              {!form.masihBekerja && (
                <Field label="Periode Selesai" value={form.periodeSelesai} onChange={(v) => setForm({ ...form, periodeSelesai: v })} type="date" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="masih"
                checked={form.masihBekerja}
                onCheckedChange={(v) => setForm({ ...form, masihBekerja: Boolean(v), periodeSelesai: v ? '' : form.periodeSelesai })}
              />
              <Label htmlFor="masih" className="text-[13px]">Saya masih bertugas di tempat ini</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={save} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// ================= IV. PENGEMBANGAN KOMPETENSI =================
function PelatihanSection({ data, reload }: { data: Pelatihan[]; reload: (r: Pelatihan[]) => void }) {
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<Pelatihan | null>(null)
  const [form, setForm] = useState({ namaKegiatan: '', penyelenggara: '', tahun: '', jumlahJp: '', nomorSertifikat: '' })
  const [busy, setBusy] = useState(false)

  async function fetchAll() {
    const res = await fetch('/api/biodata')
    if (res.ok) reload((await res.json()).pelatihan ?? [])
  }

  function openAdd() {
    setEdit(null)
    setForm({ namaKegiatan: '', penyelenggara: '', tahun: '', jumlahJp: '', nomorSertifikat: '' })
    setOpen(true)
  }
  function openEdit(row: Pelatihan) {
    setEdit(row)
    setForm({
      namaKegiatan: row.namaKegiatan, penyelenggara: row.penyelenggara ?? '',
      tahun: row.tahun ?? '', jumlahJp: row.jumlahJp ?? '', nomorSertifikat: row.nomorSertifikat ?? '',
    })
    setOpen(true)
  }

  async function save() {
    if (!form.namaKegiatan.trim()) {
      toast.error('Nama kegiatan wajib diisi')
      return
    }
    setBusy(true)
    const res = await fetch(edit ? `/api/biodata/pelatihan/${edit.id}` : '/api/biodata/pelatihan', {
      method: edit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setBusy(false)
    if (res.ok) { toast.success('Pengembangan kompetensi disimpan.'); setOpen(false); fetchAll() }
    else toast.error('Gagal menyimpan')
  }

  async function hapus(id: string) {
    const res = await fetch(`/api/biodata/pelatihan/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Data dihapus.'); fetchAll() }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>IV. Pengembangan Kompetensi (5 Tahun Terakhir)</CardTitle>
          <CardDescription>Pelatihan, workshop, dan pengembangan kompetensi lainnya</CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={openAdd}>
          <Plus className="mr-1.5 h-4 w-4" /> Tambah
        </Button>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Belum ada data pengembangan kompetensi.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">No</TableHead>
                  <TableHead>Nama Kegiatan</TableHead>
                  <TableHead>Penyelenggara</TableHead>
                  <TableHead>Tahun</TableHead>
                  <TableHead>JP</TableHead>
                  <TableHead>No. Sertifikat</TableHead>
                  <TableHead className="w-24 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, i) => (
                  <TableRow key={row.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">{row.namaKegiatan}</TableCell>
                    <TableCell>{row.penyelenggara ?? '-'}</TableCell>
                    <TableCell>{row.tahun ?? '-'}</TableCell>
                    <TableCell>{row.jumlahJp ?? '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{row.nomorSertifikat ?? '-'}</TableCell>
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
                            <AlertDialogTitle>Hapus kegiatan?</AlertDialogTitle>
                            <AlertDialogDescription>{row.namaKegiatan}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => hapus(row.id)}>Hapus</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{edit ? 'Sunting' : 'Tambah'} Pengembangan Kompetensi</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <Field label="Nama Kegiatan" value={form.namaKegiatan} onChange={(v) => setForm({ ...form, namaKegiatan: v })} placeholder="Pelatihan APN / Workshop ..." />
            <Field label="Institusi Penyelenggara" value={form.penyelenggara} onChange={(v) => setForm({ ...form, penyelenggara: v })} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tahun" value={form.tahun} onChange={(v) => setForm({ ...form, tahun: v })} placeholder="2025" />
              <Field label="Jumlah JP" value={form.jumlahJp} onChange={(v) => setForm({ ...form, jumlahJp: v })} placeholder="16" />
            </div>
            <Field label="Nomor Sertifikat" value={form.nomorSertifikat} onChange={(v) => setForm({ ...form, nomorSertifikat: v })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={save} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
