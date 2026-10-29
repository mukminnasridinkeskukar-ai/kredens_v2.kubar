import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/kredens/status-badge'
import { ROLE_LABELS, JENIS_PENGAJUAN_LABELS } from '@/lib/constants'
import { formatTanggal } from '@/lib/format'
import { ArrowRight, BookCheck, ClipboardList, HeartPulse, Inbox, UserPlus } from 'lucide-react'

type BarisPengajuan = {
  id: string
  kode: string
  jenis: string
  status: string
  fasyankes: string | null
  submittedAt: Date | null
  updatedAt: Date
  user: { nama: string; nip?: string | null }
  kewenangan: { id: string; kodeRekomendasi: string | null }[]
}

const KONTEKS: Record<
  string,
  { tugas: string; statusPerhatian: string[]; detailHref: (id: string) => string }
> = {
  OPERATOR_KREDENSIAL: {
    tugas:
      'Periksa kelengkapan berkas pengajuan yang dikirim asesi, kelola jadwal kredensial, dan teruskan pengajuan lolos verifikasi ke tim kredensial.',
    statusPerhatian: ['DIAJUKAN', 'VERIFIKASI'],
    detailHref: (id) => `/operator/verifikasi/${id}`,
  },
  ASESOR: {
    tugas:
      'Telaah dan beri kode rekomendasi pada setiap kewenangan klinis yang diusulkan asesi selama tahap penilaian tim. Anda hanya menangani pengajuan yang ditugaskan Operator kepada Anda (salah satu dari tiga asesor penilai).',
    statusPerhatian: ['PENILAIAN_TIM'],
    detailHref: (id) => `/penilaian/${id}`,
  },
  MITRA_BESTARI: {
    tugas:
      'Sebagai mitra bestari, telaah dan beri kode rekomendasi pada setiap kewenangan klinis yang diusulkan asesi.',
    statusPerhatian: ['PENILAIAN_TIM'],
    detailHref: (id) => `/penilaian/${id}`,
  },
  KETUA_TIM_KREDENSIAL: {
    tugas:
      'Pastikan seluruh kewenangan telah dinilai tim, lalu tetapkan kesimpulan rekomendasi tim kredensial untuk diteruskan kepada Kepala Dinas.',
    statusPerhatian: ['PENILAIAN_TIM', 'REKOMENDASI_TIM'],
    detailHref: (id) => `/ketua-tim/${id}`,
  },
  KEPALA_DINAS_KESEHATAN: {
    tugas:
      'Terbitkan Surat Rekomendasi Penetapan Kewenangan Klinis beserta lampiran ketetapan untuk pengajuan yang telah direkomendasikan tim.',
    statusPerhatian: ['REKOMENDASI_TIM'],
    detailHref: (id) => `/kadis/${id}`,
  },
  PIMPINAN_FASYANKES: {
    tugas:
      'Terbitkan Surat Penugasan Klinis (SPK) berdasarkan ketetapan kewenangan klinis, lalu tandai proses kredensial selesai. Verifikasi pula laporan logbook bulanan asesi fasyankes Anda.',
    statusPerhatian: ['KETETAPAN_KADIS', 'SURAT_PENUGASAN'],
    detailHref: (id) => `/pimpinan/${id}`,
  },
  SUPERADMIN: {
    tugas:
      'Pengawasan penuh: seluruh pengajuan pada semua tahap, kelola seluruh akun, dan kelola template kewenangan. Anda juga dapat membuka modul staf mana pun dari menu sidebar.',
    statusPerhatian: [
      'DIAJUKAN',
      'VERIFIKASI',
      'PENILAIAN_TIM',
      'REKOMENDASI_TIM',
      'KETETAPAN_KADIS',
      'SURAT_PENUGASAN',
    ],
    detailHref: (id) => `/semua-data/${id}`,
  },
}

