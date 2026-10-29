import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Helper bersama untuk fitur unggah dokumen pengajuan (SPK oleh pimpinan
 * fasyankes, RKK oleh ketua tim kredensial, sejak v1.3.2 juga Formulir
 * Kewenangan Klinis bertanda tangan oleh asesi). Dokumen disimpan sebagai BLOB
 * di tabel DokumenPengajuan — satu dokumen aktif per (pengajuan, jenis);
 * unggah ulang menimpa dokumen sebelumnya.
 *
 * Protokol unggah: BINARY LANGSUNG (bukan multipart/form-data).
 * Alasan: pada Next.js 16, POST multipart ke Route Handler salah terdeteksi
 * sebagai Server Action sehingga body menjadi tidak terbaca ("Body has
 * already been read" / "Server action not found"). Dengan binary murni:
 *   - pengajuanId dikirim via query ?pengajuanId=...
 *   - nama file via header X-File-Name (opsional)
 *   - tipe file via header Content-Type standar
 *   - isi file = body request
 */

export const DOKUMEN_MAKS_BAJT = 5 * 1024 * 1024 // 5 MB
export const DOKUMEN_TIPE_OK: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
}

export type JenisDokumen = 'SPK' | 'RKK' | 'FORM_KEWENANGAN'

export type HasilSimpan =
  | { ok: true; dokumen: { id: string; namaFile: string; ukuran: number; tipeFile: string } }
  | { ok: false; status: number; error: string }

/** Baca FormData sekali — dipakai route untuk memvalidasi kehadiran file. */
export async function prosesUnggahan(
  req: NextRequest,
  jenis: JenisDokumen,
  namaPengunggah: string
): Promise<HasilSimpan> {
  const pengajuanId = req.nextUrl.searchParams.get('pengajuanId')?.trim() ?? ''
  if (!pengajuanId) {
    return { ok: false, status: 400, error: 'ID pengajuan wajib disertakan (?pengajuanId=...).' }
  }

  const tipe = (req.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
  if (!DOKUMEN_TIPE_OK[tipe]) {
    return {
      ok: false,
      status: 400,
      error: 'Format file harus PDF, JPG, PNG, atau WebP (kirim dengan Content-Type yang tepat).',
    }
  }

  const panjang = Number(req.headers.get('content-length') ?? '0')
  if (panjang > DOKUMEN_MAKS_BAJT) {
    return {
      ok: false,
      status: 400,
      error: `Ukuran file maksimal 5 MB (file Anda ${(panjang / 1024 / 1024).toFixed(2)} MB).`,
    }
  }

  const buffer = Buffer.from(await req.arrayBuffer())
  if (buffer.length === 0) {
    return { ok: false, status: 400, error: 'File dokumen kosong.' }
  }
  if (buffer.length > DOKUMEN_MAKS_BAJT) {
    return {
      ok: false,
      status: 400,
      error: `Ukuran file maksimal 5 MB (file Anda ${(buffer.length / 1024 / 1024).toFixed(2)} MB).`,
    }
  }

  const pengajuan = await db.pengajuan.findUnique({
    where: { id: pengajuanId },
    select: { id: true, kode: true },
  })
  if (!pengajuan) {
    return { ok: false, status: 404, error: 'Pengajuan tidak ditemukan.' }
  }

  const namaHeader = req.headers.get('x-file-name')?.trim() ?? ''
  let namaAsli = ''
  try {
    namaAsli = namaHeader ? decodeURIComponent(namaHeader) : ''
  } catch {
    namaAsli = namaHeader
  }
  const ekstensi = DOKUMEN_TIPE_OK[tipe] === 'PDF' ? 'pdf' : DOKUMEN_TIPE_OK[tipe] === 'JPG' ? 'jpg' : DOKUMEN_TIPE_OK[tipe] === 'PNG' ? 'png' : 'webp'
  const namaFile = (namaAsli && namaAsli.length > 0 ? namaAsli : `dokumen-${jenis.toLowerCase()}-${Date.now()}.${ekstensi}`)
    .replace(/[\r\n]/g, '')
    .slice(0, 180)

  const dokumen = await db.dokumenPengajuan.upsert({
    where: { pengajuanId_jenis: { pengajuanId, jenis } },
    update: {
      namaFile,
      tipeFile: tipe,
      ukuran: buffer.length,
      data: buffer,
      diunggahOleh: namaPengunggah,
      updatedAt: new Date(),
    },
    create: {
      pengajuanId,
      jenis,
      namaFile,
      tipeFile: tipe,
      ukuran: buffer.length,
      data: buffer,
      diunggahOleh: namaPengunggah,
    },
    select: { id: true, namaFile: true, ukuran: true, tipeFile: true },
  })

  return { ok: true, dokumen }
}

/** Respons unduhan dokumen (inline di browser atau unduh berkas). */
export function responsDokumen(
  d: { namaFile: string; tipeFile: string; data: Uint8Array },
  unduh: boolean
): NextResponse {
  const ascii = d.namaFile.replace(/[^\x20-\x7E]/g, '_')
  const disposisi = `${unduh ? 'attachment' : 'inline'}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(d.namaFile)}`
  return new NextResponse(Buffer.from(d.data), {
    headers: {
      'Content-Type': d.tipeFile,
      'Content-Disposition': disposisi,
      'Content-Length': String(d.data.byteLength),
      'Cache-Control': 'private, no-store',
    },
  })
}
