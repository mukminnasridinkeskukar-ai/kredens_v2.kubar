import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/api-guard'

// GET /api/kewenangan-template?profesi=Perawat
// Tanpa param `profesi`: otomatis memakai jenisProfesi pada Riwayat Hidup
// (AsesiProfile) milik pengguna yang sedang login.
// Daftar profesi bersifat dinamis dari tabel KewenanganTemplate, sehingga
// profesi hasil unggahan Superadmin (CSV) otomatis ikut tersedia.
export async function GET(req: NextRequest) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response

  const param = req.nextUrl.searchParams.get('profesi')?.trim() || ''

  let profesi = param
  if (!profesi) {
    const profile = await db.asesiProfile.findUnique({
      where: { userId: guard.session.user.id },
      select: { jenisProfesi: true },
    })
    profesi = profile?.jenisProfesi ?? ''
  }

  if (!profesi) {
    return NextResponse.json({
      profesi: null,
      sedia: false,
      total: 0,
      items: [],
      pesan: 'Jenis profesi pada Riwayat Hidup belum diisi. Lengkapi biodata terlebih dahulu.',
    })
  }

  const items = await db.kewenanganTemplate.findMany({
    where: { profesi },
    orderBy: { urutan: 'asc' },
    select: { kode: true, nama: true, detail: true, kategori: true },
  })

  if (items.length === 0) {
    return NextResponse.json({
      profesi,
      sedia: false,
      total: 0,
      items: [],
      pesan: `Template kewenangan klinis untuk profesi ${profesi} belum tersedia — daftar dapat ditulis manual. Superadmin dapat mengunggahnya melalui menu Template Kewenangan.`,
    })
  }

  return NextResponse.json({ profesi, sedia: true, total: items.length, items })
}
