import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireApiRole } from '@/lib/role-guard'
import { ambilWewenangPimpinan, pimpinanBolehAkses } from '@/lib/wewenang'
import { buatPdfTemplateSpk } from '@/lib/template-spk'
import { buatDocxTemplateSpk } from '@/lib/template-spk-docx'

/**
 * GET /api/pimpinan/spk/template?pengajuanId=...&format=pdf|docx — unduh
 * Contoh Template Surat Penugasan Klinis untuk pengajuan tertentu
 * (PDF v1.3.3; Word/DOCX v1.3.4 dengan notifikasi KOP FASYANKES di atas).
 *
 * Surat mengikuti format sheet "SURAT PENUGASAN KLINIS" dengan kalimat
 * lengkap; data yang sudah ada (nomor SPK, ketetapan kewenangan klinis,
 * identitas asesi, identitas pimpinan) otomatis mengisi surat, sisanya
 * garis titik untuk dilengkapi manual.
 *
 * Wewenang: pimpinan fasyankes hanya untuk asesi fasyankesnya sendiri —
 * aturan yang sama dengan unggah SPK (wewenang.ts).
 */
export async function GET(req: NextRequest) {
  const guard = await requireApiRole(['PIMPINAN_FASYANKES'])
  if (!guard.ok) return guard.response

  const pengajuanId = req.nextUrl.searchParams.get('pengajuanId')?.trim() ?? ''
  if (!pengajuanId) {
    return NextResponse.json({ error: 'pengajuanId wajib diisi' }, { status: 400 })
  }

  const p = await db.pengajuan.findUnique({
    where: { id: pengajuanId },
    select: {
      kode: true,
      fasyankes: true,
      user: {
        select: {
          nama: true,
          nip: true,
          jabatan: true,
          asesiProfile: { select: { tempatKerjaId: true } },
        },
      },
      spk: {
        select: {
          nomorSpk: true,
          tanggalSpk: true,
          uptd: true,
          nomorSkKewenangan: true,
          berlakuSampai: true,
          kepalaUptd: true,
        },
      },
      rekomendasiKadis: {
        select: {
          ketetapanNomor: true,
          ketetapanTanggal: true,
          ketetapanBerlakuSampai: true,
          tanggalSurat: true,
        },
      },
    },
  })
  if (!p) {
    return NextResponse.json({ error: 'Pengajuan tidak ditemukan' }, { status: 404 })
  }

  const format =
    req.nextUrl.searchParams.get('format')?.trim().toLowerCase() === 'docx'
      ? 'docx'
      : 'pdf'

  const pimpinan = await ambilWewenangPimpinan(guard.user.id)
  const cek = pimpinanBolehAkses(
    pimpinan,
    p.user.asesiProfile?.tempatKerjaId ?? null,
    p.fasyankes
  )
  if (!cek.ok) {
    return NextResponse.json({ error: cek.alasan ?? 'Bukan wewenang Anda.' }, { status: 403 })
  }

  // NIP akun pimpinan untuk blok tanda tangan surat
  const aku = await db.user.findUnique({
    where: { id: guard.user.id },
    select: { nip: true },
  })

  const namaFile =
    format === 'docx'
      ? `Template-Contoh-SPK-${p.kode}.docx`
      : `Template-Contoh-SPK-${p.kode}.pdf`
  const ascii = namaFile.replace(/[^\x20-\x7E]/g, '_')
  console.log(
    `[audit] ${new Date().toISOString()} — pimpinan ${guard.user.email} mengunduh contoh template SPK ${p.kode} (format: ${format})`,
  )

  if (format === 'docx') {
    const docxBytes = await buatDocxTemplateSpk({
      kode: p.kode,
      nomorSpk: p.spk?.nomorSpk ?? null,
      tanggalSpk: p.spk?.tanggalSpk ?? null,
      uptd: p.spk?.uptd ?? p.fasyankes,
      nomorKetetapan:
        p.spk?.nomorSkKewenangan ?? p.rekomendasiKadis?.ketetapanNomor ?? null,
      tanggalKetetapan:
        p.rekomendasiKadis?.ketetapanTanggal ?? p.rekomendasiKadis?.tanggalSurat ?? null,
      berlakuSampai:
        p.spk?.berlakuSampai ?? p.rekomendasiKadis?.ketetapanBerlakuSampai ?? null,
      kepalaUptd: p.spk?.kepalaUptd ?? pimpinan?.nama ?? null,
      nipKepala: aku?.nip ?? null,
      penerima: {
        nama: p.user.nama,
        nip: p.user.nip,
        profesi: p.user.jabatan,
      },
    })
    return new NextResponse(Buffer.from(docxBytes), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(namaFile)}`,
        'Content-Length': String(docxBytes.byteLength),
        'Cache-Control': 'private, no-store',
      },
    })
  }

  const pdfBytes = await buatPdfTemplateSpk({
    kode: p.kode,
    nomorSpk: p.spk?.nomorSpk ?? null,
    tanggalSpk: p.spk?.tanggalSpk ?? null,
    uptd: p.spk?.uptd ?? p.fasyankes,
    nomorKetetapan:
      p.spk?.nomorSkKewenangan ?? p.rekomendasiKadis?.ketetapanNomor ?? null,
    tanggalKetetapan:
      p.rekomendasiKadis?.ketetapanTanggal ?? p.rekomendasiKadis?.tanggalSurat ?? null,
    berlakuSampai:
      p.spk?.berlakuSampai ?? p.rekomendasiKadis?.ketetapanBerlakuSampai ?? null,
    kepalaUptd: p.spk?.kepalaUptd ?? pimpinan?.nama ?? null,
    nipKepala: aku?.nip ?? null,
    penerima: {
      nama: p.user.nama,
      nip: p.user.nip,
      profesi: p.user.jabatan,
    },
  })

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(namaFile)}`,
      'Content-Length': String(pdfBytes.byteLength),
      'Cache-Control': 'private, no-store',
    },
  })
}
