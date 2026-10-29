import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'

type Ctx = { params: Promise<{ id: string }> }

async function ownedItem(userId: string, id: string) {
  const item = await db.pelatihanKompetensi.findUnique({ where: { id } })
  if (!item) return null
  const profile = await db.asesiProfile.findUnique({ where: { userId } })
  if (!profile || item.asesiId !== profile.id) return null
  return item
}

// PUT /api/biodata/pelatihan/[id]
export async function PUT(req: NextRequest, ctx: Ctx) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response
  const { id } = await ctx.params
  const item = await ownedItem(guard.session.user.id, id)
  if (!item) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })

  const body = await req.json()
  const updated = await db.pelatihanKompetensi.update({
    where: { id },
    data: {
      namaKegiatan: body.namaKegiatan ?? item.namaKegiatan,
      penyelenggara: body.penyelenggara ?? null,
      tahun: body.tahun ?? null,
      jumlahJp: body.jumlahJp ?? null,
      nomorSertifikat: body.nomorSertifikat ?? null,
      urutan: body.urutan ?? item.urutan,
    },
  })
  return NextResponse.json(updated)
}

// DELETE /api/biodata/pelatihan/[id]
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response
  const { id } = await ctx.params
  const item = await ownedItem(guard.session.user.id, id)
  if (!item) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })
  await db.pelatihanKompetensi.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
