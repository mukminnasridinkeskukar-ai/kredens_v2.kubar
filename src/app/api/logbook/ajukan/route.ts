import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireApiRole } from '@/lib/role-guard'

/** POST /api/logbook/ajukan — asesi mengajukan laporan logbook bulanan
 * kepada pimpinan fasyankes untuk diverifikasi.
 * Body: { logbookId } */
export async function POST(req: NextRequest) {
  const guard = await requireApiRole(['ASESI'])
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  const logbookId: string | undefined = body?.logbookId
  if (!logbookId) {
    return NextResponse.json({ error: 'logbookId wajib diisi' }, { status: 400 })
  }

  const logbook = await db.logbookBulanan.findFirst({
    where: { id: logbookId, pengajuan: { userId: guard.user.id } },
    include: { entri: true },
  })
  if (!logbook) {
    return NextResponse.json({ error: 'Laporan logbook tidak ditemukan' }, { status: 404 })
  }
  if (!['DRAFT', 'REVISI'].includes(logbook.status)) {
    return NextResponse.json(
      {
        error:
          logbook.status === 'DIAJUKAN'
            ? 'Laporan sudah diajukan dan menunggu verifikasi'
            : 'Laporan sudah terverifikasi',
      },
      { status: 400 }
    )
  }
  if (logbook.entri.length === 0) {
    return NextResponse.json(
      { error: 'Laporan masih kosong — isi cek list harian terlebih dahulu' },
      { status: 400 }
    )
  }

  const updated = await db.logbookBulanan.update({
    where: { id: logbook.id },
    data: {
      status: 'DIAJUKAN',
      submittedAt: new Date(),
      catatanPimpinan: null,
    },
  })

  return NextResponse.json({ ok: true, logbook: updated })
}
