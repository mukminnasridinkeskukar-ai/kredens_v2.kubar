import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'
import { cocokkanSandi, hashPassword, enkripsiSandi } from '@/lib/password'

// PUT /api/akun/password — ganti kata sandi
export async function PUT(req: NextRequest) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response
  const body = await req.json()
  const { sandiLama, sandiBaru } = body

  if (!sandiLama || !sandiBaru)
    return NextResponse.json({ error: 'Kata sandi lama dan baru wajib diisi' }, { status: 400 })
  if (String(sandiBaru).length < 8)
    return NextResponse.json({ error: 'Kata sandi baru minimal 8 karakter' }, { status: 400 })

  const user = await db.user.findUnique({ where: { id: guard.session.user.id } })
  if (!user) return NextResponse.json({ error: 'Akun tidak ditemukan' }, { status: 404 })
  // v1.3.1: cocokkanSandi juga mengenali sandi polos yang diketik manual di
  // database, sehingga akun tersebut tetap dapat mengganti sandinya sendiri.
  if (!cocokkanSandi(sandiLama, user.passwordHash))
    return NextResponse.json({ error: 'Kata sandi lama tidak sesuai' }, { status: 400 })

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(sandiBaru), sandiTersimpan: enkripsiSandi(sandiBaru) },
  })
  return NextResponse.json({ ok: true })
}
