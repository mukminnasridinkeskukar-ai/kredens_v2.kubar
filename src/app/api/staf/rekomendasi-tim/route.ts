import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireApiRole } from '@/lib/role-guard'
import { KEPUTUSAN_TIM_LABELS } from '@/lib/constants'

const KESIMPULAN_VALID = Object.keys(KEPUTUSAN_TIM_LABELS)

// PUT /api/staf/rekomendasi-tim — ketua tim menetapkan rekomendasi
export async function PUT(req: NextRequest) {
  const guard = await requireApiRole(['KETUA_TIM_KREDENSIAL'])
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  const pengajuanId: string | undefined = body?.pengajuanId
  const kesimpulan: string | undefined = body?.kesimpulan

  if (!pengajuanId) {
    return NextResponse.json({ error: 'pengajuanId wajib diisi' }, { status: 400 })
  }
  if (!kesimpulan || !KESIMPULAN_VALID.includes(kesimpulan)) {
    return NextResponse.json({ error: 'Pilih kesimpulan rekomendasi yang valid' }, { status: 400 })
  }

  const pengajuan = await db.pengajuan.findUnique({
    where: { id: pengajuanId },
    include: { kewenangan: true },
  })
  if (!pengajuan) {
    return NextResponse.json({ error: 'Pengajuan tidak ditemukan' }, { status: 404 })
  }
  if (!['PENILAIAN_TIM', 'REKOMENDASI_TIM'].includes(pengajuan.status)) {
    return NextResponse.json(
      { error: 'Rekomendasi hanya dapat ditetapkan pada tahap PENILAIAN TIM' },
      { status: 400 }
    )
  }

  const belumDinilai = pengajuan.kewenangan.filter((k) => !k.kodeRekomendasi).length
  if (belumDinilai > 0) {
    return NextResponse.json(
      {
        error: `Masih ada ${belumDinilai} kewenangan yang belum diberi kode rekomendasi oleh tim`,
      },
      { status: 400 }
    )
  }

  const data = {
    kesimpulan,
    tanggal: body.tanggal?.trim() || null,
    simpulan: body.simpulan?.trim() || null,
    catatan: body.catatan?.trim() || null,
    ketuaNama: body.ketuaNama?.trim() || guard.user.name,
    anggotaNama: body.anggotaNama?.trim() || null,
    // v2.1 — dua nama asesor lain sebagai anggota tim (perwakilan penilai)
    anggotaNama2: body.anggotaNama2?.trim() || null,
    anggotaNama3: body.anggotaNama3?.trim() || null,
  }

  const rt = await db.rekomendasiTim.upsert({
    where: { pengajuanId },
    create: { pengajuanId, ...data },
    update: data,
  })

  const updated = await db.pengajuan.update({
    where: { id: pengajuanId },
    data: {
      status: 'REKOMENDASI_TIM',
      riwayat: {
        create: {
          status: 'REKOMENDASI_TIM',
          keterangan: `${KEPUTUSAN_TIM_LABELS[kesimpulan] ?? kesimpulan} — ditetapkan ketua tim`,
          oleh: guard.user.name,
        },
      },
    },
    include: { rekomendasiTim: true },
  })

  return NextResponse.json({ ok: true, rekomendasiTim: rt, pengajuan: updated })
}
