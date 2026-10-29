import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireApiRole, ROLE_PENILAI } from '@/lib/role-guard'

const KODE_VALID = ['1', '2', '3', '4']

// PUT /api/staf/kewenangan — simpan kode rekomendasi per kewenangan
export async function PUT(req: NextRequest) {
  const guard = await requireApiRole(ROLE_PENILAI)
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  const pengajuanId: string | undefined = body?.pengajuanId
  const items: { id: string; kodeRekomendasi?: string | null; catatanRekomendasi?: string | null }[] =
    Array.isArray(body?.items) ? body.items : []

  if (!pengajuanId || items.length === 0) {
    return NextResponse.json({ error: 'pengajuanId dan items wajib diisi' }, { status: 400 })
  }
  for (const it of items) {
    if (it.kodeRekomendasi != null && !KODE_VALID.includes(it.kodeRekomendasi)) {
      return NextResponse.json(
        { error: `Kode rekomendasi "${it.kodeRekomendasi}" tidak valid (gunakan 1–4)` },
        { status: 400 }
      )
    }
  }

  const pengajuan = await db.pengajuan.findUnique({ where: { id: pengajuanId } })
  if (!pengajuan) {
    return NextResponse.json({ error: 'Pengajuan tidak ditemukan' }, { status: 404 })
  }
  if (!['PENILAIAN_TIM', 'REKOMENDASI_TIM'].includes(pengajuan.status)) {
    return NextResponse.json(
      { error: 'Penilaian hanya dapat diisi pada tahap PENILAIAN TIM' },
      { status: 400 }
    )
  }

  // Hanya tiga asesor yang ditetapkan Operator pada saat verifikasi lolos
  // yang boleh menilai (Mitra Bestari/Ketua Tim/Superadmin tidak dibatasi).
  if (guard.user.role === 'ASESOR') {
    const ditugaskan = await db.penugasanAsesor.findUnique({
      where: { pengajuanId_asesorId: { pengajuanId, asesorId: guard.user.id } },
      select: { id: true },
    })
    if (!ditugaskan) {
      return NextResponse.json(
        { error: 'Anda tidak ditetapkan sebagai asesor penilai untuk pengajuan ini.' },
        { status: 403 }
      )
    }
  }

  await db.$transaction(
    items.map((it) =>
      db.kewenanganKlinis.update({
        where: { id: it.id },
        data: {
          kodeRekomendasi: it.kodeRekomendasi ?? null,
          catatanRekomendasi: it.catatanRekomendasi?.trim() || null,
        },
      })
    )
  )

  const kewenangan = await db.kewenanganKlinis.findMany({
    where: { pengajuanId },
    orderBy: { urutan: 'asc' },
  })
  return NextResponse.json({ ok: true, kewenangan })
}
