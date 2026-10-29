import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireApiRole } from '@/lib/role-guard'
import { prosesUnggahan } from '@/lib/dokumen'
import { ambilWewenangPimpinan, pimpinanBolehAkses } from '@/lib/wewenang'

/**
 * POST /api/pimpinan/spk/upload?pengajuanId=... — pimpinan fasyankes
 * mengunggah pindaian Surat Penugasan Klinis (SPK) bertanda tangan.
 *
 * Protokol: BINARY LANGSUNG (bukan multipart) — lihat src/lib/dokumen.ts.
 * Wewenang: pimpinan hanya untuk asesi fasyankesnya sendiri (TempatKerja
 * atau pencocokan instansi-fasyankes untuk data lama).
 * Unggah ulang menimpa pindaian sebelumnya (satu dokumen aktif per jenis).
 */
export async function POST(req: NextRequest) {
  const guard = await requireApiRole(['PIMPINAN_FASYANKES'])
  if (!guard.ok) return guard.response

  // Cek wewenang fasyankes SEBELUM menyimpan (prosesUnggahan memvalidasi file)
  const pengajuanId = req.nextUrl.searchParams.get('pengajuanId')?.trim() ?? ''
  if (pengajuanId) {
    const p = await db.pengajuan.findUnique({
      where: { id: pengajuanId },
      select: {
        fasyankes: true,
        user: { select: { asesiProfile: { select: { tempatKerjaId: true } } } },
      },
    })
    if (p) {
      const pimpinan = await ambilWewenangPimpinan(guard.user.id)
      const cek = pimpinanBolehAkses(pimpinan, p.user.asesiProfile?.tempatKerjaId ?? null, p.fasyankes)
      if (!cek.ok) {
        return NextResponse.json({ error: cek.alasan ?? 'Bukan wewenang Anda.' }, { status: 403 })
      }
    }
  }

  const hasil = await prosesUnggahan(req, 'SPK', guard.user.name || 'Pimpinan Fasyankes')
  if (!hasil.ok) {
    return NextResponse.json({ error: hasil.error }, { status: hasil.status })
  }
  return NextResponse.json({
    ok: true,
    dokumen: hasil.dokumen,
    pesan: `Dokumen SPK berhasil diunggah (${hasil.dokumen.namaFile}) — asesi dapat langsung mengunduhnya dari menu SPK dan RKK.`,
  })
}
