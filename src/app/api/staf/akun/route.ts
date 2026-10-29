import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireApiRole } from '@/lib/role-guard'

/**
 * Manajemen akun untuk Operator Kredensial.
 * GET    /api/staf/akun — daftar seluruh akun + jumlah menunggu verifikasi
 * PUT    { id }         — aktifkan akun yang menunggu verifikasi
 * DELETE ?id=           — hapus pendaftaran yang ditolak (hanya akun
 *                         hasil pendaftaran mandiri & belum punya pengajuan)
 */

const PERAN_PENDAFTARAN_MANDIRI = ['ASESI', 'ASESOR', 'PIMPINAN_FASYANKES']

export async function GET() {
  const guard = await requireApiRole(['OPERATOR_KREDENSIAL'])
  if (!guard.ok) return guard.response

  const daftar = await db.user.findMany({
    orderBy: [{ isActive: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      nama: true,
      email: true,
      role: true,
      nip: true,
      jabatan: true,
      instansi: true,
      isActive: true,
      createdAt: true,
    },
  })

  const menunggu = daftar.filter((u) => !u.isActive).length
  return NextResponse.json({ daftar, menunggu })
}

export async function PUT(req: NextRequest) {
  const guard = await requireApiRole(['OPERATOR_KREDENSIAL'])
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  const id = String(body?.id ?? '')
  if (!id) return NextResponse.json({ error: 'ID akun wajib disertakan.' }, { status: 400 })

  const target = await db.user.findUnique({ where: { id } })
  if (!target) return NextResponse.json({ error: 'Akun tidak ditemukan.' }, { status: 404 })
  if (target.isActive) {
    return NextResponse.json({ error: 'Akun ini sudah aktif.' }, { status: 400 })
  }

  await db.user.update({ where: { id }, data: { isActive: true } })
  return NextResponse.json({
    ok: true,
    pesan: `Akun ${target.nama} telah diaktifkan dan dapat dipakai untuk masuk.`,
  })
}

export async function DELETE(req: NextRequest) {
  const guard = await requireApiRole(['OPERATOR_KREDENSIAL'])
  if (!guard.ok) return guard.response

  const id = req.nextUrl.searchParams.get('id') ?? ''
  if (!id) return NextResponse.json({ error: 'ID akun wajib disertakan.' }, { status: 400 })
  if (id === guard.user.id) {
    return NextResponse.json({ error: 'Anda tidak dapat menghapus akun sendiri.' }, { status: 400 })
  }

  const target = await db.user.findUnique({
    where: { id },
    include: { _count: { select: { pengajuan: true } } },
  })
  if (!target) return NextResponse.json({ error: 'Akun tidak ditemukan.' }, { status: 404 })

  if (!PERAN_PENDAFTARAN_MANDIRI.includes(target.role)) {
    return NextResponse.json(
      { error: 'Hanya akun hasil pendaftaran mandiri (Asesi, Asesor, Pimpinan Fasyankes) yang dapat dihapus.' },
      { status: 400 },
    )
  }
  if (target._count.pengajuan > 0) {
    return NextResponse.json(
      { error: 'Akun memiliki pengajuan kredensial sehingga tidak dapat dihapus. Nonaktifkan penanganannya melalui proses kredensial yang berjalan.' },
      { status: 400 },
    )
  }

  await db.user.delete({ where: { id } })
  return NextResponse.json({ ok: true, pesan: `Pendaftaran ${target.nama} telah dihapus.` })
}
