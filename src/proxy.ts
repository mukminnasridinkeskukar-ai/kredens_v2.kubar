import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy (dulu: middleware) — konvensi Next.js 16: file ini bernama proxy.ts.
 *
 * v1.3.6 — Pengamanan sesi: pengunjung TANPA cookie sesi (belum login, sesi
 * hangus, tab baru tanpa sesi) yang membuka halaman aplikasi mana pun
 * dialihkan keluar dari halaman aplikasi.
 *
 * v1.3.7 — KOREKSI: titik pendar tanpa sesi kembali ke /login, bukan situs
 * utama — pengalihan langsung ke situs utama membuat platform mustahil
 * dimasuki karena halaman masuk tidak pernah terlihat. Disiplin sesi tetap
 * terjaga: sesi tidak dibawa antar-peramban/tab (wajib masuk ulang), dan
 * pengembalian ke SITUS UTAMA (mukminnasri.com) tetap berlaku pada tombol
 * Keluar, diam 15 menit (idle), dan pasca-ubah sandi (src/lib/keluar.ts).
 *
 * Desain: proxy hanya pemeriksaan kasar keberadaan cookie (tanpa ketergantungan
 * env/secret sehingga identik di dev & produksi); VERIFIKASI ASLI dilakukan di
 * guard server tiap halaman (getServerSession/requirePageRole) dan tiap API
 * (requireApiRole) — cookie palsu tetap gagal di sana (401/redirect), tidak ada
 * data yang bocor. Sesi JWT berumur maksimal 8 jam (auth.ts), sehingga cookie
 * lama otomatis hangus oleh peramban.
 */
export default async function proxy(req: NextRequest) {
  const adaSesi =
    !!req.cookies.get('next-auth.session-token') ||
    !!req.cookies.get('__Secure-next-auth.session-token')
  if (!adaSesi) {
    return NextResponse.redirect(new URL('/login', req.url), 307)
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Semua halaman KECUALI: halaman masuk/daftar, API (dengan guard sendiri),
    // aset statis Next, dan aset publik aplikasi.
    '/((?!login|daftar|api|_next/static|_next/image|_next/webpack-hmr|favicon.ico|icon.png|robots.txt|logo-kubar.png|logo-kubar-full.png|logo-mark.png|logo-full.png|kubar-shield.svg|manifest.webmanifest|sitemap.xml).*)',
  ],
}
