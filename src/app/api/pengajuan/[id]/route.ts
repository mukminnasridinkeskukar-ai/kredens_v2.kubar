import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'

type Ctx = { params: Promise<{ id: string }> }

async function ownedPengajuan(userId: string, id: string, role: string) {
  return db.pengajuan.findFirst({
    where: { id, ...(role === 'ASESI' ? { userId } : {}) },
    include: {
      user: { select: { id: true, nama: true, email: true } },
      formulir: true,
      kewenangan: { orderBy: { urutan: 'asc' } },
      rekomendasiTim: true,
      rekomendasiKadis: true,
      spk: true,
      jadwal: { orderBy: { tanggal: 'asc' } },
      riwayat: { orderBy: { createdAt: 'asc' } },
    },
  })
}

// GET /api/pengajuan/[id] — detail lengkap
export async function GET(_req: NextRequest, ctx: Ctx) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response
  const { id } = await ctx.params
  const pengajuan = await ownedPengajuan(guard.session.user.id, id, guard.session.user.role)
  if (!pengajuan) return NextResponse.json({ error: 'Pengajuan tidak ditemukan' }, { status: 404 })
  return NextResponse.json(pengajuan)
}

// DELETE /api/pengajuan/[id] — hanya draft
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response
  const { id } = await ctx.params
  const pengajuan = await db.pengajuan.findUnique({ where: { id } })
  if (!pengajuan || pengajuan.userId !== guard.session.user.id)
    return NextResponse.json({ error: 'Pengajuan tidak ditemukan' }, { status: 404 })
  if (pengajuan.status !== 'DRAFT')
    return NextResponse.json(
      { error: 'Hanya pengajuan berstatus draf yang dapat dihapus' },
      { status: 400 }
    )
  await db.pengajuan.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
