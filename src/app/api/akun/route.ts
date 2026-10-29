import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'
import { verifyPassword, hashPassword } from '@/lib/password'

// GET /api/akun — info akun
export async function GET() {
  const guard = await requireSession()
  if (!guard.ok) return guard.response
  const user = await db.user.findUnique({
    where: { id: guard.session.user.id },
    select: {
      id: true,
      nama: true,
      email: true,
      role: true,
      nip: true,
      jabatan: true,
      instansi: true,
      telepon: true,
      createdAt: true,
    },
  })
  return NextResponse.json(user)
}

// PUT /api/akun — perbarui profil akun
export async function PUT(req: NextRequest) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response
  const body = await req.json().catch(() => null)

  const nama = String(body?.nama ?? '').trim()
  const telepon = String(body?.telepon ?? '').trim()
  if (nama.length < 3) {
    return NextResponse.json(
      { error: 'Nama lengkap wajib diisi (minimal 3 karakter).' },
      { status: 400 },
    )
  }
  if (nama.length > 120) {
    return NextResponse.json({ error: 'Nama lengkap terlalu panjang (maksimal 120 karakter).' }, { status: 400 })
  }
  if (telepon && !/^[0-9+()\-\s]{5,20}$/.test(telepon)) {
    return NextResponse.json(
      { error: 'Format nomor telepon tidak valid.' },
      { status: 400 },
    )
  }

  const user = await db.user.update({
    where: { id: guard.session.user.id },
    data: {
      nama,
      telepon: telepon || null,
    },
    select: { id: true, nama: true, email: true, role: true, telepon: true },
  })
  return NextResponse.json(user)
}
