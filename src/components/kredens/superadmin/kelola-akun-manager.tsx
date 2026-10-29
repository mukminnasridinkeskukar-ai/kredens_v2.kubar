'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  AtSign,
  BadgeCheck,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Search,
  ShieldQuestion,
  Trash2,
  UserCog,
  UserMinus,
  UserPen,
  Users,
  UserX,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ROLES, ROLE_LABELS, JENIS_PROFESI, PERAN_EKSTRA, PERAN_EKSTRA_LABELS, uraikanPeranEkstra } from '@/lib/constants'
import { formatTanggal } from '@/lib/format'

export type BarisAkun = {
  id: string
  nama: string
  email: string
  role: string
  peranEkstra?: string | null
  profesi?: string | null
  nip: string | null
  jabatan: string | null
  instansi: string | null
  telepon: string | null
  isActive: boolean
  createdAt: Date | string
  tempatKerjaId?: string | null
  tempatKerja?: { nama: string } | null
  sandiAda?: boolean
  _count: { pengajuan: number }
}

type HasilSandi = { nama: string; email: string; sandi: string }

function BadgeStatus({ aktif }: { aktif: boolean }) {
  return aktif ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
      <BadgeCheck className="h-3.5 w-3.5" /> Aktif
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
      <ShieldQuestion className="h-3.5 w-3.5" /> Menunggu Verifikasi
    </span>
  )
}

