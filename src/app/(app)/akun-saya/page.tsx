'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { keluarKeSitusUtama } from '@/lib/keluar'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Badge } from '@/components/ui/badge'
import { AvatarPengguna } from '@/components/kredens/avatar-pengguna'
import { formatTanggal } from '@/lib/format'
import { Camera, Loader2, Save, KeyRound, ShieldCheck, LogOut, Trash2 } from 'lucide-react'
import { ROLE_LABELS } from '@/lib/constants'

type Akun = {
  id: string
  nama: string
  email: string
  role: string
  nip: string | null
  jabatan: string | null
  instansi: string | null
  telepon: string | null
  // v2.3 — metadata foto profil (isi gambar dimuat via /api/akun/foto)
  fotoTipe: string | null
  fotoPada: string | null
  createdAt: string
}

const TIPE_FOTO_OK = ['image/jpeg', 'image/png', 'image/webp']
const FOTO_DIM_MAKS = 512 // piksel — dikecilkan di peramban agar hemat penyimpanan

/**
 * v2.3 — Kecilkan foto di sisi peramban sebelum diunggah: sisi terpanjang
 * maksimal 512px, hasil JPEG kualitas 0,85 (latar putih bila gambar sumber
 * transparan). Ukuran hasil umumnya 30–150 KB sehingga hemat ruang database.
 */
function kecilkanFoto(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const skala = Math.min(1, FOTO_DIM_MAKS / Math.max(img.naturalWidth, img.naturalHeight))
      const lebar = Math.max(1, Math.round(img.naturalWidth * skala))
      const tinggi = Math.max(1, Math.round(img.naturalHeight * skala))
      const kanvas = document.createElement('canvas')
      kanvas.width = lebar
      kanvas.height = tinggi
      const ctx = kanvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Kanvas peramban tidak tersedia'))
        return
      }
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, lebar, tinggi)
      ctx.drawImage(img, 0, 0, lebar, tinggi)
      kanvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Gagal memproses gambar'))),
        'image/jpeg',
        0.85,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Gambar tidak dapat dibaca peramban'))
    }
    img.src = url
  })
}

