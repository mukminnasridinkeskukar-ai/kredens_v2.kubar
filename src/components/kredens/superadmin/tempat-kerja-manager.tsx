'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, MapPin, Plus, Save, Trash2 } from 'lucide-react'

type TempatKerja = {
  id: string
  nama: string
  alamat: string | null
  aktif: boolean
  _count: { asesi: number; pengguna: number }
}

/**
 * Kelola master data Tempat Kerja / Fasyankes (SUPERADMIN).
 * Daftar ini menjadi opsi "Tempat Bekerja" pada biodata asesi dan pilihan
 * fasyankes saat pendaftaran akun Pimpinan Fasyankes — menjamin setiap
 * asesi terhubung ke pimpinan fasyankes yang tepat.
 */
export function TempatKerjaManager() {
  const [daftar, setDaftar] = useState<TempatKerja[]>([])
  const [loading, setLoading] = useState(true)
  const [nama, setNama] = useState('')
  const [alamat, setAlamat] = useState('')
  const [menyimpan, setMenyimpan] = useState(false)
  const [sunting, setSunting] = useState<Record<string, string>>({})

  async function muat() {
    const res = await fetch('/api/tempat-kerja?semua=1')
    if (res.ok) {
      const d = await res.json()
      setDaftar(d.items ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    muat()
  }, [])

  async function tambah() {
    if (nama.trim().length < 3) {
      toast.error('Nama tempat kerja minimal 3 karakter')
      return
    }
    setMenyimpan(true)
    try {
      const res = await fetch('/api/tempat-kerja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama, alamat }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal menambah tempat kerja')
      toast.success(`"${nama.trim()}" ditambahkan ke daftar tempat kerja`)
      setNama('')
      setAlamat('')
      await muat()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Gagal menambah tempat kerja')
    } finally {
      setMenyimpan(false)
    }
  }

  async function ubah(id: string, data: Record<string, unknown>, pesan: string) {
    const res = await fetch('/api/tempat-kerja', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error ?? 'Gagal menyimpan perubahan')
      return false
    }
    toast.success(pesan)
    await muat()
    return true
  }

  async function hapus(t: TempatKerja) {
    const dipakai = t._count.asesi + t._count.pengguna
    if (
      !window.confirm(
        dipakai > 0
          ? `"${t.nama}" masih dipakai ${dipakai} akun/profil dan tidak dapat dihapus. Nonaktifkan saja?`
          : `Hapus "${t.nama}" dari daftar tempat kerja?`
      )
    ) {
      return
    }
    const res = await fetch('/api/tempat-kerja', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: t.id }),
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error ?? 'Gagal menghapus')
      return
    }
    toast.success(`"${t.nama}" dihapus`)
    await muat()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" /> Tempat Kerja / Fasyankes
        </CardTitle>
        <CardDescription>
          Master data fasyankes yang menjadi opsi <b>Tempat Bekerja</b> pada biodata asesi dan
          pilihan fasyankes akun Pimpinan Fasyankes. Keduanya terhubung melalui daftar ini, sehingga
          laporan logbook dan dokumen SPK setiap asesi hanya dapat diproses oleh pimpinan
          fasyankesnya sendiri.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-1.5">
            <Label htmlFor="tk-nama">Nama Fasyankes</Label>
            <Input
              id="tk-nama"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="mis. Puskesmas Sendawar"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tk-alamat">Alamat (opsional)</Label>
            <Input
              id="tk-alamat"
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              placeholder="mis. Jl. Gajah Mada No. 1, Sendawar"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={tambah} disabled={menyimpan} className="min-h-[40px] w-full sm:w-auto">
              {menyimpan ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Tambah
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : daftar.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Belum ada tempat kerja terdaftar. Tambahkan fasyankes pertama di atas.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead className="hidden md:table-cell">Alamat</TableHead>
                  <TableHead className="text-center">Terhubung</TableHead>
                  <TableHead className="text-center">Aktif</TableHead>
                  <TableHead className="w-24 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {daftar.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="min-w-[180px]">
                      <Input
                        value={sunting[t.id] ?? t.nama}
                        onChange={(e) => setSunting((s) => ({ ...s, [t.id]: e.target.value }))}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell className="hidden max-w-[220px] truncate text-sm text-muted-foreground md:table-cell">
                      {t.alamat ?? '—'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-center text-xs text-muted-foreground">
                      {t._count.asesi} asesi · {t._count.pengguna} akun
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={t.aktif}
                        onCheckedChange={(v) => ubah(t.id, { aktif: v }, v ? `"${t.nama}" diaktifkan` : `"${t.nama}" dinonaktifkan`)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          disabled={(sunting[t.id] ?? t.nama).trim() === t.nama}
                          onClick={async () => {
                            const ok = await ubah(
                              t.id,
                              { nama: (sunting[t.id] ?? t.nama).trim() },
                              'Nama tempat kerja diperbarui'
                            )
                            if (ok) setSunting((s) => ({ ...s, [t.id]: '' }))
                          }}
                        >
                          <Save className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 border-red-200 p-0 text-red-600 hover:bg-red-50"
                          onClick={() => hapus(t)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {daftar.some((t) => !t.aktif) && (
          <p className="text-xs text-muted-foreground">
            <Badge variant="outline" className="mr-1 border-amber-300 bg-amber-50 text-amber-700">
              Nonaktif
            </Badge>
            tidak muncul pada pilihan biodata asesi dan pendaftaran pimpinan, tetapi tetap tersimpan
            untuk data historis.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
