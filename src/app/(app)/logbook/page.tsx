import { requirePageRole } from '@/lib/role-guard'
import { db } from '@/lib/db'
import {
  LogbookManager,
  type KewenanganRingkas,
  type LogbookData,
} from '@/components/kredens/logbook-manager'
import { ReadOnlyEmpty } from '@/components/kredens/read-only'
import { PengajuanPicker } from '@/components/kredens/pengajuan-picker'
import { STATUS_LOGBOOK_SIAP } from '@/lib/constants'

export default async function LogbookPage({
  searchParams,
}: {
  searchParams: Promise<{ pengajuan?: string }>
}) {
  const user = await requirePageRole(['ASESI'])
  const { pengajuan: pilihan } = await searchParams

  // Logbook hanya tersedia untuk pengajuan yang telah direkomendasikan
  // tim kredensial (ada kewenangan yang disetujui).
  const daftarPengajuan = await db.pengajuan.findMany({
    where: { userId: user.id, status: { in: [...STATUS_LOGBOOK_SIAP] } },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, kode: true, jenis: true, status: true },
  })

  const header = (
    <div>
      <h1 className="text-2xl font-bold">Logbook Kegiatan Klinis</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Catat pelaksanaan kewenangan klinis yang telah disetujui tim kredensial dalam laporan
        bulanan berbentuk cek list harian, lalu ajukan verifikasi pimpinan fasyankes Anda.
      </p>
    </div>
  )

  if (daftarPengajuan.length === 0) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        {header}
        <ReadOnlyEmpty
          title="Logbook belum tersedia"
          description="Logbook berisi daftar kewenangan klinis yang telah disetujui tim kredensial (hasil rekomendasi tim). Halaman ini akan aktif setelah pengajuan Anda melewati tahap Rekomendasi Tim."
        />
      </div>
    )
  }

  const terpilihId =
    (pilihan && daftarPengajuan.find((p) => p.id === pilihan)?.id) ?? daftarPengajuan[0].id

  const pengajuan = await db.pengajuan.findUnique({
    where: { id: terpilihId },
    include: { kewenangan: { orderBy: { urutan: 'asc' } } },
  })

  const disetujui: KewenanganRingkas[] = (pengajuan?.kewenangan ?? [])
    .filter((k) => k.kodeRekomendasi === '1' || k.kodeRekomendasi === '2')
    .map((k) => ({
      id: k.id,
      namaKewenangan: k.namaKewenangan,
      kodeRef: k.kodeRef,
      kodeRekomendasi: k.kodeRekomendasi,
    }))

  const logbooks = await db.logbookBulanan.findMany({
    where: { pengajuanId: terpilihId },
    orderBy: [{ tahun: 'desc' }, { bulan: 'desc' }],
    select: { id: true, bulan: true, tahun: true, status: true },
  })

  const kini = new Date()
  const bulanAwal = kini.getMonth() + 1
  const tahunAwal = kini.getFullYear()
  const adaAwal = logbooks.find((l) => l.bulan === bulanAwal && l.tahun === tahunAwal)
  const logbookAwal: LogbookData = adaAwal
    ? await db.logbookBulanan.findUnique({
        where: { id: adaAwal.id },
        include: { entri: { orderBy: [{ tanggal: 'asc' }, { createdAt: 'asc' }] } },
      })
    : null

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {header}
      <PengajuanPicker options={daftarPengajuan} selectedId={terpilihId} basePath="/logbook" />
      <LogbookManager
        key={terpilihId}
        pengajuanId={terpilihId}
        pengajuanKode={pengajuan?.kode ?? ''}
        kewenangan={disetujui}
        daftarLogbook={logbooks}
        logbookAwal={logbookAwal}
        bulanAwal={bulanAwal}
        tahunAwal={tahunAwal}
      />
    </div>
  )
}
