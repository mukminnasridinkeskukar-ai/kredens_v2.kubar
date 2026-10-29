import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { requireApiRole } from '@/lib/role-guard'
import { hashPassword, enkripsiSandi, dekripsiSandi } from '@/lib/password'
import {
  ROLES,
  ROLE_LABELS,
  JENIS_PROFESI,
  PERAN_EKSTRA,
  PERAN_EKSTRA_LABELS,
  susunPeranEkstra,
  uraikanPeranEkstra,
} from '@/lib/constants'

/**
 * Manajemen penuh akun untuk SUPERADMIN (akses penuh semua akun).
 *
 * GET    /api/superadmin/akun            — daftar seluruh akun + jumlah pengajuan
 *        ?sandi=1                        — sertakan sandi (didekripsi) tiap akun
 *        v1.3.0: HANYA superadmin yang dapat melihat username & sandi seluruh
 *        akun — route ini ber-guard SUPERADMIN, peran lain ditolak 403.
 * PATCH  { id, aksi, ... }     — aksi: aktifkan | nonaktifkan | peran | data
 *                                | lihat-sandi (v1.3.0) | username (v1.3.0)
 *                                | fungsi (v2.1: fungsi tambahan akun)
 * POST   { id, sandiBaru? }    — reset kata sandi (v1.3.0: salinan terenkripsi
 *                                ikut diperbarui sehingga dapat dilihat lagi)
 * DELETE ?id=                  — hapus akun permanen
 *
 * Perlindungan diri: superadmin tidak dapat menonaktifkan, mengganti peran,
 * username, sandi, atau menghapus akunnya sendiri — mencegah terkunci dari
 * sistem. Akun superadmin lain tetap dapat dikelola.
 */

const ALFABET_SANDI = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'

function buatSandiAcak(panjang = 10): string {
  const bytes = randomBytes(panjang)
  let sandi = ''
  for (let i = 0; i < panjang; i++) sandi += ALFABET_SANDI[bytes[i] % ALFABET_SANDI.length]
  return sandi
}

function labelPeran(role: string): string {
  return ROLE_LABELS[role] ?? role
}

