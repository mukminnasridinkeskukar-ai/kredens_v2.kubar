'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { StatusBadge } from '@/components/kredens/status-badge'
import { formatTanggal } from '@/lib/format'
import {
  FilePlus2,
  FolderOpen,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  ShieldCheck,
  FileSignature,
  UserCog,
  ArrowRight,
} from 'lucide-react'
import {
  JENIS_PENGAJUAN_LABELS,
  ROLE_LABELS,
  PERAN_EKSTRA_LABELS,
  uraikanPeranEkstra,
  type PengajuanStatus,
} from '@/lib/constants'
import type { Pengajuan, KewenanganKlinis, JadwalKredensial } from '@prisma/client'

const LINK_FUNGSI_EKSTRA: Record<string, { label: string; href: string; ket: string }> = {
  ASESOR: {
    label: 'Penilaian Kewenangan',
    href: '/penilaian',
    ket: 'Nilai kewenangan klinis pengajuan yang ditugaskan Operator kepada Anda.',
  },
  KETUA_TIM_KREDENSIAL: {
    label: 'Rekomendasi Tim',
    href: '/ketua-tim',
    ket: 'Tetapkan kesimpulan rekomendasi tim untuk pengajuan sesuai profesi Anda.',
  },
  PIMPINAN_FASYANKES: {
    label: 'Surat Penugasan Klinis',
    href: '/pimpinan',
    ket: 'Terbitkan SPK dan verifikasi logbook bulanan asesi fasyankes Anda.',
  },
}

type PengajuanWithRels = Pengajuan & {
  kewenangan: KewenanganKlinis[]
  jadwal: JadwalKredensial[]
}

export function DashboardAsesi({
  pengajuanList,
  biodataLengkap,
  nama,
  peranEkstra,
}: {
  pengajuanList: PengajuanWithRels[]
  biodataLengkap: number
  nama: string
  /** v2.1 — fungsi tambahan akun (ASESOR, PIMPINAN_FASYANKES, KETUA_TIM_KREDENSIAL) */
  peranEkstra?: string | null
}) {
  const fungsiEkstra = uraikanPeranEkstra(peranEkstra)
  const aktif = pengajuanList.find((p) => p.status !== 'SELESAI' && p.status !== 'DRAFT')
  const draft = pengajuanList.find((p) => p.status === 'DRAFT')
  const jadwalTerdekat = pengajuanList
    .flatMap((p) => p.jadwal)
    .filter((j) => j.status === 'TERJADWAL')
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal))[0]

  const stats = [
    { label: 'Total Pengajuan', value: pengajuanList.length, icon: ClipboardList },
    { label: 'Sedang Proses', value: pengajuanList.filter((p) => p.status !== 'DRAFT' && p.status !== 'SELESAI').length, icon: ShieldCheck },
    { label: 'Selesai', value: pengajuanList.filter((p) => p.status === 'SELESAI').length, icon: FileSignature },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Sambutan */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary to-[#0b6b2f] p-6 text-primary-foreground shadow-sm sm:pr-36">
        <div className="absolute -right-4 -top-4 hidden h-28 w-28 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm sm:flex">
          <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white shadow-md">
            <Image
              src="/logo-kubar.png"
              alt="Logo KREDENS"
              width={64}
              height={64}
              className="h-16 w-16 object-contain"
            />
          </div>
        </div>
        <p className="text-sm text-primary-foreground/80">Selamat datang di KREDENS</p>
        <h1 className="mt-1 text-xl font-bold sm:text-2xl">{nama || 'Asesi'}</h1>
        <p className="mt-2 max-w-2xl text-sm text-primary-foreground/90">
          Kelola pengajuan kewenangan klinis Anda — dari permohonan, penilaian tim kredensial,
          rekomendasi Kepala Dinas Kesehatan, hingga Surat Penugasan Klinis.
        </p>
      </div>

      {/* v2.1 — Fungsi tambahan akun (multi-fungsi) */}
      {fungsiEkstra.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCog className="h-4.5 w-4.5 text-primary" /> Fungsi Tambahan Akun
            </CardTitle>
            <CardDescription>
              Selain sebagai Asesi, akun Anda juga menjalankan fungsi berikut. Menu fungsi tambahan
              tersedia pada bilah samping bagian &quot;Fungsi Tambahan&quot;.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {fungsiEkstra.map((r) => {
              const info = LINK_FUNGSI_EKSTRA[r]
              if (!info) return null
              return (
                <Link
                  key={r}
                  href={info.href}
                  className="group rounded-xl border p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <p className="flex items-center justify-between text-sm font-semibold text-foreground">
                    {PERAN_EKSTRA_LABELS[r] ?? r}
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{info.ket}</p>
                </Link>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Statistik */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Status pengajuan aktif */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pengajuan Terkini</CardTitle>
            <CardDescription>Status terkini proses kredensialing Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pengajuanList.length === 0 && (
              <div className="rounded-xl border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Belum ada pengajuan. Mulai dengan membuat pengajuan kredensial baru.
                </p>
                <Button asChild className="mt-3">
                  <Link href="/pengajuan">
                    <FilePlus2 className="mr-2 h-4 w-4" /> Buat Pengajuan
                  </Link>
                </Button>
              </div>
            )}
            {(aktif ?? pengajuanList[0] ?? draft) && (
              <Link
                href="/pengajuan"
                className="flex items-center justify-between gap-3 rounded-xl border p-4 transition-colors hover:bg-accent"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-sm font-semibold">{(aktif ?? pengajuanList[0] ?? draft)!.kode}</p>
                    <StatusBadge status={(aktif ?? pengajuanList[0] ?? draft)!.status} />
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                      {JENIS_PENGAJUAN_LABELS[(aktif ?? pengajuanList[0] ?? draft)!.jenis]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {(aktif ?? pengajuanList[0] ?? draft)!.kewenangan.length} kewenangan klinis diusulkan ·
                    {' '}diperbarui {formatTanggal((aktif ?? pengajuanList[0] ?? draft)!.updatedAt)}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </Link>
            )}
            {pengajuanList.length > 1 && (
              <Button asChild variant="outline" className="w-full">
                <Link href="/pengajuan">Lihat Semua Pengajuan</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Kelengkapan biodata */}
        <Card>
          <CardHeader>
            <CardTitle>Kelengkapan Biodata</CardTitle>
            <CardDescription>Data riwayat hidup Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Terisi</span>
                <span className="font-bold text-primary">{biodataLengkap}%</span>
              </div>
              <Progress value={biodataLengkap} className="h-2" />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Lengkapi seluruh data pribadi, riwayat pendidikan, pengalaman kerja, dan
              pengembangan kompetensi agar pengajuan dapat diproses cepat.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/biodata/riwayat-hidup">
                <FolderOpen className="mr-2 h-4 w-4" /> Lengkapi Biodata
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Jadwal terdekat */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Jadwal Kredensial</CardTitle>
            <CardDescription>Agenda penilaian yang akan datang</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/jadwal-kredensial">
              Semua <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {jadwalTerdekat ? (
            <div className="flex items-center gap-4 rounded-xl border p-4">
              <CalendarDays className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-semibold">
                  {jadwalTerdekat.keterangan ?? 'Agenda kredensial'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatTanggal(jadwalTerdekat.tanggal)}
                  {jadwalTerdekat.waktu ? ` · ${jadwalTerdekat.waktu}` : ''}
                  {jadwalTerdekat.tempat ? ` · ${jadwalTerdekat.tempat}` : ''}
                </p>
              </div>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Belum ada jadwal kredensial yang dijadwalkan.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
