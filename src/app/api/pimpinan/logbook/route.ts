import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireApiRole } from '@/lib/role-guard'
import { ambilWewenangPimpinan, pimpinanBolehAkses } from '@/lib/wewenang'

/** POST /api/pimpinan/logbook — pimpinan fasyankes memverifikasi laporan
 * logbook bulanan asesi: setujui (DIVERIFIKASI) atau minta perbaikan (REVISI).
 * Body: { logbookId, aksi: 'DIVERIFIKASI' | 'REVISI', catatan? }
 *
 * Pimpinan hanya berhak memverifikasi laporan asesi yang tempat kerjanya
 * sama dengan tempat kerja pimpinan (TempatKerja); untuk data lama yang
 * belum ter-link, dipakai pencocokan instansi vs nama fasyankes pengajuan. */
export async function POST(req: NextRequest) {
  const guard = await requireApiRole(['PIMPINAN_FASYANKES'])
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  const logbookId: string | undefined = body?.logbookId
  const aksi: string | undefined = body?.aksi
  const catatan: string | undefined = body?.catatan

  if (!logbookId || !['DIVERIFIKASI', 'REVISI'].includes(aksi ?? '')) {
    return NextResponse.json(
      { error: 'logbookId dan aksi (DIVERIFIKASI/REVISI) wajib diisi' },
      { status: 400 }
    )
  }
  if (aksi === 'REVISI' && !catatan?.trim()) {
    return NextResponse.json(
      { error: 'Catatan wajib diisi saat meminta perbaikan laporan' },
      { status: 400 }
    )
  }

  const logbook = await db.logbookBulanan.findFirst({
    where: { id: logbookId },
    include: {
      pengajuan: {
        select: {
          kode: true,
          fasyankes: true,
          user: {
            select: { nama: true, asesiProfile: { select: { tempatKerjaId: true } } },
          },
        },
      },
      entri: true,
    },
  })
  if (!logbook) {
    return NextResponse.json({ error: 'Laporan logbook tidak ditemukan' }, { status: 404 })
  }

  // Kewenangan pimpinan: tempat kerja pimpinan = tempat kerja asesi
  // (utama via TempatKerja, fallback pencocokan nama untuk data lama).
  const pimpinan = await ambilWewenangPimpinan(guard.user.id)
  const cek = pimpinanBolehAkses(
    pimpinan,
    logbook.pengajuan.user.asesiProfile?.tempatKerjaId ?? null,
    logbook.pengajuan.fasyankes
  )
  if (!cek.ok) {
    return NextResponse.json({ error: cek.alasan ?? 'Bukan wewenang Anda' }, { status: 403 })
  }

  if (logbook.status !== 'DIAJUKAN') {
    return NextResponse.json(
      { error: 'Hanya laporan berstatus Menunggu Verifikasi yang dapat diproses' },
      { status: 400 }
    )
  }
  if (logbook.entri.length === 0) {
    return NextResponse.json(
      { error: 'Laporan tidak memiliki isian apa pun' },
      { status: 400 }
    )
  }

  const updated = await db.logbookBulanan.update({
    where: { id: logbook.id },
    data:
      aksi === 'DIVERIFIKASI'
        ? {
            status: 'DIVERIFIKASI',
            diverifikasiOleh: guard.user.name,
            diverifikasiPada: new Date(),
            catatanPimpinan: catatan?.trim() || null,
          }
        : {
            status: 'REVISI',
            catatanPimpinan: catatan!.trim(),
            diverifikasiOleh: null,
            diverifikasiPada: null,
          },
  })

  return NextResponse.json({ ok: true, logbook: updated })
}