export function KelolaAkunManager({
  daftar,
  selfId,
}: {
  daftar: BarisAkun[]
  selfId: string
}) {
  const router = useRouter()
  const [sementara, mulai] = useTransition()
  const [kueri, setKueri] = useState('')

  const [nonaktifId, setNonaktifId] = useState<string | null>(null)
  const [hapusId, setHapusId] = useState<string | null>(null)

  const [peranTarget, setPeranTarget] = useState<BarisAkun | null>(null)
  const [peranBaru, setPeranBaru] = useState('')

  // v2.1 — fungsi tambahan akun (multi-fungsi)
  const [fungsiTarget, setFungsiTarget] = useState<BarisAkun | null>(null)
  const [fungsiDipilih, setFungsiDipilih] = useState<string[]>([])

  const [dataTarget, setDataTarget] = useState<BarisAkun | null>(null)
  const [form, setForm] = useState({ nama: '', nip: '', jabatan: '', instansi: '', telepon: '', tempatKerjaId: '', profesi: '' })
  const [opsiTK, setOpsiTK] = useState<{ id: string; nama: string; aktif?: boolean }[]>([])

  useEffect(() => {
    fetch('/api/tempat-kerja?semua=1')
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) =>
        setOpsiTK(
          (d.items ?? []).map((t: { id: string; nama: string; aktif?: boolean }) => ({
            id: t.id,
            nama: t.nama,
            aktif: t.aktif,
          }))
        )
      )
      .catch(() => {})
  }, [])

  const [resetTarget, setResetTarget] = useState<BarisAkun | null>(null)
  const [sandiKustom, setSandiKustom] = useState('')
  const [hasilSandi, setHasilSandi] = useState<HasilSandi | null>(null)

  // v1.3.0 — lihat sandi (superadmin) + ganti username
  const [sandiTampak, setSandiTampak] = useState<Record<string, string | null>>({})
  const [memuatSandiId, setMemuatSandiId] = useState<string | null>(null)
  const [semuaSandi, setSemuaSandi] = useState(false)
  const [usernameTarget, setUsernameTarget] = useState<BarisAkun | null>(null)
  const [usernameBaru, setUsernameBaru] = useState('')

  const terfilter = useMemo(() => {
    const q = kueri.trim().toLowerCase()
    if (!q) return daftar
    return daftar.filter((u) =>
      [u.nama, u.email, u.role, u.jabatan ?? '', u.instansi ?? '', u.nip ?? '']
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }, [daftar, kueri])

  const menunggu = terfilter.filter((u) => !u.isActive)
  const aktif = terfilter.filter((u) => u.isActive)

  const statistik = {
    total: daftar.length,
    menunggu: daftar.filter((u) => !u.isActive).length,
    superadmin: daftar.filter((u) => u.role === 'SUPERADMIN').length,
    peranTerpakai: new Set(daftar.map((u) => u.role)).size,
  }

  async function kirim(method: string, url: string, body?: unknown) {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      toast.error(data?.error ?? 'Permintaan gagal.')
      return null
    }
    mulai(() => router.refresh())
    return data as { pesan?: string; sandiBaru?: string }
  }

  async function ubahStatus(id: string, aksi: 'aktifkan' | 'nonaktifkan') {
    const hasil = await kirim('PATCH', '/api/superadmin/akun', { id, aksi })
    if (hasil) toast.success(hasil.pesan ?? 'Berubah.')
  }

  async function simpanPeran() {
    if (!peranTarget) return
    const hasil = await kirim('PATCH', '/api/superadmin/akun', {
      id: peranTarget.id,
      aksi: 'peran',
      role: peranBaru,
    })
    if (hasil) {
      toast.success(hasil.pesan ?? 'Peran diubah.')
      setPeranTarget(null)
    }
  }

  /** v2.1 — simpan fungsi tambahan akun (multi-fungsi). */
  async function simpanFungsi() {
    if (!fungsiTarget) return
    const hasil = await kirim('PATCH', '/api/superadmin/akun', {
      id: fungsiTarget.id,
      aksi: 'fungsi',
      fungsi: fungsiDipilih,
    })
    if (hasil) {
      toast.success(hasil.pesan ?? 'Fungsi tambahan disimpan.')
      setFungsiTarget(null)
    }
  }

  async function simpanData() {
    if (!dataTarget) return
    const hasil = await kirim('PATCH', '/api/superadmin/akun', {
      id: dataTarget.id,
      aksi: 'data',
      ...form,
    })
    if (hasil) {
      toast.success(hasil.pesan ?? 'Data diperbarui.')
      setDataTarget(null)
    }
  }

  async function resetSandi() {
    if (!resetTarget) return
    const isi = sandiKustom.trim()
    const hasil = await kirim(
      'POST',
      '/api/superadmin/akun',
      isi ? { id: resetTarget.id, sandiBaru: isi } : { id: resetTarget.id }
    )
    if (hasil?.sandiBaru) {
      setResetTarget(null)
      setSandiKustom('')
      setHasilSandi({ nama: resetTarget.nama, email: resetTarget.email, sandi: hasil.sandiBaru })
    } else if (hasil) {
      // Tanpa sandiBaru berarti gagal/tidak berubah — jangan tampilkan dialog hasil.
      toast.error(hasil.pesan ?? 'Reset sandi gagal.')
    }
  }

  async function hapus(id: string) {
    setHapusId(null)
    const hasil = await kirim('DELETE', `/api/superadmin/akun?id=${encodeURIComponent(id)}`)
    if (hasil) toast.success(hasil.pesan ?? 'Akun dihapus.')
  }

  /** v1.3.0 — tampilkan/sembunyikan sandi satu akun (didekripsi server). */
  async function toggleSandi(u: BarisAkun) {
    if (u.id in sandiTampak) {
      const salin = { ...sandiTampak }
      delete salin[u.id]
      setSandiTampak(salin)
      return
    }
    setMemuatSandiId(u.id)
    try {
      const res = await fetch('/api/superadmin/akun', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: u.id, aksi: 'lihat-sandi' }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(data?.error ?? 'Gagal membaca sandi.')
        return
      }
      setSandiTampak((s) => ({ ...s, [u.id]: data.sandi as string | null }))
      if (!data.sandi) toast.info(data.pesan ?? 'Sandi belum tersimpan — gunakan Reset Sandi.')
    } finally {
      setMemuatSandiId(null)
    }
  }

  /** v1.3.0 — tampilkan/sembunyikan SELURUH sandi sekaligus. */
  async function tampilkanSemuaSandi() {
    if (semuaSandi) {
      setSandiTampak({})
      setSemuaSandi(false)
      return
    }
    const res = await fetch('/api/superadmin/akun?sandi=1')
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      toast.error(data?.error ?? 'Gagal memuat sandi.')
      return
    }
    const peta: Record<string, string | null> = {}
    for (const u of (data.daftar ?? []) as Array<{ id: string; sandi: string | null }>) {
      peta[u.id] = u.sandi
    }
    setSandiTampak(peta)
    setSemuaSandi(true)
    toast.success('Seluruh sandi ditampilkan — pastikan layar tidak dilihat orang lain.')
  }

  /** v1.3.0 — ganti username (email masuk) milik akun lain. */
  async function simpanUsername() {
    if (!usernameTarget) return
    const hasil = await kirim('PATCH', '/api/superadmin/akun', {
      id: usernameTarget.id,
      aksi: 'username',
      email: usernameBaru.trim(),
    })
    if (hasil) {
      toast.success(hasil.pesan ?? 'Username diubah.')
      setUsernameTarget(null)
    }
  }

  const targetNonaktif = daftar.find((u) => u.id === nonaktifId)
  const targetHapus = daftar.find((u) => u.id === hapusId)

  function bukaUbahData(u: BarisAkun) {
    setDataTarget(u)
    setForm({
      nama: u.nama,
      nip: u.nip ?? '',
      jabatan: u.jabatan ?? '',
      instansi: u.instansi ?? '',
      telepon: u.telepon ?? '',
      tempatKerjaId: u.tempatKerjaId ?? '',
      profesi: u.profesi ?? '',
    })
  }

  function BarisAkunItem({ u }: { u: BarisAkun }) {
    const sendiri = u.id === selfId
    return (
      <div className="flex flex-col gap-3 border-b p-4 last:border-0 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{u.nama}</p>
            <BadgeStatus aktif={u.isActive} />
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              {ROLE_LABELS[u.role] ?? u.role}
            </span>
            {/* v2.1 — profesi ketua tim (pembagian tim per profesi) */}
            {u.profesi && (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                Profesi: {u.profesi}
              </span>
            )}
            {/* v2.1 — fungsi tambahan akun (multi-fungsi) */}
            {uraikanPeranEkstra(u.peranEkstra).map((r) => (
              <span
                key={r}
                className="rounded-full border border-dashed border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
              >
                + {PERAN_EKSTRA_LABELS[r] ?? r}
              </span>
            ))}
            {sendiri && (
              <span className="rounded-full border border-dashed px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                Akun Anda
              </span>
            )}
            {u._count.pengajuan > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {u._count.pengajuan} pengajuan
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{u.email}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Sandi:</span>
            {u.id in sandiTampak ? (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-bold text-foreground">
                {sandiTampak[u.id] ?? 'belum tersimpan — reset dulu'}
              </code>
            ) : u.sandiAda === false ? (
              <span className="text-xs italic text-muted-foreground">
                belum tersimpan (akun lama) — gunakan Reset Sandi
              </span>
            ) : (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs tracking-[0.3em] text-muted-foreground">
                ••••••••
              </code>
            )}
            <button
              type="button"
              onClick={() => toggleSandi(u)}
              disabled={memuatSandiId === u.id}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              title={u.id in sandiTampak ? 'Sembunyikan sandi' : 'Lihat sandi akun ini'}
            >
              {memuatSandiId === u.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : u.id in sandiTampak ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
              {u.id in sandiTampak ? 'Sembunyikan' : 'Lihat'}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {[u.jabatan, u.instansi].filter(Boolean).join(' · ') || 'Instansi tidak diisi'} ·
            Terdaftar {formatTanggal(u.createdAt)}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          {!u.isActive && !sendiri && (
            <Button
              size="sm"
              onClick={() => ubahStatus(u.id, 'aktifkan')}
              disabled={sementara}
              className="min-h-[36px]"
            >
              {sementara ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
              Aktifkan
            </Button>
          )}
          {u.isActive && !sendiri && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setNonaktifId(u.id)}
              disabled={sementara}
              className="min-h-[36px] border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
            >
              <UserMinus className="h-4 w-4" /> Nonaktifkan
            </Button>
          )}
          {!sendiri && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setPeranTarget(u)
                  setPeranBaru(u.role)
                }}
                disabled={sementara}
                className="min-h-[36px]"
              >
                <UserCog className="h-4 w-4" /> Peran
              </Button>
              {/* v2.1 — atur fungsi tambahan (multi-fungsi) */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setFungsiTarget(u)
                  setFungsiDipilih(uraikanPeranEkstra(u.peranEkstra))
                }}
                disabled={sementara}
                className="min-h-[36px]"
              >
                <Users className="h-4 w-4" /> Fungsi
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => bukaUbahData(u)}
                disabled={sementara}
                className="min-h-[36px]"
              >
                <UserPen className="h-4 w-4" /> Data
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setUsernameTarget(u)
                  setUsernameBaru('')
                }}
                disabled={sementara}
                className="min-h-[36px]"
              >
                <AtSign className="h-4 w-4" /> Username
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setResetTarget(u)
                  setSandiKustom('')
                }}
                disabled={sementara}
                className="min-h-[36px]"
              >
                <KeyRound className="h-4 w-4" /> Reset Sandi
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setHapusId(u.id)}
                disabled={sementara}
                className="min-h-[36px] border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" /> Hapus
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistik */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total Akun', nilai: statistik.total, ikon: Users },
          { label: 'Menunggu Verifikasi', nilai: statistik.menunggu, ikon: ShieldQuestion },
          { label: 'Superadmin', nilai: statistik.superadmin, ikon: UserCog },
          { label: 'Jenis Peran Terpakai', nilai: statistik.peranTerpakai, ikon: UserX },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <s.ikon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold leading-none">{s.nilai}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pencarian + tampilkan semua sandi (v1.3.0) */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={kueri}
            onChange={(e) => setKueri(e.target.value)}
            placeholder="Cari nama, email, peran, jabatan, instansi, atau NIP…"
            className="pl-9"
            aria-label="Cari akun"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            size="sm"
            variant={semuaSandi ? 'default' : 'outline'}
            onClick={tampilkanSemuaSandi}
            className="min-h-[36px]"
          >
            {semuaSandi ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {semuaSandi ? 'Sembunyikan Semua Sandi' : 'Tampilkan Semua Sandi'}
          </Button>
          <p className="text-xs text-muted-foreground">
            Hanya Superadmin yang dapat melihat username &amp; sandi seluruh akun, serta
            mengganti/meresetnya. Setiap pembacaan dicatat pada log server.
          </p>
        </div>
      </div>

      {/* Menunggu verifikasi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldQuestion className="h-5 w-5 text-amber-600" /> Menunggu Verifikasi
            {menunggu.length > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                {menunggu.length}
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Akun nonaktif tidak dapat masuk — baik pendaftaran mandiri yang baru maupun akun yang
            Anda nonaktifkan. Aktifkan untuk membuka aksesnya kembali.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {menunggu.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              {kueri ? 'Tidak ada hasil yang cocok dengan pencarian.' : 'Tidak ada akun yang menunggu verifikasi.'}
            </p>
          ) : (
            menunggu.map((u) => <BarisAkunItem key={u.id} u={u} />)
          )}
        </CardContent>
      </Card>

      {/* Akun aktif */}
      <Card>
        <CardHeader>
          <CardTitle>Seluruh Akun</CardTitle>
          <CardDescription>
            Kontrol penuh: aktifkan/nonaktifkan, ubah peran, perbarui data, lihat sandi, ganti
            username, reset kata sandi, atau hapus akun. Aksi pada akun sendiri dibatasi demi
            keamanan.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {aktif.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              {kueri ? 'Tidak ada hasil yang cocok dengan pencarian.' : 'Belum ada akun aktif.'}
            </p>
          ) : (
            aktif.map((u) => <BarisAkunItem key={u.id} u={u} />)
          )}
        </CardContent>
      </Card>

      {/* Konfirmasi nonaktifkan */}
      <AlertDialog open={nonaktifId !== null} onOpenChange={(o) => !o && setNonaktifId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nonaktifkan akun ini?</AlertDialogTitle>
            <AlertDialogDescription>
              {targetNonaktif
                ? `Akun ${targetNonaktif.nama} (${targetNonaktif.email}) tidak akan dapat masuk ke aplikasi. Sesi yang sedang aktif otomatis dicabut. Data dan pengajuannya tetap tersimpan, dan Anda dapat mengaktifkannya kembali kapan saja.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => nonaktifId && ubahStatus(nonaktifId, 'nonaktifkan')}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              Ya, Nonaktifkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Konfirmasi hapus */}
      <AlertDialog open={hapusId !== null} onOpenChange={(o) => !o && setHapusId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus akun ini secara permanen?</AlertDialogTitle>
            <AlertDialogDescription>
              {targetHapus
                ? `Akun ${targetHapus.nama} (${targetHapus.email}) akan dihapus permanen dan tidak dapat dipulihkan.` +
                  (targetHapus._count.pengajuan > 0
                    ? ` PERHATIAN: akun ini memiliki ${targetHapus._count.pengajuan} pengajuan kredensial — seluruh pengajuan, biodata, penilaian, dan dokumen terkait ikut terhapus.`
                    : ' Akun belum memiliki pengajuan.')
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => hapusId && hapus(hapusId)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Ya, Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog ubah peran */}
      <Dialog open={peranTarget !== null} onOpenChange={(o) => !o && setPeranTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ubah Peran Akun</DialogTitle>
            <DialogDescription>
              {peranTarget
                ? `Atur peran ${peranTarget.nama} (${peranTarget.email}). Perubahan berlaku seketika — menu dan wewenang mengikuti peran baru tanpa perlu keluar-masuk ulang.`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="peran-baru">Peran baru</Label>
            <Select value={peranBaru} onValueChange={setPeranBaru}>
              <SelectTrigger id="peran-baru">
                <SelectValue placeholder="Pilih peran" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r] ?? r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Hati-hati: memberi peran Superadmin berarti memberi akses penuh atas seluruh data dan
              akun.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPeranTarget(null)}>
              Batal
            </Button>
            <Button onClick={simpanPeran} disabled={sementara || peranBaru === peranTarget?.role}>
              {sementara ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Simpan Peran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* v2.1 — Dialog fungsi tambahan akun (multi-fungsi) */}
      <Dialog open={fungsiTarget !== null} onOpenChange={(o) => !o && setFungsiTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Fungsi Tambahan Akun</DialogTitle>
            <DialogDescription>
              {fungsiTarget
                ? `Berikan 1–3 fungsi tambahan kepada ${fungsiTarget.nama} (${fungsiTarget.email}) di samping peran utamanya sebagai ${ROLE_LABELS[fungsiTarget.role] ?? fungsiTarget.role}. Menu fungsi tambahan langsung tampil di akunnya tanpa perlu keluar-masuk ulang.`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {PERAN_EKSTRA.map((r) => {
              const dipilih = fungsiDipilih.includes(r)
              const samaPeranUtama = fungsiTarget?.role === r
              return (
                <label
                  key={r}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                    dipilih ? 'border-primary/50 bg-primary/5' : 'hover:bg-muted/50',
                    samaPeranUtama && 'cursor-not-allowed opacity-60'
                  )}
                >
                  <Checkbox
                    checked={dipilih && !samaPeranUtama}
                    disabled={samaPeranUtama}
                    onCheckedChange={(v) => {
                      setFungsiDipilih((s) => (v ? [...s, r] : s.filter((x) => x !== r)))
                    }}
                    className="mt-0.5"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">
                      {PERAN_EKSTRA_LABELS[r] ?? r}
                      {samaPeranUtama && (
                        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          peran utama
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                      {r === 'ASESOR' &&
                        'Menilai kewenangan klinis pengajuan yang ditugaskan Operator (salah satu dari tiga asesor penilai).'}
                      {r === 'PIMPINAN_FASYANKES' &&
                        'Menerbitkan SPK dan memverifikasi logbook bulanan asesi fasyankes yang terhubung pada akun ini.'}
                      {r === 'KETUA_TIM_KREDENSIAL' &&
                        'Menetapkan kesimpulan rekomendasi tim kredensial sesuai profesi yang ditetapkan.'}
                    </span>
                  </span>
                </label>
              )
            })}
            <p className="text-xs text-muted-foreground">
              Contoh: akun Asesi yang juga Asesor dan Pimpinan Fasyankes dapat menjalankan ketiganya
              dari satu akun — menu masing-masing fungsi muncul pada bilah sampingnya.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFungsiTarget(null)}>
              Batal
            </Button>
            <Button onClick={simpanFungsi} disabled={sementara}>
              {sementara ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
              Simpan Fungsi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog ubah data akun */}
      <Dialog open={dataTarget !== null} onOpenChange={(o) => !o && setDataTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ubah Data Akun</DialogTitle>
            <DialogDescription>
              {dataTarget
                ? `Perbarui identitas ${dataTarget.nama} (${dataTarget.email}). Email dan kata sandi tidak diubah di sini.`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="f-nama">Nama</Label>
              <Input
                id="f-nama"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="f-nip">NIP</Label>
              <Input
                id="f-nip"
                value={form.nip}
                onChange={(e) => setForm({ ...form, nip: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="f-jabatan">Jabatan</Label>
              <Input
                id="f-jabatan"
                value={form.jabatan}
                onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
              />
            </div>
            {/* v2.1 — profesi ketua tim kredensial (pembagian tim per profesi) */}
            {dataTarget &&
              (dataTarget.role === 'KETUA_TIM_KREDENSIAL' ||
                uraikanPeranEkstra(dataTarget.peranEkstra).includes('KETUA_TIM_KREDENSIAL')) && (
              <div className="grid gap-1.5">
                <Label htmlFor="f-profesi">Profesi Tim Kredensial</Label>
                <Select
                  value={form.profesi || 'TANPA_PROFESI'}
                  onValueChange={(v) => setForm({ ...form, profesi: v === 'TANPA_PROFESI' ? '' : v })}
                >
                  <SelectTrigger id="f-profesi" className="w-full">
                    <SelectValue placeholder="Pilih profesi..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TANPA_PROFESI">— Semua profesi (tidak dibatasi) —</SelectItem>
                    {JENIS_PROFESI.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Pembagian tim kredensial berdasarkan profesi: ketua tim dengan profesi tertentu
                  hanya menangani pengajuan asesi dengan profesi yang sama.
                </p>
              </div>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="f-instansi">Instansi</Label>
              <Input
                id="f-instansi"
                value={form.instansi}
                onChange={(e) => setForm({ ...form, instansi: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="f-tempatkerja">Fasyankes Terhubung (Tempat Kerja)</Label>
              <Select
                value={form.tempatKerjaId || 'TANPA'}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    tempatKerjaId: v === 'TANPA' ? '' : v,
                    instansi: v === 'TANPA' ? form.instansi : opsiTK.find((t) => t.id === v)?.nama ?? form.instansi,
                  })
                }
              >
                <SelectTrigger id="f-tempatkerja" className="w-full">
                  <SelectValue placeholder="Pilih fasyankes..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TANPA">— Tidak dihubungkan —</SelectItem>
                  {opsiTK.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nama}
                      {!t.aktif ? ' (nonaktif)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Wajib diisi untuk akun Pimpinan Fasyankes: menentukan asesi fasyankes mana yang
                logbook dan SPK-nya dapat diproses akun ini.
              </p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="f-telepon">Telepon</Label>
              <Input
                id="f-telepon"
                value={form.telepon}
                onChange={(e) => setForm({ ...form, telepon: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDataTarget(null)}>
              Batal
            </Button>
            <Button onClick={simpanData} disabled={sementara || !form.nama.trim()}>
              {sementara ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog ganti username (v1.3.0) */}
      <Dialog open={usernameTarget !== null} onOpenChange={(o) => !o && setUsernameTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ganti Username Akun</DialogTitle>
            <DialogDescription>
              {usernameTarget
                ? `Username adalah nama yang dipakai ${usernameTarget.nama} untuk masuk. Saat ini: ${usernameTarget.email}. Setelah diganti, username lama tidak dapat dipakai lagi.`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="username-baru">Username baru</Label>
            <Input
              id="username-baru"
              type="text"
              value={usernameBaru}
              onChange={(e) => setUsernameBaru(e.target.value)}
              placeholder="contoh: nama@kredens.go.id"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Gunakan format email, 5–120 karakter, dan belum dipakai akun lain. Kata sandi tidak
              berubah — untuk menggantinya gunakan Reset Sandi.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUsernameTarget(null)}>
              Batal
            </Button>
            <Button
              onClick={simpanUsername}
              disabled={sementara || usernameBaru.trim().length < 5}
            >
              {sementara ? <Loader2 className="h-4 w-4 animate-spin" /> : <AtSign className="h-4 w-4" />}
              Simpan Username
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog reset sandi */}
      <Dialog open={resetTarget !== null} onOpenChange={(o) => !o && setResetTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Kata Sandi</DialogTitle>
            <DialogDescription>
              {resetTarget
                ? `Kosongkan agar sistem membuat sandi acak yang aman, atau isi sendiri (minimal 8 karakter). Sandi baru hanya ditampilkan sekali setelah direset.`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="sandi-kustom">Kata sandi baru (opsional)</Label>
            <Input
              id="sandi-kustom"
              type="text"
              value={sandiKustom}
              onChange={(e) => setSandiKustom(e.target.value)}
              placeholder="Kosongkan untuk sandi acak otomatis"
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)}>
              Batal
            </Button>
            <Button
              onClick={resetSandi}
              disabled={sementara || (sandiKustom.trim().length > 0 && sandiKustom.trim().length < 8)}
            >
              {sementara ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Reset Sandi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hasil sandi baru */}
      <Dialog open={hasilSandi !== null} onOpenChange={(o) => !o && setHasilSandi(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sandi Baru Berhasil Diterapkan</DialogTitle>
            <DialogDescription>
              {hasilSandi
                ? `Kata sandi untuk ${hasilSandi.nama} (${hasilSandi.email}) telah direset. Catat sekarang — pesan ini hanya muncul sekali.`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
            <code className="min-w-0 flex-1 break-all font-mono text-sm font-bold text-foreground">
              {hasilSandi?.sandi}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                if (!hasilSandi) return
                try {
                  await navigator.clipboard.writeText(hasilSandi.sandi)
                  toast.success('Sandi disalin ke papan klip.')
                } catch {
                  toast.error('Gagal menyalin — catat secara manual.')
                }
              }}
            >
              <Copy className="h-4 w-4" /> Salin
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setHasilSandi(null)}>Selesai</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
