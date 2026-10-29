import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'

// POST /api/biodata/pengalaman
export async function POST(req: NextRequest) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response
  try {
    const body = await req.json()
    const profile = await db.asesiProfile.findUnique({ where: { userId: guard.session.user.id } })
    if (!profile) return NextResponse.json({ error: 'Profil belum ada' }, { status: 400 })
    const count = await db.pengalamanKerja.count({ where: { asesiId: profile.id } })
    const item = await db.pengalamanKerja.create({
      data: {
        asesiId: profile.id,
        tempatKerja: String(body.tempatKerja ?? ''),
        jabatan: String(body.jabatan ?? ''),
        periodeMulai: body.periodeMulai ?? null,
        periodeSelesai: body.periodeSelesai ?? null,
        masihBekerja: Boolean(body.masihBekerja),
        urutan: body.urutan ?? count,
      },
    })
    return NextResponse.json(item)
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Gagal menyimpan' }, { status: 400 })
  }
}
