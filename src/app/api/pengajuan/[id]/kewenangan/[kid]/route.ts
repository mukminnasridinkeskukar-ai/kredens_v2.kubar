import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'

type Ctx = { params: Promise<{ id: string; kid: string }> }

async function ownedItem(userId: string, pengajuanId: string, kid: string) {
  const p = await db.pengajuan.findUnique({ where: { id: pengajuanId } })
  if (!p || p.userId !== userId) return null
  const item = await db.kewenanganKlinis.findUnique({ where: { id: kid } })
  if (!item || item.pengajuanId !== pengajuanId) return null
  return { pengajuan: p, item }
}

// PUT /api/pengajuan/[id]/kewenangan/[kid]
export async function PUT(req: NextRequest, ctx: Ctx) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response
  const { id, kid } = await ctx.params
  const owned = await ownedItem(guard.session.user.id, id, kid)
  if (!owned) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })
  if (owned.pengajuan.status !== 'DRAFT')
    return NextResponse.json({ error: 'Pengajuan sudah diajukan dan tidak dapat diubah' }, { status: 400 })

  const body = await req.json()
  const updated = await db.kewenanganKlinis.update({
    where: { id: kid },
    data: {
      kodeRef: body.kodeRef ?? owned.item.kodeRef,
      namaKewenangan: body.namaKewenangan ?? owned.item.namaKewenangan,
      kodeDiminta: String(body.kodeDiminta ?? owned.item.kodeDiminta),
    },
  })
  return NextResponse.json(updated)
}

// DELETE /api/pengajuan/[id]/kewenangan/[kid]
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response
  const { id, kid } = await ctx.params
  const owned = await ownedItem(guard.session.user.id, id, kid)
  if (!owned) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })
  if (owned.pengajuan.status !== 'DRAFT')
    return NextResponse.json({ error: 'Pengajuan sudah diajukan dan tidak dapat diubah' }, { status: 400 })
  await db.kewenanganKlinis.delete({ where: { id: kid } })
  return NextResponse.json({ ok: true })
}
