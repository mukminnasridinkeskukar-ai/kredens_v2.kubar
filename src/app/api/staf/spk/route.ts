import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireApiRole } from '@/lib/role-guard'

// PUT /api/staf/spk — Pimpinan Fasyankes menerbitkan Surat Penugasan Klinis
export async function PUT(req: NextRequest) {
  const guard = await requireApiRole(['PIMPINAN_FASYANKES'])
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  const pengajuanId: string | undefined = body?.pengajuanId
  if (!pengajuanId) {
    return NextResponse.json({ error: 'pengajuanId wajib diisi' }, { status: 400 })
  }

  const pengajuan = await db.pengajuan.findUnique({
    where: { id: pengajuanId },
    include: { rekomendasiKadis: true, user: { select: { nama: true } } },
  })
  if (!pengajuan) {
    return NextResponse.json({ error: 'Pengajuan tidak ditemukan' }, { status: 404 })
  }
  if (!['KETETAPAN_KADIS', 'SURAT_PENUGASAN'].includes(pengajuan.status)) {
    return NextResponse.json(
      { error: 'SPK hanya terbit setelah Kepala Dinas menerbitkan surat rekomendasi' },
      { status: 400 }
    )
  }

  const nomorSpk = body.nomorSpk?.trim()
  if (!nomorSpk) {
    return NextResponse.json({ error: 'Nomor SPK wajib diisi' }, { status: 400 })
  }

  const data = {
    nomorSpk,
    tanggalSpk: body.tanggalSpk?.trim() || null,
    uptd: body.uptd?.trim() || pengajuan.rekomendasiKadis?.tujuanUptd || pengajuan.fasyankes || null,
    nomorSkKewenangan:
      body.nomorSkKewenangan?.trim() || pengajuan.rekomendasiKadis?.ketetapanNomor || null,
    berlakuSampai: body.berlakuSampai?.trim() || null,
    kepalaUptd: body.kepalaUptd?.trim() || guard.user.name,
  }

  const spk = await db.suratPenugasanKlinis.upsert({
    where: { pengajuanId },
    create: { pengajuanId, ...data },
    update: data,
  })

  const updated = await db.pengajuan.update({
    where: { id: pengajuanId },
    data: {
      status: 'SURAT_PENUGASAN',
      riwayat: {
        create: {
          status: 'SURAT_PENUGASAN',
          keterangan: `Surat Penugasan Klinis terbit: ${nomorSpk}`,
          oleh: guard.user.name,
        },
      },
    },
    include: { spk: true },
  })

  return NextResponse.json({ ok: true, spk, pengajuan: updated })
}
