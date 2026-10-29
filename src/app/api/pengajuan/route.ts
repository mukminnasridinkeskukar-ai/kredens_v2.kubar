import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'

function generateKode(): string {
  const now = new Date()
  const y = now.getFullYear()
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `KR-${y}-${rand}`
}

// GET /api/pengajuan — daftar pengajuan milik asesi
export async function GET() {
  const guard = await requireSession()
  if (!guard.ok) return guard.response

  const list = await db.pengajuan.findMany({
    where: { userId: guard.session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      kewenangan: true,
      rekomendasiTim: true,
      rekomendasiKadis: true,
      spk: true,
      jadwal: true,
      riwayat: { orderBy: { createdAt: 'asc' } },
    },
  })
  return NextResponse.json(list)
}

// POST /api/pengajuan — buat pengajuan baru (draft)
export async function POST(req: NextRequest) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response

  try {
    const body = await req.json()
    const profile = await db.asesiProfile.findUnique({ where: { userId: guard.session.user.id } })

    const pengajuan = await db.pengajuan.create({
      data: {
        kode: generateKode(),
        userId: guard.session.user.id,
        jenis: body.jenis === 'REKREDENSIAL' ? 'REKREDENSIAL' : 'KREDENSIAL',
        status: 'DRAFT',
        fasyankes: profile?.tempatBekerja ?? null,
        formulir: { create: {} },
        riwayat: {
          create: {
            status: 'DRAFT',
            keterangan: 'Pengajuan dibuat',
            oleh: guard.session.user.name,
          },
        },
      },
      include: { formulir: true },
    })
    return NextResponse.json(pengajuan)
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Gagal membuat pengajuan' }, { status: 400 })
  }
}
