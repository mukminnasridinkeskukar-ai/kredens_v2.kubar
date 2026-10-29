import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'

// GET /api/biodata — profil asesi lengkap (data pribadi + tabel-tabel)
export async function GET() {
  const guard = await requireSession()
  if (!guard.ok) return guard.response

  let profile = await db.asesiProfile.findUnique({
    where: { userId: guard.session.user.id },
    include: {
      pendidikan: { orderBy: { urutan: 'asc' } },
      pengalaman: { orderBy: { urutan: 'asc' } },
      pelatihan: { orderBy: { urutan: 'asc' } },
      tempatKerja: { select: { id: true, nama: true } },
    },
  })

  if (!profile) {
    profile = await db.asesiProfile.create({
      data: {
        userId: guard.session.user.id,
        email: guard.session.user.email,
      },
      include: {
        pendidikan: true,
        pengalaman: true,
        pelatihan: true,
        tempatKerja: { select: { id: true, nama: true } },
      },
    })
  }

  return NextResponse.json(profile)
}

// PUT /api/biodata — simpan data pribadi
// Tempat kerja kini berupa opsi dari master data TempatKerja (dikelola
// Superadmin): klien mengirim tempatKerjaId; nama disimpan sebagai teks
// snapshot pada tempatBekerja. Bila klien hanya mengirim teks (data lama),
// perilaku lama tetap didukung.
export async function PUT(req: NextRequest) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response

  const body = await req.json()

  // Resolusi tempat kerja: ID (utama) atau teks bebas (fallback lama)
  let tempatBekerja: string | null = body.tempatBekerja ?? null
  let tempatKerjaId: string | null = null
  if (body.tempatKerjaId) {
    const tk = await db.tempatKerja.findUnique({
      where: { id: String(body.tempatKerjaId) },
    })
    if (!tk) {
      return NextResponse.json(
        { error: 'Tempat kerja tidak ditemukan pada daftar. Muat ulang halaman lalu pilih kembali.' },
        { status: 400 }
      )
    }
    if (!tk.aktif) {
      return NextResponse.json(
        { error: `Tempat kerja "${tk.nama}" sedang nonaktif. Hubungi Superadmin.` },
        { status: 400 }
      )
    }
    tempatKerjaId = tk.id
    tempatBekerja = tk.nama
  }

  const fields = {
    namaLengkapGelar: body.namaLengkapGelar ?? null,
    tempatLahir: body.tempatLahir ?? null,
    tanggalLahir: body.tanggalLahir ?? null,
    nip: body.nip ?? null,
    nik: body.nik ?? null,
    jenisProfesi: body.jenisProfesi ?? null,
    levelKompetensi: body.levelKompetensi ?? null,
    jenisKelamin: body.jenisKelamin ?? null,
    alamat: body.alamat ?? null,
    telepon: body.telepon ?? null,
    email: body.email ?? null,
    statusKepegawaian: body.statusKepegawaian ?? null,
    jenjangJabatan: body.jenjangJabatan ?? null,
    tempatBekerja,
    tempatKerjaId,
  }

  const profile = await db.asesiProfile.upsert({
    where: { userId: guard.session.user.id },
    update: fields,
    create: { userId: guard.session.user.id, ...fields },
    include: { tempatKerja: { select: { id: true, nama: true } } },
  })

  // Sinkronkan snapshot fasyankes pada pengajuan yang belum lolos verifikasi
  // agar daftar pimpinan fasyankes selalu mengikuti tempat kerja terbaru.
  if (tempatKerjaId && tempatBekerja) {
    await db.pengajuan.updateMany({
      where: { userId: guard.session.user.id, status: 'DRAFT' },
      data: { fasyankes: tempatBekerja },
    })
  }

  return NextResponse.json(profile)
}
