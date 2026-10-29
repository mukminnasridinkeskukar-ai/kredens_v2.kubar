import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  PageNumber,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import { DataTemplateSpk, TITIK_NAMA, TITIK_TANGGAL, TITIK_NOMOR, fmtTanggal } from './template-spk'

/**
 * Contoh Template Surat Penugasan Klinis (v1.3.4) — versi WORD (DOCX).
 *
 * Isi surat identik dengan versi PDF (template-spk.ts) — sheet "SURAT
 * PENUGASAN KLINIS" dengan kalimat yang telah dilengkapi — tetapi dalam
 * format .docx agar pimpinan fasyankes dapat MENGEDIT langsung di
 * Microsoft Word / WPS / LibreOffice sebelum mencetak.
 *
 * Perbedaan utama vs PDF: bagian paling atas diberi NOTIFIKASI "KOP
 * FASYANKES" — kotak putus-putus berisi instruksi mengganti kotak itu
 * dengan kop surat fasyankes (logo, nama instansi, alamat) sebelum surat
 * digunakan. Pada versi Word ini memang wajar karena setiap fasyankes
 * punya kop sendiri; kop final dipasang saat mengedit.
 *
 * Memakai paket `docx` (murni JS, tanpa binary native) — aman di runtime
 * serverless Vercel.
 */

const FONT = 'Times New Roman'

/** Ukuran half-point: 22 = 11pt (isi), 28 = 14pt (judul), 18 = 9pt (catatan). */
const UKURAN_ISI = 22
const UKURAN_JUDUL = 28
const UKURAN_KECIL = 18

/** Baris paragraf sederhana dengan spasi setelah 6pt. */
function par(
  teks: string,
  opsi: {
    align?: (typeof AlignmentType)[keyof typeof AlignmentType]
    tebal?: boolean
    miring?: boolean
    ukuran?: number
    warna?: string
    setelah?: number
  } = {},
): Paragraph {
  return new Paragraph({
    alignment: opsi.align ?? AlignmentType.LEFT,
    spacing: { after: opsi.setelah ?? 120 },
    children: [
      new TextRun({
        text: teks,
        bold: opsi.tebal,
        italics: opsi.miring,
        size: opsi.ukuran ?? UKURAN_ISI,
        color: opsi.warna ?? '1A1A1F',
        font: FONT,
      }),
    ],
  })
}

/** Tabel 2 kolom "Label  : nilai" tanpa garis (borderless). */
function blokIdentitas(
  baris: Array<{ label: string; nilai: string }>,
): Table {
  const TANPA_GARIS = {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  }
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TANPA_GARIS,
    rows: baris.map(
      ({ label, nilai }) =>
        new TableRow({
          children: [
            new TableCell({
              borders: TANPA_GARIS,
              width: { size: 32, type: WidthType.PERCENTAGE },
              children: [par(label, { setelah: 40 })],
            }),
            new TableCell({
              borders: TANPA_GARIS,
              width: { size: 4, type: WidthType.PERCENTAGE },
              children: [par(':', { setelah: 40 })],
            }),
            new TableCell({
              borders: TANPA_GARIS,
              width: { size: 64, type: WidthType.PERCENTAGE },
              children: [par(nilai, { setelah: 40 })],
            }),
          ],
        }),
    ),
  })
}

