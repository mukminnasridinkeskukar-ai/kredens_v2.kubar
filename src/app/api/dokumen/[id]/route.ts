import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireApiRole } from '@/lib/role-guard'
import { responsDokumen } from '@/lib/dokumen'
import { ambilWewenangPimpinan, pimpinanBolehAkses } from '@/lib/wewenang'

/**
 * GET /api/dokumen/[id] — unduh / lihat dokumen terunggah (SPK atau RKK).
 *
 * Yang berhak:
 *  - Asesi pemilik pengajuan;
 *  - Staf Dinkes (Operator, Ketua Tim, Mitra Bestari) dan Kepala Dinas;
 *  - Pimpinan fasyankes yang wewenangnya cocok dengan fasyankes asesi;
 *  - Superadmin (akses penuh).
 *
 * Query `?unduh=1` memaksa unduhan; tanpa itu dokumen tampil inline
 * (dapat dibuka langsung di tab browser).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiRole([
    'ASESI',
    'OPERATOR_KREDENSIAL',
    'KETUA_TIM_KREDENSIAL',
    'MITRA_BESTARI',
    'KEPALA_DINAS_KESEHATAN',
    'PIMPINAN_FASYANKES',
  ])
  if (!guard.ok) return guard.response

  const { id } = await params
  const dokumen = await db.dokumenPengajuan.findUnique({
    where: { id },
    select: {
      namaFile: true,
      tipeFile: true,
      data: true,
      jenis: true,
      pengajuan: {
        select: {
          userId: true,
          fasyankes: true,
          user: { select: { asesiProfile: { select: { tempatKerjaId: true } } } },
        },
      },
    },
  })
  if (!dokumen) {
    return NextResponse.json({ error: 'Dokumen tidak ditemukan.' }, { status: 404 })
  }

  // Asesi pemilik pengajuan — selalu boleh
  if (dokumen.pengajuan.userId === guard.user.id) {
    return responsDokumen(dokumen, req.nextUrl.searchParams.get('unduh') === '1')
  }

  // Pimpinan fasyankes — hanya untuk fasyankesnya sendiri
  if (guard.user.role === 'PIMPINAN_FASYANKES') {
    const pimpinan = await ambilWewenangPimpinan(guard.user.id)
    const cek = pimpinanBolehAkses(
      pimpinan,
      dokumen.pengajuan.user.asesiProfile?.tempatKerjaId ?? null,
      dokumen.pengajuan.fasyankes
    )
    if (!cek.ok) {
      return NextResponse.json({ error: cek.alasan ?? 'Bukan wewenang Anda.' }, { status: 403 })
    }
    return responsDokumen(dokumen, req.nextUrl.searchParams.get('unduh') === '1')
  }

  // Staf Dinkes / Kepala Dinas / Superadmin — boleh
  return responsDokumen(dokumen, req.nextUrl.searchParams.get('unduh') === '1')
}
