import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

/**
 * Contoh Template Surat Penugasan Klinis (v1.3.3) — PDF siap cetak untuk
 * pimpinan fasyankes.
 *
 * Isi surat mengikuti sheet "SURAT PENUGASAN KLINIS" pada Template Akun
 * Asesi (xlsx) dengan kalimat-kalimat yang kurang lengkap telah dirangkai
 * menjadi surat utuh sesuai tata naskah dinas:
 *
 *   Yang bertanda tangan di bawah ini: (Nama/NIP/Jabatan Kepala UPTD)
 *   ... memberikan Penugasan Klinis kepada: (Kepada: nama tenaga kesehatan)
 *   Untuk memberikan pelayanan kesehatan di UPTD ...
 *   sesuai dengan surat ketetapan kewenangan klinis nomor ... tanggal ...
 *   Penugasan klinis ini berlaku sampai dengan tanggal ... atau waktu lain
 *   dalam hal terjadi perubahan kewenangan klinis sesuai dengan keputusan
 *   Kepala Dinas Kesehatan Kabupaten Kutai Barat.
 *   Sendawar, ... — Kepala UPTD (tanda tangan & cap)
 *
 * Data pengajuan yang sudah ada (SPK, ketetapan kewenangan, identitas
 * asesi) otomatis mengisi surat; bagian yang belum ada diberi garis titik
 * agar dapat dilengkapi manual sebelum ditandatangani.
 *
 * Memakai pdf-lib (font standar PDF) — aman di runtime serverless Vercel.
 */

export type DataTemplateSpk = {
  kode: string
  nomorSpk: string | null
  tanggalSpk: string | null
  uptd: string | null
  nomorKetetapan: string | null
  tanggalKetetapan: string | null
  berlakuSampai: string | null
  kepalaUptd: string | null
  nipKepala: string | null
  penerima: { nama: string; nip: string | null; profesi: string | null }
}

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const HITAM = rgb(0.1, 0.1, 0.12)
const ABU = rgb(0.45, 0.47, 0.5)
const GARIS = rgb(0.75, 0.77, 0.8)

const A4: [number, number] = [595.28, 841.89]
const MARGIN = 58

export const TITIK_NAMA = '..............................'
export const TITIK_TANGGAL = '..................'
export const TITIK_NOMOR = '.....................'

/** '2025-07-15' -> '15 Juli 2025'; nilai lain ditampilkan apa adanya. */
export function fmtTanggal(nilai: string | null | undefined): string | null {
  const s = nilai?.trim()
  if (!s) return null
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (m) {
    const bulan = BULAN[Number(m[2]) - 1] ?? m[2]
    return `${Number(m[3])} ${bulan} ${m[1]}`
  }
  return s
}

function wrapTeks(
  teks: string,
  maks: number,
  lebar: (s: string) => number,
): string[] {
  const kata = teks.split(/\s+/).filter(Boolean)
  const baris: string[] = []
  let kini = ''
  for (const k of kata) {
    const coba = kini ? `${kini} ${k}` : k
    if (lebar(coba) <= maks) {
      kini = coba
    } else {
      if (kini) baris.push(kini)
      kini = k
    }
  }
  if (kini) baris.push(kini)
  return baris.length > 0 ? baris : ['']
}

