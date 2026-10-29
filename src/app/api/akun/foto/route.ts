import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'

/**
 * v2.3 — Foto profil akun.
 *
 * Penyimpanan: BLOB pada kolom User.foto (pola sama dengan DokumenPengajuan —
 * filesystem Vercel bersifat sementara, database persisten). Gambar dikecilkan
 * di sisi peramban menjadi maksimal 512px JPEG sebelum dikirim sehingga
 * ukurannya umumnya di bawah 150 KB.
 *
 * Protokol unggah: BINARY LANGSUNG (bukan multipart/form-data) — pola yang
 * sama dengan unggah dokumen SPK/RKK. Pada Next.js 16, POST multipart ke
 * Route Handler salah terdeteksi sebagai Server Action sehingga body tidak
 * terbaca. Dengan binary murni:
 *   - tipe gambar via header Content-Type standar (image/jpeg|png|webp)
 *   - isi gambar = body request
 */

const FOTO_MAKS_BAJT = 2 * 1024 * 1024 // 2 MB (setelah resize peramban biasanya < 150 KB)
const TIPE_OK = new Set(['image/jpeg', 'image/png', 'image/webp'])

// GET /api/akun/foto — kirim foto profil pengguna yang sedang login.
// URL dipakai dengan penanda versi (?v=waktu-unggah) sehingga cache peramban
// aman: setiap unggah baru menghasilkan URL baru.
export async function GET() {
  const guard = await requireSession()
  if (!guard.ok) return guard.response

  const user = await db.user.findUnique({
    where: { id: guard.session.user.id },
    select: { foto: true, fotoTipe: true },
  })
  if (!user?.foto || !user.fotoTipe) {
    return NextResponse.json({ error: 'Foto profil belum diunggah.' }, { status: 404 })
  }

  const data = Buffer.from(user.foto)
  return new NextResponse(data, {
    headers: {
      'Content-Type': user.fotoTipe,
      'Content-Length': String(data.byteLength),
      'Cache-Control': 'private, max-age=300',
    },
  })
}

// POST /api/akun/foto — unggah / timpa foto profil (binary langsung).
export async function POST(req: NextRequest) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response

  const tipe = (req.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
  if (!TIPE_OK.has(tipe)) {
    return NextResponse.json(
      { error: 'Format foto harus JPG, PNG, atau WebP (kirim dengan Content-Type yang tepat).' },
      { status: 400 },
    )
  }

  const panjang = Number(req.headers.get('content-length') ?? '0')
  if (panjang > FOTO_MAKS_BAJT) {
    return NextResponse.json(
      { error: `Ukuran foto maksimal 2 MB (file Anda ${(panjang / 1024 / 1024).toFixed(2)} MB).` },
      { status: 400 },
    )
  }

  const buffer = Buffer.from(await req.arrayBuffer())
  if (buffer.length === 0) {
    return NextResponse.json({ error: 'File foto kosong.' }, { status: 400 })
  }
  if (buffer.length > FOTO_MAKS_BAJT) {
    return NextResponse.json(
      { error: `Ukuran foto maksimal 2 MB (file Anda ${(buffer.length / 1024 / 1024).toFixed(2)} MB).` },
      { status: 400 },
    )
  }

  const fotoPada = new Date()
  await db.user.update({
    where: { id: guard.session.user.id },
    data: { foto: buffer, fotoTipe: tipe, fotoPada },
    select: { id: true },
  })

  return NextResponse.json({
    ok: true,
    fotoTipe: tipe,
    ukuran: buffer.length,
    fotoPada: fotoPada.toISOString(),
  })
}

// DELETE /api/akun/foto — hapus foto profil.
export async function DELETE() {
  const guard = await requireSession()
  if (!guard.ok) return guard.response

  await db.user.update({
    where: { id: guard.session.user.id },
    data: { foto: null, fotoTipe: null, fotoPada: null },
    select: { id: true },
  })

  return NextResponse.json({ ok: true })
}
