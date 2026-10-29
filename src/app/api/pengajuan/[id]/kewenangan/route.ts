import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'

type Ctx = { params: Promise<{ id: string }> }

// GET /api/pengajuan/[id]/kewenangan
export async function GET(_req: NextRequest, ctx: Ctx) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response
  const { id } = await ctx.params
  const p = await db.pengajuan.findUnique({ where: { id } })
  if (!p || p.userId !== guard.session.user.id)
    return NextResponse.json({ error: 'Pengajuan tidak ditemukan' }, { status: 404 })
  const list = await db.kewenanganKlinis.findMany({
    where: { pengajuanId: id },
    orderBy: { urutan: 'asc' },
  })
  return NextResponse.json(list)
}

// POST /api/pengajuan/[id]/kewenangan — tambah item (draft saja)
export async function POST(req: NextRequest, ctx: Ctx) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response
  const { id } = await ctx.params
  const p = await db.pengajuan.findUnique({ where: { id } })
  if (!p || p.userId !== guard.session.user.id)
    return NextResponse.json({ error: 'Pengajuan tidak ditemukan' }, { status: 404 })
  if (p.status !== 'DRAFT')
    return NextResponse.json({ error: 'Pengajuan sudah diajukan dan tidak dapat diubah' }, { status: 400 })

  const body = await req.json()

  // Mode batch: { items: [{ kodeRef, namaKewenangan, kodeDiminta? }] }
  // dipakai dialog "Ambil dari Template" untuk menambah banyak item sekaligus.
  if (Array.isArray(body?.items)) {
    const items: { kodeRef?: string | null; namaKewenangan?: string }[] = body.items
    const bersih = items
      .map((it) => ({
        kodeRef: it.kodeRef ?? null,
        nama: String(it.namaKewenangan ?? '').trim(),
      }))
      .filter((it) => it.nama.length > 0)
    if (bersih.length === 0)
      return NextResponse.json({ error: 'Daftar kewenangan kosong' }, { status: 400 })

    // Lewati kode yang sudah pernah diusulkan pada pengajuan ini (anti duplikat)
    const ada = await db.kewenanganKlinis.findMany({
      where: { pengajuanId: id, kodeRef: { not: null } },
      select: { kodeRef: true },
    })
    const kodeAda = new Set(ada.map((a) => a.kodeRef))
    const baru = bersih.filter((it) => !it.kodeRef || !kodeAda.has(it.kodeRef))
    if (baru.length === 0)
      return NextResponse.json(
        { error: 'Semua item yang dipilih sudah ada dalam daftar usulan' },
        { status: 400 }
      )

    let urutan = await db.kewenanganKlinis.count({ where: { pengajuanId: id } })
    await db.kewenanganKlinis.createMany({
      data: baru.map((it) => ({
        pengajuanId: id,
        urutan: ++urutan,
        kodeRef: it.kodeRef,
        namaKewenangan: it.nama,
        kodeDiminta: String(body.kodeDiminta ?? '1'),
      })),
    })
    const list = await db.kewenanganKlinis.findMany({
      where: { pengajuanId: id },
      orderBy: { urutan: 'asc' },
    })
    return NextResponse.json(list)
  }

  if (!body.namaKewenangan?.trim())
    return NextResponse.json({ error: 'Nama kewenangan wajib diisi' }, { status: 400 })
  const count = await db.kewenanganKlinis.count({ where: { pengajuanId: id } })
  const item = await db.kewenanganKlinis.create({
    data: {
      pengajuanId: id,
      urutan: count + 1,
      kodeRef: body.kodeRef ?? null,
      namaKewenangan: body.namaKewenangan.trim(),
      kodeDiminta: String(body.kodeDiminta ?? '1'),
    },
  })
  return NextResponse.json(item)
}
