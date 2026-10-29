/**
 * Parser CSV sederhana namun kokoh untuk impor template kewenangan klinis.
 * Mendukung:
 * - BOM UTF-8
 * - Deteksi otomatis delimiter: koma, titik-koma, atau tab
 * - Field berkutip (RFC4180): tanda kutip ganda di dalam field ditulis ""
 * - Baris baru di dalam kutipan
 * - CRLF / LF
 */

export type BarisTemplateCsv = {
  baris: number // nomor baris data (termasuk header = baris 1)
  profesi: string
  kode: string
  nama: string
  detail: string | null
  kategori: string | null
  urutan: number | null
}

export type HasilCsv = {
  delimiter: string
  jumlahKolom: number
  barisData: number
  rows: BarisTemplateCsv[]
  errors: { baris: number; pesan: string }[]
}

/** Pecah teks CSV menjadi array baris array kolom (RFC4180). */
export function parseCsv(text: string): { delimiter: string; rows: string[][] } {
  // buang BOM
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)

  // deteksi delimiter dari baris pertama (di luar kutipan)
  const barisPertama = text.split(/\r\n|\n|\r/, 1)[0] ?? ''
  const hitung = (d: string) => {
    let n = 0
    let dalamKutip = false
    for (let i = 0; i < barisPertama.length; i++) {
      const c = barisPertama[i]
      if (c === '"') dalamKutip = !dalamKutip
      else if (c === d && !dalamKutip) n++
    }
    return n
  }
  const kandidat: { d: string; n: number }[] = [
    { d: ',', n: hitung(',') },
    { d: ';', n: hitung(';') },
    { d: '\t', n: hitung('\t') },
  ]
  kandidat.sort((a, b) => b.n - a.n)
  const delimiter = kandidat[0].n > 0 ? kandidat[0].d : ','

  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let dalamKutip = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (dalamKutip) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          dalamKutip = false
        }
      } else {
        field += c
      }
      continue
    }
    if (c === '"') {
      dalamKutip = true
    } else if (c === delimiter) {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      field = ''
      rows.push(row)
      row = []
    } else {
      field += c
    }
  }
  // baris terakhir tanpa newline
  row.push(field)
  rows.push(row)

  return { delimiter, rows }
}

const ALIAS: Record<string, string[]> = {
  profesi: ['profesi', 'jenis profesi'],
  kode: ['kode', 'kode kewenangan'],
  nama: ['nama', 'nama kewenangan', 'daftar diagnosa/keterampilan', 'daftar diagnosa / keterampilan', 'tindakan'],
  detail: ['detail', 'rincian', 'sub detail', 'sub-detail'],
  kategori: ['kategori', 'kelompok'],
  urutan: ['urutan', 'no', 'no.', 'nomor'],
}

function bersih(s: string): string {
  return s.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Parse CSV menjadi baris template tervalidasi struktur (tanpa cek DB).
 * `profesiValid`: daftar nama profesi yang diizinkan (pencocokan case-insensitive).
 */
export function parseTemplateCsv(text: string, profesiValid: readonly string[]): HasilCsv {
  const { delimiter, rows } = parseCsv(text)

  // buang baris kosong di akhir
  while (rows.length > 0 && rows[rows.length - 1].every((c) => bersih(c) === '')) rows.pop()

  if (rows.length === 0) {
    return { delimiter, jumlahKolom: 0, barisData: 0, rows: [], errors: [{ baris: 1, pesan: 'File CSV kosong' }] }
  }

  // petakan kolom dari header (case-insensitive, alias)
  const headers = rows[0].map((h) => bersih(h).toLowerCase())
  const indeks: Record<string, number> = {}
  for (const [kunci, alias] of Object.entries(ALIAS)) {
    indeks[kunci] = headers.findIndex((h) => alias.includes(h))
  }

  const wajib = ['profesi', 'kode', 'nama'] as const
  const hilang = wajib.filter((k) => indeks[k] < 0)
  if (hilang.length > 0) {
    return {
      delimiter,
      jumlahKolom: headers.length,
      barisData: 0,
      rows: [],
      errors: [
        {
          baris: 1,
          pesan: `Kolom wajib tidak ditemukan di baris header: ${hilang.join(', ')}. Header yang tersedia: ${headers.join(' | ') || '(kosong)'}`,
        },
      ],
    }
  }

  const profesiMap = new Map(profesiValid.map((p) => [bersih(p).toLowerCase(), p]))
  const out: BarisTemplateCsv[] = []
  const errors: { baris: number; pesan: string }[] = []

  for (let i = 1; i < rows.length; i++) {
    const no = i + 1 // 1-based, header = baris 1
    const r = rows[i]
    const profesiRaw = bersih(r[indeks.profesi] ?? '')
    const kode = bersih(r[indeks.kode] ?? '')
    const nama = bersih(r[indeks.nama] ?? '')
    const detailRaw = indeks.detail >= 0 ? bersih(r[indeks.detail] ?? '') : ''
    const kategoriRaw = indeks.kategori >= 0 ? bersih(r[indeks.kategori] ?? '') : ''
    const urutanRaw = indeks.urutan >= 0 ? bersih(r[indeks.urutan] ?? '') : ''

    if (!profesiRaw && !kode && !nama) continue // baris kosong total diabaikan

    if (!profesiRaw) {
      errors.push({ baris: no, pesan: 'Kolom profesi kosong' })
      continue
    }
    const profesi = profesiMap.get(profesiRaw.toLowerCase())
    if (!profesi) {
      errors.push({
        baris: no,
        pesan: `Profesi "${profesiRaw}" tidak dikenal (harus salah satu dari: ${profesiValid.join(', ')})`,
      })
      continue
    }
    if (!kode) {
      errors.push({ baris: no, pesan: 'Kolom kode kosong' })
      continue
    }
    if (kode.length > 100) {
      errors.push({ baris: no, pesan: `Kode terlalu panjang (maks 100 karakter): "${kode.slice(0, 30)}…"` })
      continue
    }
    if (!nama) {
      errors.push({ baris: no, pesan: `Kolom nama kosong pada kode ${kode}` })
      continue
    }
    if (nama.length > 500) {
      errors.push({ baris: no, pesan: `Nama terlalu panjang (maks 500 karakter) pada kode ${kode}` })
      continue
    }

    let urutan: number | null = null
    if (urutanRaw) {
      const n = Number(urutanRaw)
      if (Number.isInteger(n) && n >= 0) urutan = n
    }

    out.push({
      baris: no,
      profesi,
      kode,
      nama,
      detail: detailRaw ? detailRaw.slice(0, 2000) : null,
      kategori: kategoriRaw ? kategoriRaw.slice(0, 200) : null,
      urutan,
    })
  }

  return { delimiter, jumlahKolom: headers.length, barisData: rows.length - 1, rows: out, errors }
}

/** Contoh isi CSV untuk tombol "Unduh contoh". */
export const CONTOH_CSV = [
  'profesi;kode;nama;detail;kategori',
  'Apoteker;APT.001;Pelayanan Farmasi Klinis (Rawat Jalan);;Layanan Farmasi',
  'Apoteker;APT.002;"Dosis dan administrasi obat; termasuk obat berisiko tinggi";;Layanan Farmasi',
  'Ahli Radiologi;RAD.001;Radiologi Diagnostik Umum;;Pelayanan Radiologi',
].join('\n')
