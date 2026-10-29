import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'

async function getProfileId(userId: string) {
  const profile = await db.asesiProfile.findUnique({ where: { userId } })
  if (!profile) throw new Error('Profil belum ada')
  return profile.id
}

// POST /api/biodata/pendidikan
export async function POST(req: NextRequest) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response
  try {
    const body = await req.json()
    const asesiId = await getProfileId(guard.session.user.id)
    const count = await db.riwayatPendidikan.count({ where: { asesiId } })
    const item = await db.riwayatPendidikan.create({
      data: {
        asesiId,
        jenjang: String(body.jenjang ?? ''),
        namaInstitusi: String(body.namaInstitusi ?? ''),
        tahun: body.tahun ?? null,
        nomorIjazah: body.nomorIjazah ?? null,
        urutan: body.urutan ?? count,
      },
    })
    return NextResponse.json(item)
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Gagal menyimpan' }, { status: 400 })
  }
}
