import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireApiRole } from '@/lib/role-guard'
import { JENIS_PROFESI } from '@/lib/constants'
import { parseTemplateCsv } from '@/lib/csv'

const MAX_FILE = 1 * 1024 * 1024 // 1 MB
const MAX_ROWS = 20000

// GET /api/template-kewenangan                -> rekap per profesi
// GET /api/template-kewenangan?profesi=X      -> seluruh item satu profesi
export async function GET(req: NextRequest) {
  const guard = await requireApiRole(['SUPERADMIN'])
  if (!guard.ok) return guard.response

  const profesi = req.nextUrl.searchParams.get('profesi')?.trim() || ''
  if (profesi) {
    const items = await db.kewenanganTemplate.findMany({
      where: { profesi },
      orderBy: { urutan: 'asc' },
      select: { id: true, kode: true, nama: true, detail: true, kategori: true, urutan: true },
    })
    return NextResponse.json({ profesi, total: items.length, items })
  }

  const group = await db.kewenanganTemplate.groupBy({
    by: ['profesi'],
    _count: true,
    orderBy: { profesi: 'asc' },
  })
  return NextResponse.json({
    total: group.reduce((a, g) => a + g._count, 0),
    profesiValid: JENIS_PROFESI,
    rekap: group.map((g) => ({ profesi: g.profesi, jumlah: g._count })),
  })
}

// POST /api/template-kewenangan — impor massal CSV (multipart: file)
export async function POST(req: NextRequest) {
  const guard = await requireApiRole(['SUPERADMIN'])
  if (!guard.ok) return guard.response

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Kirim file CSV melalui form-data dengan field "file"' }, { status: 400 })
  }
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Field "file" (CSV) wajib diunggah' }, { status: 400 })
  }
  if (file.size > MAX_FILE) {
    return NextResponse.json({ error: 'Ukuran file melebihi 1 MB' }, { status: 400 })
  }

  const text = await file.text()
  const hasil = parseTemplateCsv(text, JENIS_PROFESI)

  if (hasil.errors.length > 0) {
    return NextResponse.json(
      {
        error: `CSV ditolak: ${hasil.errors.length} baris bermasalah (perbaiki lalu unggah ulang).`,
        delimiter: hasil.delimiter,
        barisData: hasil.barisData,
        errors: hasil.errors.slice(0, 20),
        totalErrors: hasil.errors.length,
      },
      { status: 400 }
    )
  }
  if (hasil.rows.length === 0) {
    return NextResponse.json({ error: 'Tidak ada baris data yang bisa dibaca dari CSV' }, { status: 400 })
  }
  if (hasil.rows.length > MAX_ROWS) {
    return NextResponse.json({ error: `Terlalu banyak baris (maks ${MAX_ROWS})` }, { status: 400 })
  }

  // urutan bawaan: lanjut dari urutan terakhir tiap profesi bila kolom urutan kosong
  const terakhir = await db.kewenanganTemplate.groupBy({
    by: ['profesi'],
    _max: { urutan: true },
  })
  const urutanProfesi = new Map(terakhir.map((t) => [t.profesi, t._max.urutan ?? 0]))

  // Lewati baris yang (profesi, kode)-nya sudah ada di DB maupun yang berulang
  // di dalam file itu sendiri — createMany({skipDuplicates}) tidak didukung
  // SQLite, jadi duplikat disaring manual terlebih dahulu.
  const profesisFile = Array.from(new Set(hasil.rows.map((r) => r.profesi)))
  const sudahAda = await db.kewenanganTemplate.findMany({
    where: { profesi: { in: profesisFile } },
    select: { profesi: true, kode: true },
  })
  const kunciAda = new Set(sudahAda.map((s) => `${s.profesi}|${s.kode}`))
  const baru: typeof hasil.rows = []
  for (const r of hasil.rows) {
    const kunci = `${r.profesi}|${r.kode}`
    if (kunciAda.has(kunci)) continue
    kunciAda.add(kunci)
    baru.push(r)
  }

  let masuk = { count: 0 }
  if (baru.length > 0) {
    masuk = await db.kewenanganTemplate.createMany({
      data: baru.map((r, i) => ({
        profesi: r.profesi,
        kode: r.kode,
        nama: r.nama,
        detail: r.detail,
        kategori: r.kategori,
        urutan: r.urutan ?? (urutanProfesi.get(r.profesi) ?? 0) + 1 + i,
      })),
    })
  }

  const rekap = await db.kewenanganTemplate.groupBy({ by: ['profesi'], _count: true, orderBy: { profesi: 'asc' } })
  return NextResponse.json({
    ok: true,
    dibaca: hasil.barisData,
    masuk: masuk.count,
    duplikat: hasil.rows.length - masuk.count,
    delimiter: hasil.delimiter,
    rekap: rekap.map((g) => ({ profesi: g.profesi, jumlah: g._count })),
  })
}

// DELETE /api/template-kewenangan?profesi=X — hapus seluruh template satu profesi
export async function DELETE(req: NextRequest) {
  const guard = await requireApiRole(['SUPERADMIN'])
  if (!guard.ok) return guard.response

  const profesi = req.nextUrl.searchParams.get('profesi')?.trim() || ''
  if (!profesi) {
    return NextResponse.json({ error: 'Parameter profesi wajib diisi' }, { status: 400 })
  }
  const hapus = await db.kewenanganTemplate.deleteMany({ where: { profesi } })
  return NextResponse.json({ ok: true, terhapus: hapus.count })
}
