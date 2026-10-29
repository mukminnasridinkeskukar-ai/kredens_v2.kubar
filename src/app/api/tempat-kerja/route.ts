import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireApiRole } from '@/lib/role-guard'
import { requireSession } from '@/lib/api-guard'

/**
 * Master data Tempat Kerja / Fasyankes.
 *
 * GET    — semua akun terautentikasi (sumber opsi dropdown biodata asesi,
 *          pendaftaran pimpinan, dan kelola akun). `?semua=1` menyertakan
 *          yang nonaktif (dipakai superadmin).
 * POST   — SUPERADMIN: tambah { nama, alamat? }
 * PATCH  — SUPERADMIN: ubah { id, nama?, alamat?, aktif? }
 * DELETE — SUPERADMIN: hapus { id } (ditolak bila masih dipakai akun/asesi)
 */

export async function GET(req: NextRequest) {
  const guard = await requireSession()
  if (!guard.ok) return guard.response

  const semua = req.nextUrl.searchParams.get('semua') === '1'
  const daftar = await db.tempatKerja.findMany({
    where: semua ? {} : { aktif: true },
    orderBy: { nama: 'asc' },
    select: {
      id: true,
      nama: true,
      alamat: true,
      aktif: true,
      _count: { select: { asesi: true, pengguna: true } },
    },
  })
  return NextResponse.json({ items: daftar })
}

export async function POST(req: NextRequest) {
  const guard = await requireApiRole(['SUPERADMIN'])
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  const nama = String(body?.nama ?? '').trim()
  const alamat = String(body?.alamat ?? '').trim()
  if (nama.length < 3) {
    return NextResponse.json({ error: 'Nama tempat kerja minimal 3 karakter.' }, { status: 400 })
  }
  if (nama.length > 150) {
    return NextResponse.json({ error: 'Nama tempat kerja maksimal 150 karakter.' }, { status: 400 })
  }

  const sudah = await db.tempatKerja.findUnique({ where: { nama } })
  if (sudah) {
    return NextResponse.json({ error: `Tempat kerja "${nama}" sudah terdaftar.` }, { status: 409 })
  }

  const tk = await db.tempatKerja.create({
    data: { nama, alamat: alamat || null },
  })
  return NextResponse.json({ ok: true, item: tk }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const guard = await requireApiRole(['SUPERADMIN'])
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  const id = String(body?.id ?? '')
  if (!id) return NextResponse.json({ error: 'ID tempat kerja wajib disertakan.' }, { status: 400 })

  const tk = await db.tempatKerja.findUnique({ where: { id } })
  if (!tk) return NextResponse.json({ error: 'Tempat kerja tidak ditemukan.' }, { status: 404 })

  const data: { nama?: string; alamat?: string | null; aktif?: boolean } = {}

  if (body?.nama !== undefined) {
    const nama = String(body.nama).trim()
    if (nama.length < 3) {
      return NextResponse.json({ error: 'Nama tempat kerja minimal 3 karakter.' }, { status: 400 })
    }
    if (nama !== tk.nama) {
      const bentrok = await db.tempatKerja.findUnique({ where: { nama } })
      if (bentrok) {
        return NextResponse.json({ error: `Nama "${nama}" sudah dipakai entri lain.` }, { status: 409 })
      }
      data.nama = nama
    }
  }
  if (body?.alamat !== undefined) data.alamat = String(body.alamat).trim() || null
  if (body?.aktif !== undefined) data.aktif = Boolean(body.aktif)

  const baru = await db.tempatKerja.update({ where: { id }, data })

  // Jika nama berubah, perbarui juga teks snapshot pada profil asesi dan
  // instansi akun yang terhubung agar tampilan tetap konsisten.
  if (data.nama) {
    await db.asesiProfile.updateMany({ where: { tempatKerjaId: id }, data: { tempatBekerja: data.nama } })
    await db.user.updateMany({ where: { tempatKerjaId: id }, data: { instansi: data.nama } })
    await db.pengajuan.updateMany({
      where: { fasyankes: tk.nama, user: { asesiProfile: { tempatKerjaId: id } } },
      data: { fasyankes: data.nama },
    })
  }

  return NextResponse.json({ ok: true, item: baru })
}

export async function DELETE(req: NextRequest) {
  const guard = await requireApiRole(['SUPERADMIN'])
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  const id = String(body?.id ?? '')
  if (!id) return NextResponse.json({ error: 'ID tempat kerja wajib disertakan.' }, { status: 400 })

  const tk = await db.tempatKerja.findUnique({ where: { id } })
  if (!tk) return NextResponse.json({ error: 'Tempat kerja tidak ditemukan.' }, { status: 404 })

  const [jumlahAsesi, jumlahAkun] = await Promise.all([
    db.asesiProfile.count({ where: { tempatKerjaId: id } }),
    db.user.count({ where: { tempatKerjaId: id } }),
  ])
  if (jumlahAsesi + jumlahAkun > 0) {
    return NextResponse.json(
      {
        error: `Tidak dapat dihapus: masih dipakai ${jumlahAsesi} profil asesi dan ${jumlahAkun} akun. Nonaktifkan bila tidak lagi digunakan.`,
      },
      { status: 400 }
    )
  }

  await db.tempatKerja.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
