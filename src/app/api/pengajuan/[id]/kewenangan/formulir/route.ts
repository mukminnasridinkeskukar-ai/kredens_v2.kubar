import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'
import { buatPdfFormulirKewenangan } from '@/lib/formulir-kewenangan'

type Ctx = { params: Promise<{ id: string }> }

/**
 * GET /api/pengajuan/[id]/kewenangan/formulir — unduh Formulir Kewenangan
 * Klinis (PDF) milik pengajuan asesi (v1.3.2).
 *
 * Isi PDF = daftar kewenangan klinis yang diusulkan pada pengajuan ini,
 * kolomnya sama dengan tabel pada halaman Rincian Kewenangan Klinis
 * (No, Kode, Daftar Diagnosa/Keterampilan, Diminta, Rekomendasi), ditutup
 * blok tanda tangan Asesi dan Asesor Kredensial.
 *
 * Hanya pemilik pengajuan (asesi) yang berhak — pihak penilai membaca
 * datanya langsung dari aplikasi.
 */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response
  const { id } = await ctx.params

  const p = await db.pengajuan.findUnique({
    where: { id },
    select: {
      kode: true,
      jenis: true,
      fasyankes: true,
      userId: true,
      user: {
        select: {
          nama: true,
          nip: true,
          jabatan: true,
          instansi: true,
        },
      },
    },
  })
  if (!p || p.userId !== guard.session.user.id) {
    return NextResponse.json({ error: 'Pengajuan tidak ditemukan' }, { status: 404 })
  }

  const items = await db.kewenanganKlinis.findMany({
    where: { pengajuanId: id },
    orderBy: { urutan: 'asc' },
    select: {
      urutan: true,
      kodeRef: true,
      namaKewenangan: true,
      kodeDiminta: true,
      kodeRekomendasi: true,
    },
  })

  const pdfBytes = await buatPdfFormulirKewenangan({
    kode: p.kode,
    jenis: p.jenis,
    fasyankes: p.fasyankes,
    tanggal: new Date(),
    asesi: {
      nama: p.user.nama,
      nip: p.user.nip,
      jabatan: p.user.jabatan,
      instansi: p.user.instansi,
    },
    items,
  })

  const namaFile = `Formulir-Kewenangan-Klinis-${p.kode}.pdf`
  const ascii = namaFile.replace(/[^\x20-\x7E]/g, '_')
  console.log(
    `[audit] ${new Date().toISOString()} — asesi ${guard.session.user.email} mengunduh formulir kewenangan klinis ${p.kode}`,
  )
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(namaFile)}`,
      'Content-Length': String(pdfBytes.byteLength),
      'Cache-Control': 'private, no-store',
    },
  })
}
