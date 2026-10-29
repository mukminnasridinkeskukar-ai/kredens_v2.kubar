import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'
import { requireApiRole } from '@/lib/role-guard'

// GET /api/staf/pengajuan — daftar seluruh pengajuan (semua asesi) untuk staf
export async function GET() {
  const guard = await requireSession()
  if (!guard.ok) return guard.response
  if (guard.session.user.role === 'ASESI') {
    return NextResponse.json({ error: 'Hanya untuk staf' }, { status: 403 })
  }

  const list = await db.pengajuan.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      user: { select: { nama: true, nip: true, jabatan: true } },
      kewenangan: true,
      rekomendasiTim: true,
      rekomendasiKadis: true,
      spk: true,
    },
  })
  return NextResponse.json(list)
}

const TRANSISI: Record<
  string,
  { status: string; keterangan: string; roles: string[]; dari: string[] }
> = {
  MULAI_VERIFIKASI: {
    status: 'VERIFIKASI',
    keterangan: 'Operator mulai memverifikasi berkas',
    roles: ['OPERATOR_KREDENSIAL'],
    dari: ['DIAJUKAN'],
  },
  VERIFIKASI_LANJUT: {
    status: 'PENILAIAN_TIM',
    keterangan: 'Berkas diverifikasi operator, dinyatakan lengkap — diteruskan ke penilaian tim',
    roles: ['OPERATOR_KREDENSIAL'],
    dari: ['DIAJUKAN', 'VERIFIKASI'],
  },
  KEMBALIKAN_DRAF: {
    status: 'DRAFT',
    keterangan: 'Berkas dikembalikan ke asesi untuk dilengkapi',
    roles: ['OPERATOR_KREDENSIAL'],
    dari: ['DIAJUKAN', 'VERIFIKASI'],
  },
  TANDAI_SELESAI: {
    status: 'SELESAI',
    keterangan: 'Proses kredensial dinyatakan selesai',
    roles: ['OPERATOR_KREDENSIAL', 'PIMPINAN_FASYANKES'],
    dari: ['SURAT_PENUGASAN'],
  },
}

// POST /api/staf/pengajuan — aksi transisi status
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const aksi: string | undefined = body?.aksi
  const pengajuanId: string | undefined = body?.pengajuanId

  if (!aksi || !TRANSISI[aksi]) {
    return NextResponse.json({ error: 'Aksi tidak dikenal' }, { status: 400 })
  }
  const t = TRANSISI[aksi]
  const guard = await requireApiRole(t.roles)
  if (!guard.ok) return guard.response
  if (!pengajuanId) {
    return NextResponse.json({ error: 'pengajuanId wajib diisi' }, { status: 400 })
  }

  // Aksi "lolos verifikasi" wajib menetapkan tepat tiga asesor penilai.
  let asesorTerpilih: { id: string; nama: string }[] = []
  if (aksi === 'VERIFIKASI_LANJUT') {
    const ids: unknown = body?.asesorIds
    if (!Array.isArray(ids) || ids.length !== 3) {
      return NextResponse.json(
        { error: 'Tetapkan tepat tiga asesor penilai sebelum meneruskan pengajuan.' },
        { status: 400 }
      )
    }
    const idUnik = [...new Set(ids.map((v) => String(v ?? '').trim()).filter(Boolean))]
    if (idUnik.length !== 3) {
      return NextResponse.json(
        { error: 'Tiga asesor penilai harus berbeda satu sama lain.' },
        { status: 400 }
      )
    }
    const ditemukan = await db.user.findMany({
      where: { id: { in: idUnik }, role: 'ASESOR', isActive: true },
      select: { id: true, nama: true },
    })
    if (ditemukan.length !== 3) {
      return NextResponse.json(
        { error: 'Ada asesor yang tidak ditemukan, bukan berperan asesor, atau tidak aktif.' },
        { status: 400 }
      )
    }
    // pertahankan urutan pilihan operator
    asesorTerpilih = idUnik.map((id) => ditemukan.find((u) => u.id === id)!)
  }

  const pengajuan = await db.pengajuan.findUnique({
    where: { id: pengajuanId },
    include: { user: { select: { nama: true } } },
  })
  if (!pengajuan) {
    return NextResponse.json({ error: 'Pengajuan tidak ditemukan' }, { status: 404 })
  }
  if (pengajuan.status === 'DRAFT') {
    return NextResponse.json(
      { error: 'Pengajuan masih draf — menunggu dikirim oleh asesi' },
      { status: 400 }
    )
  }
  if (!t.dari.includes(pengajuan.status)) {
    return NextResponse.json(
      { error: `Aksi ini hanya berlaku untuk pengajuan berstatus ${t.dari.join(' / ')}` },
      { status: 400 }
    )
  }

  const keterangan =
    aksi === 'VERIFIKASI_LANJUT' && asesorTerpilih.length === 3
      ? `${t.keterangan} — Asesor penilai: ${asesorTerpilih.map((a) => a.nama).join(', ')}`
      : t.keterangan

  const updated = await db.$transaction(async (tx) => {
    if (aksi === 'VERIFIKASI_LANJUT') {
      // Ganti penugasan lama (idempoten) — hanya tiga asesor terpilih yang berhak menilai.
      await tx.penugasanAsesor.deleteMany({ where: { pengajuanId } })
      await tx.penugasanAsesor.createMany({
        data: asesorTerpilih.map((a) => ({
          pengajuanId,
          asesorId: a.id,
          ditetapkanOleh: guard.user.name,
        })),
      })
    }
    return tx.pengajuan.update({
      where: { id: pengajuanId },
      data: {
        status: t.status,
        riwayat: {
          create: {
            status: t.status,
            keterangan,
            oleh: guard.user.name,
          },
        },
      },
      include: { user: { select: { nama: true } } },
    })
  })

  return NextResponse.json(updated)
}
