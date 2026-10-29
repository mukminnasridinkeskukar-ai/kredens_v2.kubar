import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

/**
 * Formulir Kewenangan Klinis (v1.3.2) — PDF siap cetak untuk asesi.
 *
 * Isi dan kolomnya mengikuti tampilan tabel "Daftar Kewenangan Klinis
 * Diusulkan" pada halaman Rincian Kewenangan Klinis:
 *   No | Kode | Daftar Diagnosa/Keterampilan | Diminta | Rekomendasi
 * Kolom Rekomendasi dibiarkan kosong bila penilaian tim belum ada —
 * menyediakan ruang isian manual pada formulir kertas.
 * Bagian bawah halaman terakhir menyediakan kolom tanda tangan Asesi
 * dan Asesor Kredensial.
 *
 * Memakai pdf-lib (murni JavaScript, font standar PDF) sehingga aman
 * dijalankan pada runtime serverless Vercel tanpa berkas font tambahan.
 */

export type ItemFormulir = {
  urutan: number
  kodeRef: string | null
  namaKewenangan: string
  kodeDiminta: string
  kodeRekomendasi: string | null
}

export type DataFormulir = {
  kode: string
  jenis: string
  fasyankes: string | null
  tanggal: Date
  asesi: { nama: string; nip: string | null; jabatan: string | null; instansi: string | null }
  items: ItemFormulir[]
}

const JUDUL_KODE_DIMINTA: Record<string, string> = {
  '1': '1 = Kompeten sepenuhnya',
  '2': '2 = Memerlukan supervisi',
  '3': '3 = Tidak dimintakan — di luar kompetensi',
  '4': '4 = Tidak dimintakan — fasilitas tidak tersedia',
}

const BIRU = rgb(0.1, 0.15, 0.3)
const ABU = rgb(0.45, 0.47, 0.5)
const HITAM = rgb(0.1, 0.1, 0.12)
const GARIS = rgb(0.75, 0.77, 0.8)
const LATAR_KEPALA = rgb(0.93, 0.95, 0.97)

const A4: [number, number] = [595.28, 841.89] // portrait
const MARGIN = 42

// Lebar kolom tabel (titik) — total memenuhi lebar area konten
const KOLOM = {
  no: 28,
  kode: 62,
  nama: 0, // fleksibel — dihitung
  diminta: 46,
  rekomendasi: 64,
}

function potongTeks(teks: string, maks: number, lebar: (s: string) => number): string {
  if (lebar(teks) <= maks) return teks
  while (teks.length > 1 && lebar(teks + '…') > maks) teks = teks.slice(0, -1)
  return teks + '…'
}

function bungkusTeks(teks: string, maks: number, lebar: (s: string) => number): string[] {
  const kata = teks.split(/\s+/).filter(Boolean)
  const baris: string[] = []
  let kini = ''
  for (const k of kata) {
    const coba = kini ? `${kini} ${k}` : k
    if (lebar(coba) <= maks) {
      kini = coba
    } else {
      if (kini) baris.push(kini)
      // kata tunggal melebihi kolom — paksa potong
      kini = lebar(k) <= maks ? k : potongTeks(k, maks, lebar)
    }
  }
  if (kini) baris.push(kini)
  return baris.length > 0 ? baris : ['']
}

