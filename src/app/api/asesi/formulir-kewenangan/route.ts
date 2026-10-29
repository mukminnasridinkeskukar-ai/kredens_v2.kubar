import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireApiRole } from '@/lib/role-guard'
import { prosesUnggahan } from '@/lib/dokumen'

/**
 * Formulir Kewenangan Klinis bertanda tangan (v1.3.2) — milik asesi.
 *
 * GET  /api/asesi/formulir-kewenangan?pengajuanId=...
 *      → status dokumen terunggah pada pengajuan tsb (atau { ada: false }).
 * POST /api/asesi/formulir-kewenangan?pengajuanId=...
 *      → unggah pindaian formulir yang sudah diisi & ditandatangani
 *        (PDF/JPG/PNG/WebP, maks 5 MB). Protokol BINARY LANGSUNG —
 *        lihat src/lib/dokumen.ts. Unggah ulang menimpa sebelumnya.
 *
 * Hanya ASESI pemilik pengajuan yang berhak atas keduanya.
 * Dokumen hasil unggahan dapat dilihat/unduh lewat /api/dokumen/[id]
 * (asesi pemilik + staf penilai + pimpinan fasyankes + superadmin).
 */

async function ambilPengajuanMilik(pengajuanId: string, userId: string) {
  if (!pengajuanId) return null
  return db.pengajuan.findFirst({
    where: { id: pengajuanId, userId },
    select: { id: true, kode: true },
  })
}

export async function GET(req: NextRequest) {
  const guard = await requireApiRole(['ASESI'])
  if (!guard.ok) return guard.response

  const pengajuanId = req.nextUrl.searchParams.get('pengajuanId')?.trim() ?? ''
  const p = await ambilPengajuanMilik(pengajuanId, guard.user.id)
  if (!p) {
    return NextResponse.json({ error: 'Pengajuan tidak ditemukan.' }, { status: 404 })
  }

  const d = await db.dokumenPengajuan.findUnique({
    where: { pengajuanId_jenis: { pengajuanId: p.id, jenis: 'FORM_KEWENANGAN' } },
    select: { id: true, namaFile: true, ukuran: true, tipeFile: true, updatedAt: true },
  })
  if (!d) return NextResponse.json({ ada: false })
  return NextResponse.json({ ada: true, dokumen: d })
}

export async function POST(req: NextRequest) {
  const guard = await requireApiRole(['ASESI'])
  if (!guard.ok) return guard.response

  const pengajuanId = req.nextUrl.searchParams.get('pengajuanId')?.trim() ?? ''
  const p = await ambilPengajuanMilik(pengajuanId, guard.user.id)
  if (!p) {
    return NextResponse.json({ error: 'Pengajuan tidak ditemukan.' }, { status: 404 })
  }

  const hasil = await prosesUnggahan(req, 'FORM_KEWENANGAN', guard.user.name || 'Asesi')
  if (!hasil.ok) {
    return NextResponse.json({ error: hasil.error }, { status: hasil.status })
  }
  console.log(
    `[audit] ${new Date().toISOString()} — asesi ${guard.user.email} mengunggah formulir kewenangan klinis untuk ${p.kode}`,
  )
  return NextResponse.json({
    ok: true,
    dokumen: hasil.dokumen,
    pesan: `Formulir Kewenangan Klinis berhasil diunggah (${hasil.dokumen.namaFile}).`,
  })
}
