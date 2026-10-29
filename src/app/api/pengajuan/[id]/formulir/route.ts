import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'

type Ctx = { params: Promise<{ id: string }> }

async function owned(userId: string, id: string) {
  return db.pengajuan.findUnique({ where: { id } })
}

// GET /api/pengajuan/[id]/formulir
export async function GET(_req: NextRequest, ctx: Ctx) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response
  const { id } = await ctx.params
  const p = await owned(guard.session.user.id, id)
  if (!p || p.userId !== guard.session.user.id)
    return NextResponse.json({ error: 'Pengajuan tidak ditemukan' }, { status: 404 })
  const formulir = await db.formulirKredensial.upsert({
    where: { pengajuanId: id },
    update: {},
    create: { pengajuanId: id },
  })
  return NextResponse.json(formulir)
}

// PUT /api/pengajuan/[id]/formulir
export async function PUT(req: NextRequest, ctx: Ctx) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response
  const { id } = await ctx.params
  const p = await owned(guard.session.user.id, id)
  if (!p || p.userId !== guard.session.user.id)
    return NextResponse.json({ error: 'Pengajuan tidak ditemukan' }, { status: 404 })
  if (p.status !== 'DRAFT')
    return NextResponse.json(
      { error: 'Pengajuan sudah diajukan dan tidak dapat diubah' },
      { status: 400 }
    )

  const body = await req.json()
  const formulir = await db.formulirKredensial.upsert({
    where: { pengajuanId: id },
    update: {
      pernyataan: Boolean(body.pernyataan),
      strNomor: body.strNomor ?? null,
      strBerlaku: body.strBerlaku ?? null,
      sipNomor: body.sipNomor ?? null,
      sipBerlaku: body.sipBerlaku ?? null,
      suratPermohonanNomor: body.suratPermohonanNomor ?? null,
      suratPermohonanTanggal: body.suratPermohonanTanggal ?? null,
      ptNomor: body.ptNomor ?? null,
      ptTanggal: body.ptTanggal ?? null,
      kolegiumNomor: body.kolegiumNomor ?? null,
      kolegiumTanggal: body.kolegiumTanggal ?? null,
      ujiKompetensiNomor: body.ujiKompetensiNomor ?? null,
      ujiKompetensiTanggal: body.ujiKompetensiTanggal ?? null,
    },
    create: { pengajuanId: id, ...body },
  })
  return NextResponse.json(formulir)
}
