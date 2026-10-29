import { NextRequest, NextResponse } from 'next/server'
import { requireApiRole } from '@/lib/role-guard'
import { prosesUnggahan } from '@/lib/dokumen'

/**
 * POST /api/ketua-tim/rkk/upload?pengajuanId=... — ketua tim kredensial
 * mengunggah pindaian Rekomendasi Kewenangan Klinis (RKK) final.
 *
 * Protokol: BINARY LANGSUNG (bukan multipart) — lihat src/lib/dokumen.ts.
 * Unggah ulang menimpa pindaian sebelumnya (satu dokumen aktif per jenis).
 */
export async function POST(req: NextRequest) {
  const guard = await requireApiRole(['KETUA_TIM_KREDENSIAL'])
  if (!guard.ok) return guard.response

  const hasil = await prosesUnggahan(req, 'RKK', guard.user.name || 'Ketua Tim Kredensial')
  if (!hasil.ok) {
    return NextResponse.json({ error: hasil.error }, { status: hasil.status })
  }
  return NextResponse.json({
    ok: true,
    dokumen: hasil.dokumen,
    pesan: `Dokumen RKK berhasil diunggah (${hasil.dokumen.namaFile}) — asesi dapat langsung mengunduhnya dari menu SPK dan RKK.`,
  })
}