export async function buatPdfTemplateSpk(
  data: DataTemplateSpk,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.setTitle(`Contoh Template Surat Penugasan Klinis — ${data.kode}`)
  pdf.setAuthor('Dinas Kesehatan Kabupaten Kutai Barat')
  pdf.setSubject('Contoh Template Surat Penugasan Klinis (SPK) KREDENS')

  const reguler = await pdf.embedFont(StandardFonts.TimesRoman)
  const tebal = await pdf.embedFont(StandardFonts.TimesRomanBold)
  const miring = await pdf.embedFont(StandardFonts.TimesRomanItalic)

  const lebarHal = A4[0]
  const tinggiHal = A4[1]
  const kiri = MARGIN
  const kanan = lebarHal - MARGIN
  const lebarKonten = kanan - kiri

  const lebarTeks = (s: string, f = reguler, ukuran = 11) =>
    f.widthOfTextAtSize(s, ukuran)

  let halaman = pdf.addPage(A4)
  let y = tinggiHal - MARGIN
  let nomorHalaman = 1

  function garisTepi() {
    halaman.drawLine({
      start: { x: kiri, y: MARGIN },
      end: { x: kanan, y: MARGIN },
      thickness: 0.6,
      color: GARIS,
    })
    halaman.drawText(`KREDENS — Contoh Template SPK · ${data.kode}`, {
      x: kiri,
      y: MARGIN - 16,
      size: 7.5,
      font: reguler,
      color: ABU,
    })
    const lbl = `Halaman ${nomorHalaman}`
    halaman.drawText(lbl, {
      x: kanan - lebarTeks(lbl, reguler, 7.5),
      y: MARGIN - 16,
      size: 7.5,
      font: reguler,
      color: ABU,
    })
  }

  /** Paragraf rata kiri dengan pembungkusan otomatis. */
  function paragraf(
    teks: string,
    opsi: { x?: number; lebar?: number; ukuran?: number; font?: PDFFontLike; jarakBaris?: number; abu?: boolean } = {},
  ) {
    const x = opsi.x ?? kiri
    const w = opsi.lebar ?? lebarKonten - (x - kiri)
    const ukuran = opsi.ukuran ?? 11
    const font = opsi.font ?? reguler
    const jarak = opsi.jarakBaris ?? 15.5
    for (const baris of wrapTeks(teks, w, (s) => lebarTeks(s, font, ukuran))) {
      halaman.drawText(baris, {
        x,
        y,
        size: ukuran,
        font,
        color: opsi.abu ? ABU : HITAM,
      })
      y -= jarak
    }
  }

  /** Baris "Label  : nilai" dengan titik-titik bila kosong. */
  function barisNilai(label: string, nilai: string | null, kolomNilaiX: number) {
    const v = nilai?.trim() || TITIK_NAMA
    halaman.drawText(label, { x: kiri + 20, y, size: 11, font: reguler, color: HITAM })
    halaman.drawText(':', { x: kolomNilaiX - 12, y, size: 11, font: reguler, color: HITAM })
    const maks = kanan - kolomNilaiX
    const baris = lebarTeks(v, reguler, 11) <= maks ? [v] : wrapTeks(v, maks, (s) => lebarTeks(s, reguler, 11))
    baris.forEach((b, i) => {
      halaman.drawText(b, { x: kolomNilaiX, y: y - i * 15.5, size: 11, font: reguler, color: HITAM })
    })
    y -= 15.5 * baris.length
  }

  type PDFFontLike = typeof reguler

  // ===== Kepala surat =====
  const judul = 'SURAT PENUGASAN KLINIS'
  halaman.drawText(judul, {
    x: (lebarHal - lebarTeks(judul, tebal, 14)) / 2,
    y: y - 14,
    size: 14,
    font: tebal,
    color: HITAM,
  })
  y -= 30

  const tNomor = `Nomor : ${data.nomorSpk?.trim() || TITIK_NOMOR}`
  halaman.drawText(tNomor, {
    x: (lebarHal - lebarTeks(tNomor, reguler, 11)) / 2,
    y,
    size: 11,
    font: reguler,
    color: HITAM,
  })
  y -= 16

  const catatan =
    'Contoh template — lengkapi bagian bertitik, tandatangani & cap, pindai, lalu unggah pada panel Unggah Dokumen SPK.'
  halaman.drawText(catatan, {
    x: (lebarHal - lebarTeks(catatan, miring, 8.5)) / 2,
    y,
    size: 8.5,
    font: miring,
    color: ABU,
  })
  y -= 26

  // ===== Pemberi tugas =====
  paragraf('Yang bertanda tangan di bawah ini:')
  const kolomNilai1 = kiri + 150
  barisNilai('Nama', data.kepalaUptd, kolomNilai1)
  barisNilai('NIP/NIK', data.nipKepala, kolomNilai1)
  barisNilai('Jabatan', data.uptd ? `Kepala UPTD ${data.uptd}` : 'Kepala UPTD ..............................', kolomNilai1)
  paragraf('selanjutnya disebut Pemberi Tugas.')
  y -= 8

  // ===== Penerima tugas (Kepada) =====
  paragraf('Dengan ini memberikan Penugasan Klinis kepada:')
  const kolomNilai2 = kiri + 195
  barisNilai('Nama', data.penerima.nama, kolomNilai2)
  barisNilai('NIP/NIK', data.penerima.nip, kolomNilai2)
  barisNilai('Jenis Tenaga Kesehatan', data.penerima.profesi, kolomNilai2)
  paragraf('selanjutnya disebut Penerima Tugas.')
  y -= 8

  // ===== Isi penugasan (kalimat sheet dilengkapi) =====
  const uptd = data.uptd?.trim() || '..........................................'
  const noKetetapan = data.nomorKetetapan?.trim() || TITIK_NOMOR
  const tglKetetapan = fmtTanggal(data.tanggalKetetapan) ?? TITIK_TANGGAL
  paragraf(
    `Untuk memberikan pelayanan kesehatan di UPTD ${uptd} sesuai dengan surat ` +
      `ketetapan kewenangan klinis nomor ${noKetetapan} tanggal ${tglKetetapan}.`,
  )
  y -= 8

  const berlaku = fmtTanggal(data.berlakuSampai) ?? TITIK_TANGGAL
  paragraf(
    `Penugasan klinis ini berlaku sampai dengan tanggal ${berlaku} atau waktu lain ` +
      'dalam hal terjadi perubahan kewenangan klinis sesuai dengan keputusan ' +
      'Kepala Dinas Kesehatan Kabupaten Kutai Barat.',
  )
  y -= 10

  // ===== Tanda tangan (kolom kanan, mengikuti tata naskah dinas) =====
  if (y < MARGIN + 230) {
    garisTepi()
    halaman = pdf.addPage(A4)
    nomorHalaman++
    y = tinggiHal - MARGIN
  }

  const kolomTtdX = kanan - 240
  const tglSpk = fmtTanggal(data.tanggalSpk) ?? TITIK_TANGGAL
  halaman.drawText(`Sendawar, ${tglSpk}`, {
    x: kolomTtdX,
    y,
    size: 11,
    font: reguler,
    color: HITAM,
  })
  y -= 15.5
  for (const b of wrapTeks(data.uptd ? `Kepala UPTD ${data.uptd}` : 'Kepala UPTD ..............................', kanan - kolomTtdX, (s) => lebarTeks(s, reguler, 11))) {
    halaman.drawText(b, { x: kolomTtdX, y, size: 11, font: reguler, color: HITAM })
    y -= 15.5
  }
  y -= 52 // ruang tanda tangan & cap
  halaman.drawText('(tanda tangan dan cap dinas)', {
    x: kolomTtdX,
    y,
    size: 8.5,
    font: reguler,
    color: ABU,
  })
  y -= 18
  const namaTtd = data.kepalaUptd?.trim() || TITIK_NAMA
  for (const b of wrapTeks(namaTtd, kanan - kolomTtdX, (s) => lebarTeks(s, tebal, 11))) {
    halaman.drawText(b, { x: kolomTtdX, y, size: 11, font: tebal, color: HITAM })
    y -= 15.5
  }
  const nipTtd = data.nipKepala?.trim() || TITIK_NAMA
  for (const b of wrapTeks(`NIP/NIK. ${nipTtd}`, kanan - kolomTtdX, (s) => lebarTeks(s, reguler, 11))) {
    halaman.drawText(b, { x: kolomTtdX, y, size: 11, font: reguler, color: HITAM })
    y -= 15.5
  }

  garisTepi()
  return await pdf.save()
}
