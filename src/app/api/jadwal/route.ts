import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'
import { requireApiRole } from '@/lib/role-guard'

// GET /api/jadwal — jadwal kredensial milik asesi
export async function GET() {
  const guard = await requireSession()
  if (!guard.ok) return guard.response

  const pengajuan = await db.pengajuan.findFirst({
    where: { userId: guard.session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      jadwal: { orderBy: { tanggal: 'asc' } },
    },
  })

  return NextResponse.json({
    jadwal: pengajuan?.jadwal ?? [],
    pengajuanKode: pengajuan?.kode ?? null,
    pengajuanId: pengajuan?.id ?? null,
  })
}

const TAHAP_VALID = ['TELAAH_BERKAS', 'ASESMEN', 'PENILAIAN_LAPANGAN', 'REKOMENDASI', 'KETETAPAN']
const STATUS_JADWAL_VALID = ['TERJADWAL', 'SELESAI', 'DIBATALKAN']

// POST /api/jadwal — operator membuat jadwal baru
export async function POST(req: NextRequest) {
  const guard = await requireApiRole(['OPERATOR_KREDENSIAL'])
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  const tanggal: string | undefined = body?.tanggal
  const tahap: string | undefined = body?.tahap

  if (!tanggal || !tahap || !TAHAP_VALID.includes(tahap)) {
    return NextResponse.json(
      { error: 'Tanggal dan tahap wajib diisi (tahap harus valid)' },
      { status: 400 }
    )
  }
  if (body?.status && !STATUS_JADWAL_VALID.includes(body.status)) {
    return NextResponse.json({ error: 'Status jadwal tidak valid' }, { status: 400 })
  }
  if (body?.pengajuanId) {
    const ada = await db.pengajuan.findUnique({ where: { id: body.pengajuanId } })
    if (!ada) {
      return NextResponse.json({ error: 'Pengajuan tidak ditemukan' }, { status: 404 })
    }
  }

  const jadwal = await db.jadwalKredensial.create({
    data: {
      pengajuanId: body.pengajuanId || null,
      tanggal,
      waktu: body.waktu?.trim() || null,
      tempat: body.tempat?.trim() || null,
      tahap,
      keterangan: body.keterangan?.trim() || null,
      status: body.status || 'TERJADWAL',
    },
  })
  return NextResponse.json(jadwal)
}

// PUT /api/jadwal — operator memperbarui jadwal
export async function PUT(req: NextRequest) {
  const guard = await requireApiRole(['OPERATOR_KREDENSIAL'])
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  const id: string | undefined = body?.id
  if (!id) return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 })

  const lama = await db.jadwalKredensial.findUnique({ where: { id } })
  if (!lama) return NextResponse.json({ error: 'Jadwal tidak ditemukan' }, { status: 404 })
  if (body?.tahap && !TAHAP_VALID.includes(body.tahap)) {
    return NextResponse.json({ error: 'Tahap tidak valid' }, { status: 400 })
  }
  if (body?.status && !STATUS_JADWAL_VALID.includes(body.status)) {
    return NextResponse.json({ error: 'Status jadwal tidak valid' }, { status: 400 })
  }

  const jadwal = await db.jadwalKredensial.update({
    where: { id },
    data: {
      tanggal: body.tanggal?.trim() || lama.tanggal,
      waktu: body.waktu !== undefined ? body.waktu?.trim() || null : lama.waktu,
      tempat: body.tempat !== undefined ? body.tempat?.trim() || null : lama.tempat,
      tahap: body.tahap || lama.tahap,
      keterangan: body.keterangan !== undefined ? body.keterangan?.trim() || null : lama.keterangan,
      status: body.status || lama.status,
      pengajuanId: body.pengajuanId !== undefined ? body.pengajuanId || null : lama.pengajuanId,
    },
  })
  return NextResponse.json(jadwal)
}

// DELETE /api/jadwal — operator menghapus jadwal
export async function DELETE(req: NextRequest) {
  const guard = await requireApiRole(['OPERATOR_KREDENSIAL'])
  if (!guard.ok) return guard.response

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 })

  const ada = await db.jadwalKredensial.findUnique({ where: { id } })
  if (!ada) return NextResponse.json({ error: 'Jadwal tidak ditemukan' }, { status: 404 })

  await db.jadwalKredensial.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