export async function GET(req: NextRequest) {
  const guard = await requireApiRole(['SUPERADMIN'])
  if (!guard.ok) return guard.response

  const denganSandi = req.nextUrl.searchParams.get('sandi') === '1'
  const daftar = await db.user.findMany({
    orderBy: [{ isActive: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      nama: true,
      email: true,
      role: true,
      peranEkstra: true,
      profesi: true,
      nip: true,
      jabatan: true,
      instansi: true,
      telepon: true,
      isActive: true,
      createdAt: true,
      tempatKerjaId: true,
      tempatKerja: { select: { nama: true } },
      sandiTersimpan: true,
      _count: { select: { pengajuan: true } },
    },
  })

  if (denganSandi) {
    console.log(
      `[audit] ${new Date().toISOString()} — superadmin ${guard.user.email} MELIHAT SELURUH SANDI (${daftar.length} akun)`,
    )
  }

  const statistik = {
    total: daftar.length,
    menungguVerifikasi: daftar.filter((u) => !u.isActive).length,
    superadmin: daftar.filter((u) => u.role === 'SUPERADMIN').length,
    perPeran: daftar.reduce<Record<string, number>>((acc, u) => {
      acc[u.role] = (acc[u.role] ?? 0) + 1
      return acc
    }, {}),
  }

  return NextResponse.json({
    daftar: daftar.map((u) => {
      const { sandiTersimpan, ...baris } = u
      const sandi = denganSandi ? dekripsiSandi(sandiTersimpan) : null
      return {
        ...baris,
        // salinan terenkripsi TIDAK PERNAH dikirim ke klien mentah
        sandiAda: Boolean(sandiTersimpan),
        ...(denganSandi ? { sandi } : {}),
      }
    }),
    statistik,
  })
}

export async function PATCH(req: NextRequest) {
  const guard = await requireApiRole(['SUPERADMIN'])
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  const id = String(body?.id ?? '')
  const aksi = String(body?.aksi ?? '')
  if (!id || !aksi) {
    return NextResponse.json({ error: 'ID akun dan aksi wajib disertakan.' }, { status: 400 })
  }

  const target = await db.user.findUnique({
    where: { id },
    include: { _count: { select: { pengajuan: true } } },
  })
  if (!target) return NextResponse.json({ error: 'Akun tidak ditemukan.' }, { status: 404 })

  const sendiri = id === guard.user.id

  if (aksi === 'aktifkan') {
    if (target.isActive) {
      return NextResponse.json({ error: 'Akun ini sudah aktif.' }, { status: 400 })
    }
    await db.user.update({ where: { id }, data: { isActive: true } })
    return NextResponse.json({
      ok: true,
      pesan: `Akun ${target.nama} diaktifkan dan dapat langsung masuk ke aplikasi.`,
    })
  }

  if (aksi === 'nonaktifkan') {
    if (sendiri) {
      return NextResponse.json(
        { error: 'Anda tidak dapat menonaktifkan akun sendiri.' },
        { status: 400 }
      )
    }
    if (!target.isActive) {
      return NextResponse.json({ error: 'Akun ini sudah nonaktif.' }, { status: 400 })
    }
    await db.user.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({
      ok: true,
      pesan: `Akun ${target.nama} dinonaktifkan. Sesi aktifnya otomatis dicabut dan tidak dapat masuk sampai diaktifkan kembali.`,
    })
  }

  if (aksi === 'peran') {
    if (sendiri) {
      return NextResponse.json(
        { error: 'Peran akun sendiri tidak dapat diubah dari sini — gunakan akun superadmin lain bila diperlukan.' },
        { status: 400 }
      )
    }
    const peran = String(body?.role ?? '')
    if (!(ROLES as readonly string[]).includes(peran)) {
      return NextResponse.json({ error: 'Peran tidak dikenal.' }, { status: 400 })
    }
    if (peran === target.role) {
      return NextResponse.json({ error: 'Akun ini sudah memiliki peran tersebut.' }, { status: 400 })
    }
    await db.user.update({ where: { id }, data: { role: peran } })
    return NextResponse.json({
      ok: true,
      pesan: `Peran ${target.nama} diubah dari ${labelPeran(target.role)} menjadi ${labelPeran(peran)}.`,
    })
  }

  // v2.1 — atur fungsi tambahan akun (multi-fungsi): Asesor, Pimpinan
  // Fasyankes, dan/atau Ketua Tim Kredensial di samping peran utamanya.
  if (aksi === 'fungsi') {
    if (sendiri) {
      return NextResponse.json(
        { error: 'Fungsi akun sendiri diatur oleh superadmin lain untuk keamanan.' },
        { status: 400 }
      )
    }
    const daftar = Array.isArray(body?.fungsi) ? body.fungsi.map(String) : []
    const tidakDikenal = daftar.filter((f) => !(PERAN_EKSTRA as readonly string[]).includes(f))
    if (tidakDikenal.length > 0) {
      return NextResponse.json(
        { error: `Fungsi tambahan tidak dikenal: ${tidakDikenal.join(', ')}` },
        { status: 400 }
      )
    }
    if (daftar.includes('ASESOR') && target.role === 'ASESOR') {
      return NextResponse.json(
        { error: 'Akun ini sudah berperan sebagai Asesor — tidak perlu fungsi tambahan yang sama.' },
        { status: 400 }
      )
    }
    if (daftar.includes('PIMPINAN_FASYANKES') && target.role === 'PIMPINAN_FASYANKES') {
      return NextResponse.json(
        { error: 'Akun ini sudah berperan sebagai Pimpinan Fasyankes — tidak perlu fungsi tambahan yang sama.' },
        { status: 400 }
      )
    }
    if (daftar.includes('KETUA_TIM_KREDENSIAL') && target.role === 'KETUA_TIM_KREDENSIAL') {
      return NextResponse.json(
        { error: 'Akun ini sudah berperan sebagai Ketua Tim Kredensial — tidak perlu fungsi tambahan yang sama.' },
        { status: 400 }
      )
    }
    const nilai = susunPeranEkstra(daftar)
    await db.user.update({ where: { id }, data: { peranEkstra: nilai } })
    console.log(
      `[audit] ${new Date().toISOString()} — superadmin ${guard.user.email} mengatur fungsi tambahan akun ${target.email}: ${nilai ?? '(kosong)'}`,
    )
    const labelFungsi = uraikanPeranEkstra(nilai).map((r) => PERAN_EKSTRA_LABELS[r] ?? r)
    return NextResponse.json({
      ok: true,
      pesan: labelFungsi.length > 0
        ? `Fungsi tambahan ${target.nama}: ${labelFungsi.join(', ')}. Menu fungsi tambahan langsung tampil di akunnya tanpa login ulang.`
        : `Fungsi tambahan ${target.nama} dihapus — akun kembali menjalankan peran utamanya saja.`,
    })
  }

  if (aksi === 'data') {
    const data: Record<string, string | null> = {}
    const teks: Array<[string, string, number]> = [
      ['nama', 'Nama', 100],
      ['nip', 'NIP', 40],
      ['jabatan', 'Jabatan', 120],
      ['instansi', 'Instansi', 150],
      ['telepon', 'Telepon', 30],
    ]
    for (const [kolom, label, maks] of teks) {
      if (kolom in body) {
        const nilai = typeof body[kolom] === 'string' ? (body[kolom] as string).trim() : ''
        if (nilai.length > maks) {
          return NextResponse.json({ error: `${label} maksimal ${maks} karakter.` }, { status: 400 })
        }
        data[kolom] = nilai || null
      }
    }
    if ('nama' in body && !data.nama) {
      return NextResponse.json({ error: 'Nama tidak boleh kosong.' }, { status: 400 })
    }

    // Tempat kerja (fasyankes) — khusus relevan untuk akun Pimpinan Fasyankes:
    // menghubungkan akun ke master TempatKerja agar wewenangnya tepat.
    if ('tempatKerjaId' in body) {
      const tkId = String(body.tempatKerjaId ?? '').trim()
      if (tkId) {
        const tk = await db.tempatKerja.findUnique({ where: { id: tkId } })
        if (!tk) {
          return NextResponse.json({ error: 'Tempat kerja tidak ditemukan.' }, { status: 400 })
        }
        data.tempatKerjaId = tk.id
        // Snapshot nama fasyankes pada instansi akun agar tampilan konsisten
        data.instansi = tk.nama
      } else {
        data.tempatKerjaId = null
      }
    }

    // v2.1 — profesi ketua tim kredensial: pembagian tim berdasarkan profesi.
    // Ketua tim dengan profesi hanya menangani pengajuan asesi profesi yang sama.
    if ('profesi' in body) {
      const prof = String(body.profesi ?? '').trim()
      if (prof) {
        if (!(JENIS_PROFESI as readonly string[]).includes(prof)) {
          return NextResponse.json({ error: 'Profesi tidak dikenal.' }, { status: 400 })
        }
        data.profesi = prof
      } else {
        data.profesi = null
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Tidak ada data yang diubah.' }, { status: 400 })
    }
    await db.user.update({ where: { id }, data })
    return NextResponse.json({ ok: true, pesan: `Data akun ${target.nama} diperbarui.` })
  }

  // v1.3.0 — lihat sandi satu akun (didekripsi dari salinan terenkripsi).
  if (aksi === 'lihat-sandi') {
    const sandi = dekripsiSandi(target.sandiTersimpan)
    console.log(
      `[audit] ${new Date().toISOString()} — superadmin ${guard.user.email} melihat sandi akun ${target.email}`,
    )
    if (!sandi) {
      return NextResponse.json({
        ok: true,
        sandi: null,
        pesan: 'Sandi akun ini belum tersimpan (akun lama/sandi non-demo). Gunakan Reset Sandi — setelah direset, sandi baru otomatis dapat dilihat di sini.',
      })
    }
    return NextResponse.json({ ok: true, sandi })
  }

  // v1.3.0 — ganti username (email masuk) milik akun lain.
  if (aksi === 'username') {
    if (sendiri) {
      return NextResponse.json(
        { error: 'Username akun sendiri diubah dari menu Akun Saya.' },
        { status: 400 }
      )
    }
    const baru = String(body?.email ?? '').trim().toLowerCase()
    if (!baru) {
      return NextResponse.json({ error: 'Username baru wajib diisi.' }, { status: 400 })
    }
    if (baru.length < 5 || baru.length > 120) {
      return NextResponse.json({ error: 'Username harus 5–120 karakter.' }, { status: 400 })
    }
    if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(baru)) {
      return NextResponse.json(
        { error: 'Format username belum benar — gunakan format email, contoh: nama@kredens.go.id' },
        { status: 400 }
      )
    }
    if (baru === target.email) {
      return NextResponse.json({ error: 'Username ini sudah milik akun tersebut.' }, { status: 400 })
    }
    const bentrok = await db.user.findUnique({ where: { email: baru }, select: { id: true } })
    if (bentrok) {
      return NextResponse.json(
        { error: `Username "${baru}" sudah dipakai akun lain.` },
        { status: 400 }
      )
    }
    await db.user.update({ where: { id }, data: { email: baru } })
    console.log(
      `[audit] ${new Date().toISOString()} — superadmin ${guard.user.email} mengubah username "${target.email}" menjadi "${baru}"`,
    )
    return NextResponse.json({
      ok: true,
      pesan: `Username ${target.nama} diubah: ${target.email} → ${baru}. Pengguna harus masuk memakai username baru tersebut.`,
    })
  }

  return NextResponse.json({ error: 'Aksi tidak dikenal.' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const guard = await requireApiRole(['SUPERADMIN'])
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  const id = String(body?.id ?? '')
  if (!id) return NextResponse.json({ error: 'ID akun wajib disertakan.' }, { status: 400 })
  if (id === guard.user.id) {
    return NextResponse.json(
      { error: 'Untuk mengganti sandi sendiri, gunakan menu Akun Saya → Keamanan.' },
      { status: 400 }
    )
  }

  const target = await db.user.findUnique({ where: { id } })
  if (!target) return NextResponse.json({ error: 'Akun tidak ditemukan.' }, { status: 404 })

  const sandiBaru =
    typeof body?.sandiBaru === 'string' && body.sandiBaru.trim()
      ? body.sandiBaru.trim()
      : buatSandiAcak()
  if (sandiBaru.length < 8) {
    return NextResponse.json({ error: 'Kata sandi baru minimal 8 karakter.' }, { status: 400 })
  }

  await db.user.update({
    where: { id },
    data: { passwordHash: hashPassword(sandiBaru), sandiTersimpan: enkripsiSandi(sandiBaru) },
  })
  console.log(
    `[audit] ${new Date().toISOString()} — superadmin ${guard.user.email} MERESET sandi akun ${target.email}`,
  )
  return NextResponse.json({
    ok: true,
    pesan: `Kata sandi ${target.nama} (${target.email}) telah direset. Sandi baru juga tersimpan terenkripsi dan dapat dilihat kapan saja melalui tombol lihat sandi.`,
    sandiBaru,
  })
}

export async function DELETE(req: NextRequest) {
  const guard = await requireApiRole(['SUPERADMIN'])
  if (!guard.ok) return guard.response

  const id = req.nextUrl.searchParams.get('id') ?? ''
  if (!id) return NextResponse.json({ error: 'ID akun wajib disertakan.' }, { status: 400 })
  if (id === guard.user.id) {
    return NextResponse.json({ error: 'Anda tidak dapat menghapus akun sendiri.' }, { status: 400 })
  }

  const target = await db.user.findUnique({
    where: { id },
    include: { _count: { select: { pengajuan: true } } },
  })
  if (!target) return NextResponse.json({ error: 'Akun tidak ditemukan.' }, { status: 404 })

  const jumlahPengajuan = target._count.pengajuan
  await db.user.delete({ where: { id } })

  return NextResponse.json({
    ok: true,
    pesan:
      jumlahPengajuan > 0
        ? `Akun ${target.nama} dihapus permanen beserta ${jumlahPengajuan} pengajuannya (termasuk seluruh riwayat biodata, penilaian, dan dokumen).`
        : `Akun ${target.nama} (${target.email}) dihapus permanen.`,
  })
}
