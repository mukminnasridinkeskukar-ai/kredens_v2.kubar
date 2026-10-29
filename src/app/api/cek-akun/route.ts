import { NextRequest, NextResponse } from 'next/server'
import { cocokkanSandi } from '@/lib/password'
import { cariPenggunaByEmail } from '@/lib/cari-user'

/**
 * POST /api/cek-akun — membantu halaman login menampilkan pesan yang tepat.
 * Mengembalikan status spesifik HANYA bila email + kata sandi cocok,
 * sehingga tidak membuka celah pembobolan (menebak email terdaftar).
 * v1.3.1: memakai cocokkanSandi agar akun ber-sandi polos (dibuat manual di
 * database) juga dikenali statusnya dengan benar sebelum login.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const email = String(body?.email ?? '').trim().toLowerCase()
  const kataSandi = String(body?.kataSandi ?? '')

  if (!email || !kataSandi) {
    return NextResponse.json({ status: 'TIDAK_COCOK' })
  }

  // v1.3.1: pencarian email tidak case-sensitive (akun dibuat manual di
  // database dengan huruf besar tetap dikenali).
  const user = await cariPenggunaByEmail(email)
  if (!user || !cocokkanSandi(kataSandi, user.passwordHash)) {
    return NextResponse.json({ status: 'TIDAK_COCOK' })
  }

  if (!user.isActive) {
    return NextResponse.json({ status: 'BELUM_VERIFIKASI' })
  }

  return NextResponse.json({ status: 'AKTIF' })
}
