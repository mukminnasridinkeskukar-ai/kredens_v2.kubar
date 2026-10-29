'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, Loader2, Mail, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { APP_NAME, APP_FULL_NAME } from '@/lib/constants'

const PILIHAN_PERAN = [
  {
    nilai: 'ASESI',
    judul: 'Asesi',
    keterangan: 'Tenaga medis / tenaga kesehatan pengusul kredensial',
  },
  {
    nilai: 'ASESOR',
    judul: 'Asesor',
    keterangan: 'Penilai kewenangan klinis pada tim kredensial',
  },
  {
    nilai: 'PIMPINAN_FASYANKES',
    judul: 'Pimpinan Fasyankes',
    keterangan: 'Kepala Puskesmas / RS penerbit Surat Penugasan Klinis',
  },
]

export default function DaftarPage() {
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [peran, setPeran] = useState('ASESI')
  const [instansi, setInstansi] = useState('')
  const [jabatan, setJabatan] = useState('')
  const [kataSandi, setKataSandi] = useState('')
  const [konfirmasi, setKonfirmasi] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sukses, setSukses] = useState(false)
  const [opsiTK, setOpsiTK] = useState<{ id: string; nama: string }[]>([])
  const [tempatKerjaId, setTempatKerjaId] = useState('')

  useEffect(() => {
    if (peran !== 'PIMPINAN_FASYANKES' || opsiTK.length > 0) return
    fetch('/api/tempat-kerja')
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setOpsiTK((d.items ?? []).map((t: { id: string; nama: string }) => ({ id: t.id, nama: t.nama }))))
      .catch(() => {})
  }, [peran, opsiTK.length])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (kataSandi.length < 8) {
      setError('Kata sandi minimal 8 karakter.')
      return
    }
    if (kataSandi !== konfirmasi) {
      setError('Konfirmasi kata sandi tidak sama.')
      return
    }
    if (peran === 'PIMPINAN_FASYANKES' && !tempatKerjaId) {
      setError('Pimpinan Fasyankes wajib memilih fasyankes/tempat kerja dari daftar.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/daftar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama,
          email,
          peran,
          instansi: peran === 'PIMPINAN_FASYANKES' ? '' : instansi,
          tempatKerjaId: peran === 'PIMPINAN_FASYANKES' ? tempatKerjaId : '',
          jabatan,
          kataSandi,
          konfirmasi,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error ?? 'Pendaftaran gagal. Silakan coba lagi.')
        return
      }
      setSukses(true)
    } catch {
      setError('Tidak dapat menghubungi server. Periksa koneksi Anda.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Panel kiri — branding */}
      <div className="relative flex min-h-[200px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#16a34a] via-primary to-[#0b3d24] px-6 py-8 text-primary-foreground lg:min-h-screen lg:w-[46%] lg:px-12 lg:py-12">
        {/* Aksen bintang emas lambang Kubar */}
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#ffec00]/15 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg ring-1 ring-black/10">
              <Image
                src="/logo-kubar.png"
                alt="Logo KREDENS v2.kubar"
                width={64}
                height={64}
                priority
                className="h-16 w-16 object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{APP_NAME}</h1>
              <p className="text-sm text-primary-foreground/80">Dinas Kesehatan Kab. Kutai Barat</p>
            </div>
          </div>
          <p className="mt-8 max-w-md text-sm leading-relaxed text-primary-foreground/90 lg:mt-12 lg:text-base">
            {APP_FULL_NAME}. Daftarkan akun Anda, lengkapi biodata dan pengajuan kredensial,
            lalu pantau proses hingga Surat Penugasan Klinis diterbitkan.
          </p>
        </div>
        <div className="mt-8 hidden gap-4 lg:grid lg:grid-cols-3">
          {[
            ['1', 'Daftarkan Akun'],
            ['2', 'Verifikasi Operator'],
            ['3', 'Aktif Digunakan'],
          ].map(([v, l]) => (
            <div key={l} className="rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 p-4">
              <p className="text-lg font-bold">{v}</p>
              <p className="text-xs text-primary-foreground/80">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Panel kanan — form */}
      <div className="flex flex-1 items-center justify-center bg-muted/40 px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          {sukses ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="mt-4 text-xl font-bold">Pendaftaran Berhasil</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Akun <span className="font-semibold text-foreground">{email}</span> telah terdaftar
                dengan status <span className="font-semibold">Menunggu Verifikasi</span>.
                Operator Kredensial akan memeriksa pendaftaran Anda. Setelah diaktifkan,
                Anda dapat masuk menggunakan email dan kata sandi ini.
              </p>
              <Button asChild className="mt-6 w-full min-h-[44px]">
                <Link href="/login">Kembali ke Halaman Masuk</Link>
              </Button>
            </div>
          ) : (
            <>
              <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
                <UserPlus className="h-5 w-5 text-primary" /> Daftar Akun
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Akun baru aktif setelah diverifikasi Operator Kredensial.
              </p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Lengkap (dengan gelar)</Label>
                  <Input
                    id="nama"
                    required
                    placeholder="Contoh: Ns. Budi Santoso, S.Kep"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Aktif</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="nama@kutaibarat.go.id"
                      className="pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Daftar sebagai</Label>
                  <div className="grid gap-2">
                    {PILIHAN_PERAN.map((p) => (
                      <label
                        key={p.nilai}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                          peran === p.nilai
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="peran"
                          value={p.nilai}
                          checked={peran === p.nilai}
                          onChange={() => setPeran(p.nilai)}
                          className="mt-1 accent-[var(--primary)]"
                        />
                        <span>
                          <span className="block text-sm font-semibold text-foreground">{p.judul}</span>
                          <span className="block text-xs text-muted-foreground">{p.keterangan}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {peran === 'PIMPINAN_FASYANKES' ? (
                    <div className="space-y-2">
                      <Label htmlFor="fasyankes">Fasyankes / Tempat Kerja *</Label>
                      <Select value={tempatKerjaId || undefined} onValueChange={setTempatKerjaId} required>
                        <SelectTrigger id="fasyankes" className="w-full">
                          <SelectValue placeholder="Pilih fasyankes..." />
                        </SelectTrigger>
                        <SelectContent>
                          {opsiTK.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.nama}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        Menentukan asesi fasyankes yang laporan logbook dan SPK-nya dapat Anda
                        proses. Bila fasyankes belum terdaftar, hubungi Superadmin Dinkes.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="instansi">Instansi / Fasyankes</Label>
                      <Input
                        id="instansi"
                        placeholder="Puskesmas / RS"
                        value={instansi}
                        onChange={(e) => setInstansi(e.target.value)}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="jabatan">Jabatan</Label>
                    <Input
                      id="jabatan"
                      placeholder="Opsional"
                      value={jabatan}
                      onChange={(e) => setJabatan(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="kataSandi">Kata Sandi</Label>
                    <Input
                      id="kataSandi"
                      type="password"
                      required
                      autoComplete="new-password"
                      placeholder="Minimal 8 karakter"
                      value={kataSandi}
                      onChange={(e) => setKataSandi(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="konfirmasi">Ulangi Kata Sandi</Label>
                    <Input
                      id="konfirmasi"
                      type="password"
                      required
                      autoComplete="new-password"
                      placeholder="Ulangi kata sandi"
                      value={konfirmasi}
                      onChange={(e) => setKonfirmasi(e.target.value)}
                    />
                  </div>
                </div>
                {error && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full min-h-[44px]" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Mengirim...
                    </>
                  ) : (
                    'Kirim Pendaftaran'
                  )}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Sudah punya akun?{' '}
                  <Link href="/login" className="font-semibold text-primary hover:underline">
                    Masuk di sini
                  </Link>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
