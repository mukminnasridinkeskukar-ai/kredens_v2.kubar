'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Stethoscope } from 'lucide-react'

/**
 * Error boundary halaman (App Router).
 * Menampilkan layar ramah berbahasa Indonesia ketika Server Component gagal
 * dirender pada production (di mana pesan asli disembunyikan Next.js dan hanya
 * tersedia "digest"). Digest ditampilkan agar pelaporan ke pengelola mudah
 * ditelusuri pada log server.
 *
 * Sejak v1.2.5: layar galat juga memandu pengelola ke /api/setup (pemeriksa
 * database mandiri) — penyebab paling umum galat halaman adalah database
 * produksi yang belum siap / terputus.
 */
export default function ErrorHalaman({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[KREDENS] Terjadi kesalahan pada halaman:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <AlertTriangle className="h-7 w-7 text-amber-600" />
        </div>
        <h1 className="text-lg font-bold">Halaman Tidak Dapat Ditampilkan</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Terjadi gangguan saat memuat halaman ini. Tekan tombol di bawah untuk
          mencoba lagi. Bila terus muncul, muat ulang aplikasi atau keluar dan
          masuk kembali ke akun Anda.
        </p>
        {error?.digest && (
          <p className="mt-3 rounded-lg bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
            Kode galat: {error.digest}
          </p>
        )}
        <Button onClick={reset} className="mt-5 min-h-[40px]">
          <RefreshCw className="h-4 w-4" /> Coba Lagi
        </Button>
        <div className="mt-5 rounded-lg border border-dashed p-3 text-left">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Stethoscope className="h-3.5 w-3.5" /> Petunjuk pengelola
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Buka{' '}
            <a href="/api/setup" className="font-medium text-primary underline">
              /api/setup
            </a>{' '}
            untuk memeriksa database. Bila tertulis <code>ok: false</code>, buka{' '}
            <a href="/api/setup?force=1" className="font-medium text-primary underline">
              /api/setup?force=1
            </a>{' '}
            sekali sampai <code>ok: true</code>, lalu masuk kembali.
          </p>
        </div>
      </div>
    </div>
  )
}