export async function buatDocxTemplateSpk(
  data: DataTemplateSpk,
): Promise<Buffer> {
  const uptd = data.uptd?.trim() || '..........................................'
  const noKetetapan = data.nomorKetetapan?.trim() || TITIK_NOMOR
  const tglKetetapan = fmtTanggal(data.tanggalKetetapan) ?? TITIK_TANGGAL
  const berlaku = fmtTanggal(data.berlakuSampai) ?? TITIK_TANGGAL
  const tglSpk = fmtTanggal(data.tanggalSpk) ?? TITIK_TANGGAL
  const namaTtd = data.kepalaUptd?.trim() || TITIK_NAMA
  const nipTtd = data.nipKepala?.trim() || TITIK_NAMA

  const doc = new Document({
    creator: 'Dinas Kesehatan Kabupaten Kutai Barat',
    title: `Contoh Template Surat Penugasan Klinis — ${data.kode}`,
    subject: 'Contoh Template Surat Penugasan Klinis (SPK) KREDENS — Word',
    description:
      'Contoh template SPK dalam format Word dengan notifikasi KOP FASYANKES di bagian atas.',
    styles: {
      default: {
        document: { run: { font: FONT, size: UKURAN_ISI } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: [
                      `KREDENS — Contoh Template SPK (Word) · ${data.kode} · Halaman `,
                      PageNumber.CURRENT,
                    ],
                    size: 16,
                    color: '8A8D92',
                    font: FONT,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // ===== NOTIFIKASI KOP FASYANKES (kotak putus-putus di bagian atas) =====
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.DASHED, size: 8, color: '9A9DA3' },
              bottom: { style: BorderStyle.DASHED, size: 8, color: '9A9DA3' },
              left: { style: BorderStyle.DASHED, size: 8, color: '9A9DA3' },
              right: { style: BorderStyle.DASHED, size: 8, color: '9A9DA3' },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 120, after: 60 },
                        children: [
                          new TextRun({
                            text: 'KOP FASYANKES',
                            bold: true,
                            size: UKURAN_JUDUL,
                            color: '4A4D53',
                            font: FONT,
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 120 },
                        children: [
                          new TextRun({
                            text:
                              'Ganti kotak ini dengan kop surat fasyankes Anda (logo, nama instansi, alamat, telepon, email) sebelum surat digunakan.',
                            italics: true,
                            size: UKURAN_KECIL,
                            color: '6B6E74',
                            font: FONT,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          par('', { setelah: 200 }),

          // ===== Kepala surat =====
          par('SURAT PENUGASAN KLINIS', {
            align: AlignmentType.CENTER,
            tebal: true,
            ukuran: UKURAN_JUDUL,
            setelah: 60,
          }),
          par(`Nomor : ${data.nomorSpk?.trim() || TITIK_NOMOR}`, {
            align: AlignmentType.CENTER,
            setelah: 80,
          }),
          par(
            'Contoh template — lengkapi bagian bertitik, tandatangani & cap, pindai, lalu unggah pada panel Unggah Dokumen SPK.',
            {
              align: AlignmentType.CENTER,
              miring: true,
              ukuran: UKURAN_KECIL,
              warna: '6B6E74',
              setelah: 240,
            },
          ),

          // ===== Pemberi tugas =====
          par('Yang bertanda tangan di bawah ini:'),
          blokIdentitas([
            { label: 'Nama', nilai: data.kepalaUptd?.trim() || TITIK_NAMA },
            { label: 'NIP/NIK', nilai: data.nipKepala?.trim() || TITIK_NAMA },
            {
              label: 'Jabatan',
              nilai: data.uptd
                ? `Kepala UPTD ${data.uptd}`
                : 'Kepala UPTD ..............................',
            },
          ]),
          par('selanjutnya disebut Pemberi Tugas.', { setelah: 200 }),

          // ===== Penerima tugas =====
          par('Dengan ini memberikan Penugasan Klinis kepada:'),
          blokIdentitas([
            { label: 'Nama', nilai: data.penerima.nama?.trim() || TITIK_NAMA },
            { label: 'NIP/NIK', nilai: data.penerima.nip?.trim() || TITIK_NAMA },
            {
              label: 'Jenis Tenaga Kesehatan',
              nilai: data.penerima.profesi?.trim() || TITIK_NAMA,
            },
          ]),
          par('selanjutnya disebut Penerima Tugas.', { setelah: 200 }),

          // ===== Isi penugasan (kalimat sheet dilengkapi) =====
          par(
            `Untuk memberikan pelayanan kesehatan di UPTD ${uptd} sesuai dengan surat ketetapan kewenangan klinis nomor ${noKetetapan} tanggal ${tglKetetapan}.`,
            { align: AlignmentType.JUSTIFIED, setelah: 200 },
          ),
          par(
            `Penugasan klinis ini berlaku sampai dengan tanggal ${berlaku} atau waktu lain dalam hal terjadi perubahan kewenangan klinis sesuai dengan keputusan Kepala Dinas Kesehatan Kabupaten Kutai Barat.`,
            { align: AlignmentType.JUSTIFIED, setelah: 360 },
          ),

          // ===== Tanda tangan (blok kanan, tata naskah dinas) =====
          par(`Sendawar, ${tglSpk}`, { align: AlignmentType.RIGHT, setelah: 20 }),
          par(
            data.uptd ? `Kepala UPTD ${data.uptd}` : 'Kepala UPTD ..............................',
            { align: AlignmentType.RIGHT, setelah: 20 },
          ),
          // Ruang kosong untuk tanda tangan & cap
          par('', { setelah: 0 }),
          par('', { setelah: 0 }),
          par('', { setelah: 0 }),
          par('', { setelah: 60 }),
          par('(tanda tangan dan cap dinas)', {
            align: AlignmentType.RIGHT,
            ukuran: UKURAN_KECIL,
            warna: '6B6E74',
            setelah: 60,
          }),
          par(namaTtd, { align: AlignmentType.RIGHT, tebal: true, setelah: 20 }),
          par(`NIP/NIK. ${nipTtd}`, { align: AlignmentType.RIGHT, setelah: 0 }),
        ],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  return buffer
}
