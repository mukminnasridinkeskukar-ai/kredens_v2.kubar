import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireApiRole } from '@/lib/role-guard'
import { STATUS_LOGBOOK_SIAP } from '@/lib/constants'

const KODE_DISETUJUI = ['1', '2']

async function muatPengajuanMilikAsesi(pengajuanId: string, userId: string) {
  return db.pengajuan.findFirst({
    where: { id: pengajuanId, userId },
    include: {
      kewenangan: { orderBy: { urutan: 'asc' } },
      rekomendasiTim: { select: { penetapanNomor: true, penetapanBerlakuSampai: true } },
    },
  })
}

/** GET /api/logbook?pengajuanId=&bulan=&tahun=
 * Mengembalikan logbook bulanan (beserta seluruh entri cek list harian)
 * milik asesi untuk satu periode. */
export async function GET(req: NextRequest) {
  const guard = await requireApiRole(['ASESI'])
  if (!guard.ok) return guard.response

  const sp = req.nextUrl.searchParams
  const pengajuanId = sp.get('pengajuanId') ?? ''
  const bulan = Number(sp.get('bulan'))
  const tahun = Number(sp.get('tahun'))
  if (!pengajuanId || !bulan || !tahun) {
    return NextResponse.json({ error: 'pengajuanId, bulan, dan tahun wajib diisi' }, { status: 400 })
  }

  const pengajuan = await muatPengajuanMilikAsesi(pengajuanId, guard.user.id)
  if (!pengajuan) {
    return NextResponse.json({ error: 'Pengajuan tidak ditemukan' }, { status: 404 })
  }

  const logbook = await db.logbookBulanan.findUnique({
    where: { pengajuanId_bulan_tahun: { pengajuanId, bulan, tahun } },
    include: { entri: { orderBy: [{ tanggal: 'asc' }, { createdAt: 'asc' }] } },
  })

  return NextResponse.json({ ok: true, logbook })
}

/** PUT /api/logbook — simpan cek list harian untuk satu tanggal.
 * Body: { pengajuanId, bulan, tahun, tanggal, entri: [{ kewenanganId, jumlahKasus, catatan }] }
 * Seluruh entri pada tanggal tersebut diganti dengan daftar baru. */
export async function PUT(req: NextRequest) {
  const guard = await requireApiRole(['ASESI'])
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => null)
  const pengajuanId: string | undefined = body?.pengajuanId
  const bulan = Number(body?.bulan)
  const tahun = Number(body?.tahun)
  const tanggal: string | undefined = body?.tanggal
  const entri: Array<{ kewenanganId?: string; jumlahKasus?: number; catatan?: string }> =
    Array.isArray(body?.entri) ? body.entri : []

  if (!pengajuanId || !bulan || !tahun || !tanggal) {
    return NextResponse.json(
      { error: 'pengajuanId, bulan, tahun, dan tanggal wajib diisi' },
      { status: 400 }
    )
  }
  if (bulan < 1 || bulan > 12) {
    return NextResponse.json({ error: 'Bulan tidak valid' }, { status: 400 })
  }

  // Tanggal harus berada di dalam periode bulan laporan
  const [y, m] = tanggal.split('-').map(Number)
  if (!y || !m || y !== tahun || m !== bulan) {
    return NextResponse.json(
      { error: 'Tanggal tidak sesuai dengan periode laporan bulanan' },
      { status: 400 }
    )
  }

  const pengajuan = await muatPengajuanMilikAsesi(pengajuanId, guard.user.id)
  if (!pengajuan) {
    return NextResponse.json({ error: 'Pengajuan tidak ditemukan' }, { status: 404 })
  }
  if (!STATUS_LOGBOOK_SIAP.includes(pengajuan.status as (typeof STATUS_LOGBOOK_SIAP)[number])) {
    return NextResponse.json(
      { error: 'Logbook tersedia setelah tim kredensial menetapkan rekomendasi kewenangan' },
      { status: 400 }
    )
  }

  const logbookLama = await db.logbookBulanan.findUnique({
    where: { pengajuanId_bulan_tahun: { pengajuanId, bulan, tahun } },
  })
  if (logbookLama && ['DIAJUKAN', 'DIVERIFIKASI'].includes(logbookLama.status)) {
    return NextResponse.json(
      {
        error:
          logbookLama.status === 'DIAJUKAN'
            ? 'Laporan sudah diajukan dan menunggu verifikasi pimpinan fasyankes'
            : 'Laporan sudah diverifikasi pimpinan fasyankes dan tidak dapat diubah',
      },
      { status: 400 }
    )
  }

  // Validasi kewenangan: harus milik pengajuan ini dan disetujui tim (kode 1/2)
  const disetujui = new Map(
    pengajuan.kewenangan
      .filter((k) => KODE_DISETUJUI.includes(k.kodeRekomendasi ?? ''))
      .map((k) => [k.id, k])
  )
  const dataBersih: Array<{ kewenanganId: string; jumlahKasus: number; catatan: string | null }> = []
  for (const e of entri) {
    if (!e.kewenanganId) continue
    if (!disetujui.has(e.kewenanganId)) {
      return NextResponse.json(
        { error: 'Ada kewenangan yang tidak termasuk daftar yang disetujui tim kredensial' },
        { status: 400 }
      )
    }
    const jumlah = Math.max(0, Math.floor(Number(e.jumlahKasus) || 0))
    dataBersih.push({
      kewenanganId: e.kewenanganId,
      jumlahKasus: jumlah,
      catatan: e.catatan?.trim() || null,
    })
  }

  // Dedup (kalau ada kewenangan dobel pada tanggal sama)
  const unik = new Map<string, (typeof dataBersih)[number]>()
  for (const d of dataBersih) unik.set(d.kewenanganId, d)
  const finalEntri = [...unik.values()]

  const logbook = await db.logbookBulanan.upsert({
    where: { pengajuanId_bulan_tahun: { pengajuanId, bulan, tahun } },
    create: { pengajuanId, bulan, tahun, status: 'DRAFT' },
    update: { status: 'DRAFT' }, // kembali ke draf saat asesi menyunting isi
  })

  // Ganti seluruh entri pada tanggal tersebut
  await db.logbookEntri.deleteMany({
    where: { logbookId: logbook.id, tanggal },
  })
  if (finalEntri.length > 0) {
    await db.logbookEntri.createMany({
      data: finalEntri.map((e) => ({
        logbookId: logbook.id,
        tanggal,
        kewenanganId: e.kewenanganId,
        jumlahKasus: e.jumlahKasus,
        catatan: e.catatan,
      })),
    })
  }

  const hasil = await db.logbookBulanan.findUnique({
    where: { id: logbook.id },
    include: { entri: { orderBy: [{ tanggal: 'asc' }, { createdAt: 'asc' }] } },
  })

  return NextResponse.json({ ok: true, logbook: hasil })
}
