import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireApiRole } from '@/lib/role-guard'

// PUT /api/staf/rekomendasi-kadis — Kepala Dinas menerbitkan surat rekomendasi
export async function PUT(req: NextRequest) {
  const guard = await requireApiRole(['KEPALA_DINAS_KESEHATAN'])
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  const pengajuanId: string | undefined = body?.pengajuanId
  if (!pengajuanId) {
    return NextResponse.json({ error: 'pengajuanId wajib diisi' }, { status: 400 })
  }

  const pengajuan = await db.pengajuan.findUnique({
    where: { id: pengajuanId },
    include: { rekomendasiTim: true, user: { select: { nama: true } } },
  })
  if (!pengajuan) {
    return NextResponse.json({ error: 'Pengajuan tidak ditemukan' }, { status: 404 })
  }
  if (pengajuan.status !== 'REKOMENDASI_TIM') {
    return NextResponse.json(
      { error: 'Surat rekomendasi hanya terbit setelah tim kredensial menetapkan rekomendasi' },
      { status: 400 }
    )
  }
  if (!pengajuan.rekomendasiTim) {
    return NextResponse.json(
      { error: 'Rekomendasi tim belum tersedia' },
      { status: 400 }
    )
  }

  const nomorSurat = body.nomorSurat?.trim()
  if (!nomorSurat) {
    return NextResponse.json({ error: 'Nomor surat rekomendasi wajib diisi' }, { status: 400 })
  }

  const data = {
    nomorSurat,
    tanggalSurat: body.tanggalSurat?.trim() || null,
    sifat: body.sifat?.trim() || 'Biasa',
    lampiran: body.lampiran?.trim() || '1 (satu) Berkas',
    hal: body.hal?.trim() || 'Rekomendasi Penetapan Kewenangan Klinis',
    refSuratNomor: body.refSuratNomor?.trim() || null,
    refSuratTanggal: body.refSuratTanggal?.trim() || null,
    tujuanUptd: body.tujuanUptd?.trim() || pengajuan.fasyankes || null,
    tempat: body.tempat?.trim() || 'Sendawar',
    ketetapanNomor: body.ketetapanNomor?.trim() || null,
    ketetapanTanggal: body.ketetapanTanggal?.trim() || null,
    ketetapanBerlakuSampai: body.ketetapanBerlakuSampai?.trim() || null,
    catatan: body.catatan?.trim() || null,
  }

  const rk = await db.rekomendasiKadis.upsert({
    where: { pengajuanId },
    create: { pengajuanId, ...data },
    update: data,
  })

  const updated = await db.pengajuan.update({
    where: { id: pengajuanId },
    data: {
      status: 'KETETAPAN_KADIS',
      riwayat: {
        create: {
          status: 'KETETAPAN_KADIS',
          keterangan: `Surat rekomendasi terbit: ${nomorSurat}`,
          oleh: guard.user.name,
        },
      },
    },
    include: { rekomendasiKadis: true },
  })

  return NextResponse.json({ ok: true, rekomendasiKadis: rk, pengajuan: updated })
}
