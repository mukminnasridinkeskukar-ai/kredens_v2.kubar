import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireApiRole } from '@/lib/role-guard'
import { prosesUnggahan } from '@/lib/dokumen'

/**
 * POST /api/kadis/rkk/upload?pengajuanId=... — unggah pindaian dokumen
 * Rincian Kewenangan Klinis (RKK) oleh Kepala Dinas Kesehatan.
 *
 * Kepala Dinas menetapkan kewenangan klinis akhir (surat rekomendasi /
 * ketetapan); pindaian RKK bertanda tangan yang diunggah di sini langsung
 * dapat diunduh oleh asesi pemilik pengajuan pada menu SPK dan RKK.
 *
 * Protokol: BINARY LANGSUNG (bukan multipart) — lihat src/lib/dokumen.ts.
 *   - Content-Type  : mime file (pdf/jpg/png/webp)
 *   - X-File-Name   : nama asli file (encoded, opsional)
 *   - body          : isi file
 *
 * Aturan:
 *  - Hanya KEPALA_DINAS_KESEHATAN;
 *  - Pengajuan harus berstatus REKOMENDASI_TIM / KETETAPAN_KADIS /
 *    SURAT_PENUGASAN / SELESAI (konsisten dengan panel unggah halaman
 *    detail kadis);
 *  - Unggah ulang menimpa dokumen sebelumnya (satu dokumen aktif per jenis).
 */
export async function POST(req: NextRequest) {
  const guard = await requireApiRole(['KEPALA_DINAS_KESEHATAN'])
  if (!guard.ok) return guard.response

  const pengajuanId = req.nextUrl.searchParams.get('pengajuanId')?.trim() ?? ''
  if (!pengajuanId) {
    return NextResponse.json({ error: 'ID pengajuan wajib disertakan (?pengajuanId=...).' }, { status: 400 })
  }

  const p = await db.pengajuan.findUnique({
    where: { id: pengajuanId },
    select: { status: true },
  })
  if (!p) {
    return NextResponse.json({ error: 'Pengajuan tidak ditemukan.' }, { status: 404 })
  }
  if (!['REKOMENDASI_TIM', 'KETETAPAN_KADIS', 'SURAT_PENUGASAN', 'SELESAI'].includes(p.status)) {
    return NextResponse.json(
      { error: `Unggah RKK belum diperbolehkan pada status ${p.status}. Tunggu rekomendasi tim kredensial terbit.` },
      { status: 400 }
    )
  }

  const hasil = await prosesUnggahan(req, 'RKK', guard.user.name ?? 'Kepala Dinas Kesehatan')
  if (!hasil.ok) {
    return NextResponse.json({ error: hasil.error }, { status: hasil.status })
  }
  return NextResponse.json({ ok: true, dokumen: hasil.dokumen }, { status: 201 })
}
