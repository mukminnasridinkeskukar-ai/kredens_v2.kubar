import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'

type Ctx = { params: Promise<{ id: string }> }

// POST /api/pengajuan/[id]/submit — ajukan draft
export async function POST(_req: NextRequest, ctx: Ctx) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response
  const { id } = await ctx.params
  const p = await db.pengajuan.findUnique({
    where: { id },
    include: { kewenangan: true, formulir: true },
  })
  if (!p || p.userId !== guard.session.user.id)
    return NextResponse.json({ error: 'Pengajuan tidak ditemukan' }, { status: 404 })
  if (p.status !== 'DRAFT')
    return NextResponse.json({ error: 'Pengajuan sudah diajukan' }, { status: 400 })
  if (p.kewenangan.length === 0)
    return NextResponse.json(
      { error: 'Minimal 1 kewenangan klinis harus diisi sebelum mengajukan' },
      { status: 400 }
    )
  if (!p.formulir?.pernyataan)
    return NextResponse.json(
      { error: 'Pernyataan kompetensi pada Formulir wajib diceklis sebelum mengajukan' },
      { status: 400 }
    )

  const updated = await db.pengajuan.update({
    where: { id },
    data: {
      status: 'DIAJUKAN',
      submittedAt: new Date(),
      riwayat: {
        create: {
          status: 'DIAJUKAN',
          keterangan: 'Pengajuan dikirim oleh asesi',
          oleh: guard.session.user.name,
        },
      },
    },
  })
  return NextResponse.json(updated)
}
