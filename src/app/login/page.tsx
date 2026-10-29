'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Loader2, Lock, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { APP_NAME, APP_FULL_NAME } from '@/lib/constants'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.error) {
      // Bedakan pesan: akun terdaftar namun belum diverifikasi operator
      try {
        const cek = await fetch('/api/cek-akun', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, kataSandi: password }),
        })
        const data = await cek.json()
        if (data?.status === 'BELUM_VERIFIKASI') {
          setError(
            'Akun Anda terdaftar tetapi belum diverifikasi Operator Kredensial. Silakan menunggu aktivasi akun.',
          )
          return
        }
      } catch {
        // fallback: tampilkan pesan umum
      }
      setError('Email atau kata sandi tidak sesuai. Silakan periksa kembali.')
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Panel kiri — branding */}
      <div className="relative flex min-h-[220px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#16a34a] via-primary to-[#0b3d24] px-6 py-8 text-primary-foreground lg:min-h-screen lg:w-[46%] lg:px-12 lg:py-12">
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
            {APP_FULL_NAME}. Satu pintu pengelolaan permohonan kredensial, penilaian tim,
            rekomendasi, hingga surat penugasan klinis tenaga medis dan tenaga kesehatan.
          </p>
        </div>
        <div className="mt-8 hidden gap-4 lg:grid lg:grid-cols-3">
          {[
            ['7', 'Jenis Akun Pengguna'],
            ['Digital', 'Alur Kredensial'],
            ['RKK & SPK', 'Dokumen Terpadu'],
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
          <h2 className="text-xl font-bold text-foreground">Masuk ke Akun</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gunakan email resmi yang terdaftar pada operator kredensial.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="password">Kata Sandi</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Kata sandi Anda"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  <Loader2 className="h-4 w-4 animate-spin" /> Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>
          <p className="mt-6 border-t pt-4 text-center text-sm text-muted-foreground">
            Belum punya akun?{' '}
            <Link href="/daftar" className="font-semibold text-primary hover:underline">
              Daftar Akun
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