export default function AkunSayaPage() {
  const router = useRouter()
  const [akun, setAkun] = useState<Akun | null>(null)
  const [nama, setNama] = useState('')
  const [telepon, setTelepon] = useState('')
  const [savingProfil, setSavingProfil] = useState(false)
  const [sandiLama, setSandiLama] = useState('')
  const [sandiBaru, setSandiBaru] = useState('')
  const [konfirmasi, setKonfirmasi] = useState('')
  const [savingSandi, setSavingSandi] = useState(false)
  // v2.3 — foto profil
  const inputFotoRef = useRef<HTMLInputElement>(null)
  const [fotoSrc, setFotoSrc] = useState<string | null>(null)
  const [mengunggahFoto, setMengunggahFoto] = useState(false)

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/akun')
      if (res.ok) {
        const d: Akun = await res.json()
        setAkun(d)
        setNama(d.nama)
        setTelepon(d.telepon ?? '')
        setFotoSrc(d.fotoTipe && d.fotoPada ? `/api/akun/foto?v=${new Date(d.fotoPada).getTime()}` : null)
      }
    })()
  }, [])

  async function saveProfil() {
    if (nama.trim().length < 3) {
      toast.error('Nama lengkap wajib diisi (minimal 3 karakter).')
      return
    }
    setSavingProfil(true)
    const res = await fetch('/api/akun', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama: nama.trim(), telepon: telepon.trim() }),
    })
    const d = await res.json().catch(() => null)
    setSavingProfil(false)
    if (res.ok && d) {
      // Perbarui kartu identitas + nama pada sidebar/header seketika,
      // tanpa perlu login ulang.
      setAkun((prev) => (prev ? { ...prev, nama: d.nama, telepon: d.telepon } : prev))
      setNama(d.nama)
      toast.success('Profil akun diperbarui. Nama pada header dan sidebar ikut berubah.')
      router.refresh()
    } else {
      toast.error(d?.error ?? 'Gagal memperbarui profil')
    }
  }

  /** v2.3 — unggah foto profil: kecilkan di peramban lalu kirim binary. */
  async function unggahFoto(file: File) {
    if (!TIPE_FOTO_OK.includes(file.type)) {
      toast.error('Format foto harus JPG, PNG, atau WebP.')
      return
    }
    setMengunggahFoto(true)
    try {
      const blob = await kecilkanFoto(file)
      const res = await fetch('/api/akun/foto', {
        method: 'POST',
        headers: { 'Content-Type': 'image/jpeg' },
        body: blob,
      })
      const d = await res.json().catch(() => null)
      if (res.ok && d?.ok) {
        const versi = new Date(d.fotoPada).getTime()
        setFotoSrc(`/api/akun/foto?v=${versi}`)
        setAkun((prev) =>
          prev ? { ...prev, fotoTipe: 'image/jpeg', fotoPada: d.fotoPada } : prev,
        )
        toast.success('Foto profil berhasil disimpan dan tampil di seluruh platform.')
        router.refresh() // perbarui avatar pada header & sidebar
      } else {
        toast.error(d?.error ?? 'Gagal mengunggah foto profil.')
      }
    } catch {
      toast.error('Foto tidak dapat diproses. Silakan coba file lain.')
    } finally {
      setMengunggahFoto(false)
      if (inputFotoRef.current) inputFotoRef.current.value = ''
    }
  }

  /** v2.3 — hapus foto profil. */
  async function hapusFoto() {
    setMengunggahFoto(true)
    const res = await fetch('/api/akun/foto', { method: 'DELETE' })
    setMengunggahFoto(false)
    const d = await res.json().catch(() => null)
    if (res.ok && d?.ok) {
      setFotoSrc(null)
      setAkun((prev) => (prev ? { ...prev, fotoTipe: null, fotoPada: null } : prev))
      toast.success('Foto profil dihapus.')
      router.refresh()
    } else {
      toast.error(d?.error ?? 'Gagal menghapus foto profil.')
    }
  }

  async function savePassword() {
    if (sandiBaru !== konfirmasi) {
      toast.error('Konfirmasi kata sandi tidak sama')
      return
    }
    setSavingSandi(true)
    const res = await fetch('/api/akun/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sandiLama, sandiBaru }),
    })
    setSavingSandi(false)
    const d = await res.json()
    if (res.ok) {
      toast.success('Kata sandi berhasil diubah. Silakan login ulang dengan sandi baru.')
      setSandiLama(''); setSandiBaru(''); setKonfirmasi('')
      setTimeout(() => void keluarKeSitusUtama(), 1500)
    } else {
      toast.error(d.error ?? 'Gagal mengubah kata sandi')
    }
  }

  if (!akun) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Akun Saya</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola profil dan keamanan akun Anda.
        </p>
      </div>

      {/* Kartu identitas — v2.3 dengan foto profil */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-6">
          <div className="relative">
            <AvatarPengguna nama={akun.nama} src={fotoSrc} className="h-20 w-20 text-2xl" />
            {/* Tombol kamera: selalu tampak agar mudah diakses di layar sentuh */}
            <button
              type="button"
              onClick={() => inputFotoRef.current?.click()}
              disabled={mengunggahFoto}
              aria-label={fotoSrc ? 'Ganti foto profil' : 'Unggah foto profil'}
              title={fotoSrc ? 'Ganti foto profil' : 'Unggah foto profil'}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-background transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {mengunggahFoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            {/* Input file tersembunyi — dibuka oleh tombol kamera */}
            <input
              ref={inputFotoRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void unggahFoto(f)
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold">{akun.nama}</p>
            <p className="truncate text-sm text-muted-foreground">{akun.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {fotoSrc
                ? `Foto profil aktif · diunggah ${formatTanggal(akun.fotoPada)} — ketuk ikon kamera untuk mengganti.`
                : 'Belum ada foto profil — ketuk ikon kamera untuk mengunggah (JPG/PNG/WebP, otomatis dikecilkan ke 512px).'}
            </p>
            {fotoSrc && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-8 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => void hapusFoto()}
                disabled={mengunggahFoto}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Hapus Foto
              </Button>
            )}
          </div>
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
            {ROLE_LABELS[akun.role] ?? akun.role}
          </Badge>
        </CardContent>
      </Card>

      <Tabs defaultValue="profil">
        <TabsList className="grid w-full grid-cols-2 sm:w-72">
          <TabsTrigger value="profil">Profil</TabsTrigger>
          <TabsTrigger value="keamanan">Keamanan</TabsTrigger>
        </TabsList>

        {/* Tab Profil */}
        <TabsContent value="profil" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Akun</CardTitle>
              <CardDescription>Identitas dasar akun Anda pada platform KREDENS</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Email (tidak dapat diubah)</Label>
                  <Input value={akun.email} disabled />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Peran</Label>
                  <Input value={ROLE_LABELS[akun.role] ?? akun.role} disabled />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px]">NIP</Label>
                  <Input value={akun.nip ?? '—'} disabled />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Instansi</Label>
                  <Input value={akun.instansi ?? '—'} disabled />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Nama Lengkap</Label>
                  <Input value={nama} onChange={(e) => setNama(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Nomor Telepon</Label>
                  <Input value={telepon} onChange={(e) => setTelepon(e.target.value)} placeholder="08xx-xxxx-xxxx" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={saveProfil} disabled={savingProfil}>
                  {savingProfil ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Simpan Profil
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Keamanan */}
        <TabsContent value="keamanan" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-4.5 w-4.5 text-primary" /> Ganti Kata Sandi
              </CardTitle>
              <CardDescription>
                Gunakan kata sandi minimal 8 karakter yang mudah Anda ingat namun sulit
                ditebak orang lain.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Kata Sandi Lama</Label>
                  <Input type="password" value={sandiLama} onChange={(e) => setSandiLama(e.target.value)} autoComplete="current-password" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Kata Sandi Baru</Label>
                  <Input type="password" value={sandiBaru} onChange={(e) => setSandiBaru(e.target.value)} autoComplete="new-password" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Konfirmasi Kata Sandi Baru</Label>
                  <Input type="password" value={konfirmasi} onChange={(e) => setKonfirmasi(e.target.value)} autoComplete="new-password" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={savePassword} disabled={savingSandi || !sandiLama || !sandiBaru}>
                  {savingSandi && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Ubah Kata Sandi
                </Button>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardHeader>
              <CardTitle>Sesi Login</CardTitle>
              <CardDescription>Keluar dari perangkat ini</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" /> Keluar dari Akun
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Keluar dari akun?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Anda perlu masuk kembali menggunakan email dan kata sandi untuk
                      mengakses platform KREDENS.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => void keluarKeSitusUtama()}
                    >
                      Keluar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
