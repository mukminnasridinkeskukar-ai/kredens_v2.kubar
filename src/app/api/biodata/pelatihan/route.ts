import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'

// POST /api/biodata/pelatihan
export async function POST(req: NextRequest) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response
  try {
    const body = await req.json()
    const profile = await db.asesiProfile.findUnique({ where: { userId: guard.session.user.id } })
    if (!profile) return NextResponse.json({ error: 'Profil belum ada' }, { status: 400 })
    const count = await db.pelatihanKompetensi.count({ where: { asesiId: profile.id } })
    const item = await db.pelatihanKompetensi.create({
      data: {
        asesiId: profile.id,
        namaKegiatan: String(body.namaKegiatan ?? ''),
        penyelenggara: body.penyelenggara ?? null,
        tahun: body.tahun ?? null,
        jumlahJp: body.jumlahJp ?? null,
        nomorSertifikat: body.nomorSertifikat ?? null,
        urutan: body.urutan ?? count,
      },
    })
    return NextResponse.json(item)
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Gagal menyimpan' }, { status: 400 })
  }
}