function Tabel({
  daftar,
  kosong,
  detailHref,
}: {
  daftar: BarisPengajuan[]
  kosong: string
  detailHref: (id: string) => string
}) {
  if (daftar.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">{kosong}</p>
      </div>
    )
  }
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left">
            <th className="p-3 font-semibold">Kode</th>
            <th className="p-3 font-semibold">Asesi</th>
            <th className="p-3 font-semibold">Jenis</th>
            <th className="p-3 font-semibold">Status</th>
            <th className="p-3 font-semibold">Diperbarui</th>
            <th className="p-3 text-right font-semibold">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {daftar.map((p) => (
            <tr key={p.id} className="border-b last:border-0">
              <td className="p-3 font-mono text-xs font-semibold">{p.kode}</td>
              <td className="p-3">
                <p className="font-medium">{p.user?.nama ?? '—'}</p>
                <p className="text-xs text-muted-foreground">{p.fasyankes ?? '—'}</p>
              </td>
              <td className="p-3 text-xs">{JENIS_PENGAJUAN_LABELS[p.jenis] ?? p.jenis}</td>
              <td className="p-3">
                <StatusBadge status={p.status} />
              </td>
              <td className="p-3 text-xs text-muted-foreground">{formatTanggal(p.updatedAt)}</td>
              <td className="p-3 text-right">
                <Link
                  href={detailHref(p.id)}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Proses <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DashboardStaf({
  role,
  nama,
  pengajuanList,
  akunMenunggu = 0,
  logbookMenunggu = 0,
}: {
  role: string
  nama: string
  pengajuanList: BarisPengajuan[]
  akunMenunggu?: number
  logbookMenunggu?: number
}) {
  const ctx = KONTEKS[role]
  const perluTindakan = pengajuanList.filter((p) => ctx.statusPerhatian.includes(p.status))
  const lainnya = pengajuanList.filter(
    (p) => !ctx.statusPerhatian.includes(p.status) && p.status !== 'DRAFT'
  )

  const hitungStatus = pengajuanList.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-2xl border bg-gradient-to-br from-primary to-[#0b6b2f] p-6 text-primary-foreground shadow-sm">
        <p className="text-sm text-primary-foreground/80">Selamat datang di KREDENS</p>
        <h1 className="mt-1 text-xl font-bold sm:text-2xl">{nama || 'Pengguna'}</h1>
        <p className="mt-2 text-sm text-primary-foreground/90">
          Panel kerja {ROLE_LABELS[role] ?? role} · Dinas Kesehatan Kabupaten Kutai Barat
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" /> Tugas Anda
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">{ctx.tugas}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {Object.entries(hitungStatus).map(([s, n]) => (
            <span
              key={s}
              className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              {s.replaceAll('_', ' ')}: <span className="font-bold text-foreground">{n}</span>
            </span>
          ))}
          {pengajuanList.length === 0 && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <HeartPulse className="h-4 w-4 text-primary/50" /> Belum ada pengajuan masuk.
            </p>
          )}
        </CardContent>
      </Card>

      <div id="antrean" className="space-y-6">
        {(role === 'PIMPINAN_FASYANKES' || role === 'SUPERADMIN') && logbookMenunggu > 0 && (
          <Card className="border-amber-200 bg-amber-50/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookCheck className="h-5 w-5 text-amber-600" /> Logbook Menunggu Verifikasi
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                  {logbookMenunggu}
                </span>
              </CardTitle>
              <CardDescription>
                Ada laporan kegiatan bulanan asesi yang menunggu persetujuan pimpinan fasyankes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/pimpinan/logbook"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                Buka Verifikasi Logbook <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        )}
        {(role === 'OPERATOR_KREDENSIAL' || role === 'SUPERADMIN') && akunMenunggu > 0 && (
          <Card className="border-amber-200 bg-amber-50/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-amber-600" /> Pendaftaran Akun Baru
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                  {akunMenunggu}
                </span>
              </CardTitle>
              <CardDescription>
                Ada pendaftaran akun mandiri yang menunggu verifikasi. Akun baru tidak dapat
                masuk sebelum diaktifkan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href={role === 'SUPERADMIN' ? '/kelola-akun' : '/operator/akun'}
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                {role === 'SUPERADMIN' ? 'Buka Kelola Akun' : 'Buka Verifikasi Akun'}{' '}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Inbox className="h-5 w-5 text-primary" /> Perlu Tindakan Anda
            </CardTitle>
            <CardDescription>
              Pengajuan pada tahap{' '}
              {ctx.statusPerhatian.map((s) => s.replaceAll('_', ' ')).join(' / ')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabel
              daftar={perluTindakan}
              kosong="Tidak ada pengajuan yang menunggu tindakan Anda."
              detailHref={ctx.detailHref}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pengajuan Tahap Lain</CardTitle>
            <CardDescription>Pemantauan seluruh proses kredensialing</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabel
              daftar={lainnya}
              kosong="Belum ada pengajuan pada tahap lain."
              detailHref={ctx.detailHref}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
