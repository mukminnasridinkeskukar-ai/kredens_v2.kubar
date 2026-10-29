import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, enkripsiSandi } from '@/lib/password'

/**
 * POST /api/daftar — pendaftaran akun mandiri (publik).
 * Peran yang dapat didaftarkan: ASESI, ASESOR, PIMPINAN_FASYANKES.
 * Akun baru berstatus NONAKTIF sampai diverifikasi Operator Kredensial.
 */

const PERAN_DIIZINKAN = ['ASESI', 'ASESOR', 'PIMPINAN_FASYANKES'] as const

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })

  const nama = String(body.nama ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const peran = String(body.peran ?? '').trim()
  const instansi = String(body.instansi ?? '').trim()
  const jabatan = String(body.jabatan ?? '').trim()
  const kataSandi = String(body.kataSandi ?? '')
  const konfirmasi = String(body.konfirmasi ?? '')
  const tempatKerjaId = String(body.tempatKerjaId ?? '').trim()

  // Pimpinan fasyankes WAJIB memilih tempat kerja (fasyankes) dari daftar
  // supaya akunnya terhubung tepat dengan asesi fasyankes tersebut.
  let tempatKerja: { id: string; nama: string } | null = null
  if (peran === 'PIMPINAN_FASYANKES') {
    if (!tempatKerjaId) {
      return NextResponse.json(
        { error: 'Pimpinan Fasyankes wajib memilih fasyankes/tempat kerja dari daftar.' },
        { status: 400 }
      )
    }
    const tk = await db.tempatKerja.findUnique({ where: { id: tempatKerjaId } })
    if (!tk || !tk.aktif) {
      return NextResponse.json(
        { error: 'Fasyankes/tempat kerja tidak tersedia. Pilih dari daftar yang muncul.' },
        { status: 400 }
      )
    }
    tempatKerja = { id: tk.id, nama: tk.nama }
  }

  if (!nama || nama.length < 3) {
    return NextResponse.json({ error: 'Nama lengkap wajib diisi (minimal 3 karakter).' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Format email tidak valid.' }, { status: 400 })
  }
  if (!PERAN_DIIZINKAN.includes(peran as (typeof PERAN_DIIZINKAN)[number])) {
    return NextResponse.json({ error: 'Peran tidak tersedia. Pilih Asesi, Asesor, atau Pimpinan Fasyankes.' }, { status: 400 })
  }
  if (kataSandi.length < 8) {
    return NextResponse.json({ error: 'Kata sandi minimal 8 karakter.' }, { status: 400 })
  }
  if (kataSandi !== konfirmasi) {
    return NextResponse.json({ error: 'Konfirmasi kata sandi tidak sama.' }, { status: 400 })
  }

  const sudahAda = await db.user.findUnique({ where: { email } })
  if (sudahAda) {
    return NextResponse.json(
      { error: 'Email sudah terdaftar. Gunakan email lain atau masuk dengan akun tersebut.' },
      { status: 409 },
    )
  }

  await db.user.create({
    data: {
      email,
      passwordHash: hashPassword(kataSandi),
      sandiTersimpan: enkripsiSandi(kataSandi),
      nama,
      role: peran,
      instansi: tempatKerja?.nama ?? (instansi || null),
      jabatan: jabatan || null,
      tempatKerjaId: tempatKerja?.id ?? null,
      isActive: false, // menunggu verifikasi Operator Kredensial
    },
  })

  return NextResponse.json(
    {
      ok: true,
      pesan:
        'Pendaftaran berhasil. Akun Anda akan aktif setelah diverifikasi Operator Kredensial.',
    },
    { status: 201 },
  )
}