export async function buatPdfFormulirKewenangan(
  data: DataFormulir,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.setTitle(`Formulir Kewenangan Klinis — ${data.kode}`)
  pdf.setAuthor('Dinas Kesehatan Kabupaten Kutai Barat')
  pdf.setSubject('Formulir Kewenangan Klinis KREDENS')

  const reguler = await pdf.embedFont(StandardFonts.Helvetica)
  const tebal = await pdf.embedFont(StandardFonts.HelveticaBold)

  const lebarHal = A4[0]
  const tinggiHal = A4[1]
  const kontenKiri = MARGIN
  const kontenKanan = lebarHal - MARGIN
  const kontenLebar = kontenKanan - kontenKiri

  // kolom nama = sisa ruang
  const kolomNama = kontenLebar - KOLOM.no - KOLOM.kode - KOLOM.diminta - KOLOM.rekomendasi
  KOLOM.nama = kolomNama

  const fmtTanggal = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`

  const jenisLabel =
    data.jenis === 'REKREDENSIAL' ? 'Rekredensialing' : 'Kredensialing'

  let halaman = pdf.addPage(A4)
  let y = tinggiHal - MARGIN
  let nomorHalaman = 1

  const lebarTeks = (s: string, f = reguler, ukuran = 9) =>
    f.widthOfTextAtSize(s, ukuran)

  function garisTepi() {
    halaman.drawLine({
      start: { x: kontenKiri, y: MARGIN },
      end: { x: kontenKanan, y: MARGIN },
      thickness: 0.6,
      color: GARIS,
    })
    halaman.drawText(`KREDENS — Formulir Kewenangan Klinis · ${data.kode}`, {
      x: kontenKiri,
      y: MARGIN - 16,
      size: 7.5,
      font: reguler,
      color: ABU,
    })
    halaman.drawText(`Halaman ${nomorHalaman}`, {
      x: kontenKanan - lebarTeks(`Halaman ${nomorHalaman}`, reguler, 7.5),
      y: MARGIN - 16,
      size: 7.5,
      font: reguler,
      color: ABU,
    })
  }

  function halamanBaru(denganKepalaTabel: boolean) {
    garisTepi()
    halaman = pdf.addPage(A4)
    nomorHalaman++
    y = tinggiHal - MARGIN
    halaman.drawText(
      `Formulir Kewenangan Klinis — ${data.kode} (lanjutan)`,
      { x: kontenKiri, y: y - 2, size: 10, font: tebal, color: BIRU },
    )
    y -= 24
    if (denganKepalaTabel) gambarKepalaTabel()
  }

  // ===== Kepala formulir =====
  halaman.drawText('FORMULIR KEWENANGAN KLINIS', {
    x: kontenKiri,
    y: y - 14,
    size: 15,
    font: tebal,
    color: BIRU,
  })
  y -= 30
  halaman.drawText('Dinas Kesehatan Kabupaten Kutai Barat', {
    x: kontenKiri,
    y,
    size: 10,
    font: reguler,
    color: ABU,
  })
  halaman.drawText(`No. Pengajuan: ${data.kode}`, {
    x: kontenKanan - lebarTeks(`No. Pengajuan: ${data.kode}`, reguler, 10),
    y,
    size: 10,
    font: tebal,
    color: HITAM,
  })
  y -= 14
  halaman.drawText(`Jenis Pengajuan: ${jenisLabel} · Dicetak: ${fmtTanggal(data.tanggal)}`, {
    x: kontenKiri,
    y,
    size: 9,
    font: reguler,
    color: ABU,
  })
  y -= 22

  // ===== Identitas asesi =====
  const identitas: Array<[string, string]> = [
    ['Nama', data.asesi.nama],
    ['NIP', data.asesi.nip ?? '-'],
    ['Jabatan', data.asesi.jabatan ?? '-'],
    ['Instansi / Fasyankes', data.asesi.instansi ?? data.fasyankes ?? '-'],
  ]
  const labelLebar = 105
  halaman.drawRectangle({
    x: kontenKiri,
    y: y - identitas.length * 14 - 6,
    width: kontenLebar,
    height: identitas.length * 14 + 6,
    color: LATAR_KEPALA,
  })
  identitas.forEach(([label, nilai], i) => {
    const yy = y - i * 14
    halaman.drawText(label, { x: kontenKiri + 6, y: yy, size: 9, font: tebal, color: BIRU })
    halaman.drawText(potongTeks(nilai, kontenLebar - labelLebar - 14, (s) => lebarTeks(s, reguler, 9)), {
      x: kontenKiri + labelLebar,
      y: yy,
      size: 9,
      font: reguler,
      color: HITAM,
    })
  })
  y -= identitas.length * 14 + 18

  // ===== Kepala tabel =====
  function gambarKepalaTabel() {
    const kepala = ['No', 'Kode', 'Daftar Diagnosa/Keterampilan', 'Diminta', 'Rekomendasi']
    halaman.drawRectangle({
      x: kontenKiri,
      y: y - 18,
      width: kontenLebar,
      height: 18,
      color: LATAR_KEPALA,
      borderColor: GARIS,
      borderWidth: 0.8,
    })
    const xs = [
      kontenKiri,
      kontenKiri + KOLOM.no,
      kontenKiri + KOLOM.no + KOLOM.kode,
      kontenKiri + KOLOM.no + KOLOM.kode + KOLOM.nama,
      kontenKiri + KOLOM.no + KOLOM.kode + KOLOM.nama + KOLOM.diminta,
    ]
    kepala.forEach((t, i) => {
      const opsi = { x: xs[i] + 4, y: y - 13, size: 8.5, font: tebal, color: BIRU }
      if (i === 0) {
        halaman.drawText(t, { ...opsi, x: kontenKiri + 6 })
      } else if (i >= 3) {
        const w = lebarTeks(t, tebal, 8.5)
        const selLebar = i === 3 ? KOLOM.diminta : KOLOM.rekomendasi
        halaman.drawText(t, { ...opsi, x: xs[i] + (selLebar - w) / 2 })
      } else {
        halaman.drawText(t, opsi)
      }
    })
    y -= 18
  }

  gambarKepalaTabel()

  // ===== Baris item =====
  const xs = [
    kontenKiri,
    kontenKiri + KOLOM.no,
    kontenKiri + KOLOM.no + KOLOM.kode,
    kontenKiri + KOLOM.no + KOLOM.kode + KOLOM.nama,
    kontenKiri + KOLOM.no + KOLOM.kode + KOLOM.nama + KOLOM.diminta,
  ]
  const tinggiMinimalBaris = 18

  if (data.items.length === 0) {
    halaman.drawText('(Belum ada kewenangan klinis yang diusulkan)', {
      x: kontenKiri + 6,
      y: y - 14,
      size: 9,
      font: reguler,
      color: ABU,
    })
    y -= 26
  }

  for (const item of data.items) {
    const namaBaris = bungkusTeks(item.namaKewenangan, KOLOM.nama - 8, (s) => lebarTeks(s, reguler, 9))
    const tinggiBaris = Math.max(tinggiMinimalBaris, namaBaris.length * 11 + 7)
    if (y - tinggiBaris < MARGIN + 120) {
      // garis penutup tabel di halaman ini
      halaman.drawLine({
        start: { x: kontenKiri, y },
        end: { x: kontenKanan, y },
        thickness: 0.8,
        color: GARIS,
      })
      halamanBaru(true)
    }

    const dasar = y - tinggiBaris
    // garis pemisah baris
    halaman.drawLine({
      start: { x: kontenKiri, y: dasar },
      end: { x: kontenKanan, y: dasar },
      thickness: 0.5,
      color: GARIS,
    })
    // garis vertikal kolom (satu garis dari kepala sampai akhir nanti — per baris saja agar sederhana)
    const batas = [xs[1], xs[2], xs[3], xs[4]]
    for (const bx of batas) {
      halaman.drawLine({
        start: { x: bx, y: y },
        end: { x: bx, y: dasar },
        thickness: 0.5,
        color: GARIS,
      })
    }

    halaman.drawText(String(item.urutan), {
      x: kontenKiri + 6,
      y: dasar + 5,
      size: 9,
      font: reguler,
      color: HITAM,
    })
    halaman.drawText(potongTeks(item.kodeRef ?? '-', KOLOM.kode - 8, (s) => lebarTeks(s, reguler, 8)), {
      x: xs[1] + 4,
      y: dasar + 5,
      size: 8,
      font: reguler,
      color: HITAM,
    })
    namaBaris.forEach((b, i) => {
      halaman.drawText(b, {
        x: xs[2] + 4,
        y: y - 13 - i * 11,
        size: 9,
        font: reguler,
        color: HITAM,
      })
    })
    const dm = item.kodeDiminta
    const wd = lebarTeks(dm, tebal, 10)
    halaman.drawText(dm, {
      x: xs[3] + (KOLOM.diminta - wd) / 2,
      y: dasar + 5,
      size: 10,
      font: tebal,
      color: HITAM,
    })
    const rk = item.kodeRekomendasi ?? ''
    if (rk) {
      const wr = lebarTeks(rk, tebal, 10)
      halaman.drawText(rk, {
        x: xs[4] + (KOLOM.rekomendasi - wr) / 2,
        y: dasar + 5,
        size: 10,
        font: tebal,
        color: HITAM,
      })
    }
    y = dasar
  }
  // garis penutup tabel terakhir
  halaman.drawLine({
    start: { x: kontenKiri, y },
    end: { x: kontenKanan, y },
    thickness: 0.8,
    color: GARIS,
  })
  y -= 14

  // ===== Keterangan kode =====
  halaman.drawText('Keterangan kode kolom Diminta (diisi asesi):', {
    x: kontenKiri,
    y,
    size: 8,
    font: tebal,
    color: BIRU,
  })
  y -= 11
  for (const t of Object.values(JUDUL_KODE_DIMINTA)) {
    halaman.drawText(t, { x: kontenKiri + 10, y, size: 8, font: reguler, color: ABU })
    y -= 10
  }
  halaman.drawText('Kolom Rekomendasi diisi oleh Tim Kredensial / Mitra Bestari pada tahap penilaian.', {
    x: kontenKiri,
    y: y - 2,
    size: 8,
    font: reguler,
    color: ABU,
  })
  y -= 20

  // ===== Tanda tangan (posisi tetap dekat dasar halaman terakhir) =====
  if (y < MARGIN + 150) halamanBaru(false)

  const ttdY = MARGIN + 118
  const kolomTengah = kontenKiri + kontenLebar / 2

  // Baris tanggal (kiri saja, tidak melewati kolom kanan agar tak bertabrakan)
  halaman.drawText('...................., ..........................', {
    x: kontenKiri + 8,
    y: ttdY + 46,
    size: 9,
    font: reguler,
    color: HITAM,
  })

  // kolom kiri: Asesi | kolom kanan: Asesor
  halaman.drawText('Asesi,', { x: kontenKiri + 8, y: ttdY + 24, size: 9, font: reguler, color: HITAM })
  halaman.drawText('Asesor Kredensial,', { x: kolomTengah + 8, y: ttdY + 24, size: 9, font: reguler, color: HITAM })

  // ruang tanda tangan
  halaman.drawText('(tanda tangan dan nama lengkap)', {
    x: kontenKiri + 8,
    y: ttdY + 8,
    size: 7.5,
    font: reguler,
    color: ABU,
  })
  halaman.drawText('(tanda tangan dan nama lengkap)', {
    x: kolomTengah + 8,
    y: ttdY + 8,
    size: 7.5,
    font: reguler,
    color: ABU,
  })
  halaman.drawText('Nama  : .............................................', {
    x: kontenKiri + 8,
    y: ttdY - 14,
    size: 9,
    font: reguler,
    color: HITAM,
  })
  halaman.drawText('Nama  : .............................................', {
    x: kolomTengah + 8,
    y: ttdY - 14,
    size: 9,
    font: reguler,
    color: HITAM,
  })
  halaman.drawText('NIP     : .............................................', {
    x: kontenKiri + 8,
    y: ttdY - 27,
    size: 9,
    font: reguler,
    color: HITAM,
  })
  halaman.drawText('NIP     : .............................................', {
    x: kolomTengah + 8,
    y: ttdY - 27,
    size: 9,
    font: reguler,
    color: HITAM,
  })

  garisTepi()
  return await pdf.save()
}
