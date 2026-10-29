'use client'

// ============================================================
// KREDENS v2.kubar — Modul Panduan Penggunaan (v2.3)
// Halaman publik /panduan — panduan per peran sesuai menu asli.
// ============================================================
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  BookOpen,
  CircleHelp,
  ClipboardSignature,
  Compass,
  FolderOpen,
  LayoutDashboard,
  ListChecks,
  Printer,
  ShieldCheck,
  UserPlus,
  UserRound,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { APP_NAME, APP_FULL_NAME } from '@/lib/constants'
import { PERAN_PANDUAN } from './data'
import { AlurVisual, BagianFaq, KartuRingkas, PeranGuide } from './bagian'

// Pemetaan peran sesi -> id tab panduan
const PERAN_KE_TAB: Record<string, string> = {
  ASESI: 'asesi',
  OPERATOR_KREDENSIAL: 'operator',
  ASESOR: 'asesor',
  MITRA_BESTARI: 'asesor',
  KETUA_TIM_KREDENSIAL: 'tim',
  PIMPINAN_FASYANKES: 'pimpinan',
  KEPALA_DINAS_KESEHATAN: 'umum',
  SUPERADMIN: 'umum',
}

const IKON_TAB: Record<string, React.ElementType> = {
  umum: Compass,
  asesi: UserRound,
  operator: FolderOpen,
  asesor: ListChecks,
  tim: ShieldCheck,
  pimpinan: ClipboardSignature,
  faq: CircleHelp,
}

export function PanduanPenggunaan() {
  const [tab, setTab] = useState('umum')
  const [sesiRole, setSesiRole] = useState<string | null>(null)

  useEffect(() => {
    // Pilih tab awal dari ?peran= (tautan langsung), lalu dari sesi aktif.
    // setState dilakukan dalam callback (defer), bukan sinkron di badan
    // efek, agar tidak memicu render berantai (aturan lint react-hooks).
    let paramTab: string | null = null
    const t = setTimeout(() => {
      const param = new URLSearchParams(window.location.search).get('peran')
      if (param && PERAN_PANDUAN.some((p) => p.id === param)) {
        paramTab = param
        setTab(param)
      }
    }, 0)
    fetch('/api/auth/session')
      .then((r) => (r.ok ? r.json() : null))
      .then((s: { user?: { role?: string } } | null) => {
        const role = s?.user?.role
        if (!role) return
        setSesiRole(role)
        if (!paramTab) {
          const idTab = PERAN_KE_TAB[role]
          if (idTab) setTab(idTab)
        }
      })
      .catch(() => {})
    return () => clearTimeout(t)
  }, [])

  const ikonPeran = (id: string) => IKON_TAB[id] ?? BookOpen

  return (
    <div className="min-h-screen bg-muted/40">
      {/* ===== Kepala halaman ===== */}
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-border shadow-sm">
              <Image src="/logo-kubar.png" alt="Logo KREDENS v2.kubar" width={36} height={36} className="h-9 w-9 object-contain" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-bold tracking-tight text-foreground">{APP_NAME}</p>
              <p className="truncate text-[11px] text-muted-foreground">Panduan Penggunaan Platform</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()} className="hidden sm:inline-flex">
              <Printer className="h-4 w-4" />
              Cetak
            </Button>
            {sesiRole ? (
              <Button size="sm" asChild>
                <Link href="/dashboard">
                  Kembali ke Aplikasi
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button size="sm" asChild>
                <Link href="/login">
                  Masuk ke Aplikasi
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#16a34a] via-primary to-[#0b3d24] px-4 py-10 text-primary-foreground sm:py-12">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#ffec00]/15 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="mx-auto max-w-6xl">
          <Badge className="border-white/25 bg-white/15 text-white">Buku Saku Digital</Badge>
          <h1 className="mt-3 max-w-2xl text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            Panduan Penggunaan KREDENS v2.kubar
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-primary-foreground/90 sm:text-base">
            {APP_FULL_NAME}. Pilih peran Anda untuk melihat langkah penggunaan platform —
            mulai dari pengajuan kredensial hingga Surat Penugasan Klinis (SPK).
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {PERAN_PANDUAN.map((p) => {
              const Ikon = ikonPeran(p.id)
              return (
                <button
                  key={p.id}
                  onClick={() => setTab(p.id)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-semibold transition-colors hover:bg-white/20 sm:text-sm"
                >
                  <Ikon className="h-4 w-4" />
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== Isi ===== */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Tabs value={tab} onValueChange={setTab}>
          <div className="overflow-x-auto pb-1">
            <TabsList className="inline-flex h-auto w-max max-w-full gap-1 rounded-xl bg-background p-1.5 shadow-sm ring-1 ring-border">
              <TabsTrigger value="umum" className="gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm">
                <Compass className="h-4 w-4" /> Alur Umum
              </TabsTrigger>
              {PERAN_PANDUAN.map((p) => {
                const Ikon = ikonPeran(p.id)
                return (
                  <TabsTrigger key={p.id} value={p.id} className="gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm">
                    <Ikon className="h-4 w-4" />
                    {p.label}
                  </TabsTrigger>
                )
              })}
              <TabsTrigger value="faq" className="gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm">
                <CircleHelp className="h-4 w-4" /> Tanya Jawab
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ---- Tab: Alur Umum ---- */}
          <TabsContent value="umum" className="mt-5 space-y-5">
            <Card className="border">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                  Apa itu KREDENS v2.kubar?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                KREDENS v2.kubar adalah platform satu pintu tata kelola kredensial tenaga medis dan
                tenaga kesehatan pada Dinas Kesehatan Kabupaten Kutai Barat. Seluruh proses berjalan
                berurutan dalam satu alur: pengajuan oleh asesi, verifikasi berkas oleh operator,
                penilaian kewenangan oleh tim, rekomendasi, ketetapan Kepala Dinas, hingga terbitnya
                Surat Penugasan Klinis (SPK) dari pimpinan fasyankes. Setiap transisi status
                divalidasi server sesuai peran, sehingga alur tidak bisa dilompati dan dokumen resmi
                terekam rapi.
              </CardContent>
            </Card>

            <div>
              <h3 className="mb-3 text-base font-bold text-foreground">Alur 8 Tahap Pengajuan</h3>
              <AlurVisual />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KartuRingkas
                judul="Masuk ke Aplikasi"
                isi="Buka halaman Masuk, tulis email resmi dan kata sandi, lalu tekan Masuk. Percobaan pertama bisa lambat ±10–30 detik karena sistem menyiapkan database — normal dan hanya sekali. Sesi berlaku maksimal 8 jam dan berhenti otomatis setelah 15 menit diam."
              />
              <KartuRingkas
                judul="Pendaftaran Akun Mandiri"
                isi="Calon Asesi, Asesor, atau Pimpinan Fasyankes yang belum punya akun dapat mendaftar sendiri lewat tautan Daftar pada halaman Masuk. Akun baru berstatus Menunggu Verifikasi sampai Operator Kredensial mengaktifkannya."
              />
              <KartuRingkas
                judul="Satu Akun, Banyak Fungsi (v2.1)"
                isi="Superadmin dapat menambahkan hingga tiga fungsi tambahan pada satu akun: Asesor, Pimpinan Fasyankes, dan/atau Ketua Tim Kredensial. Menu fungsi tambahan tampil di bagian Fungsi Tambahan bilah samping tanpa keluar-masuk ulang."
              />
              <KartuRingkas
                judul="Foto Profil Akun (v2.3)"
                isi="Semua peran dapat memasang foto: buka Akun Saya, ketuk ikon kamera pada kartu identitas, pilih foto JPG/PNG/WebP — otomatis dikecilkan ke 512px sebelum disimpan. Foto tampil di bilah samping, pojok kanan atas, dan dapat diganti/hapus kapan saja."
              />
            </div>

            <Card className="border">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                  <UserPlus className="h-5 w-5 text-primary" />
                  Peran Pendukung Lainnya
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                Selain lima peran di tab sebelah, platform juga melayani <b className="text-foreground">Mitra
                Bestari</b> (alur penilaian sama dengan Asesor), <b className="text-foreground">Kepala Dinas
                Kesehatan</b> (menerbitkan surat rekomendasi dan ketetapan kewenangan pada menu Rekomendasi
                &amp; Ketetapan), serta <b className="text-foreground">Superadmin</b> (Kelola Akun — termasuk
                fungsi tambahan dan profesi ketua tim, Semua Pengajuan, dan Template Kewenangan).
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---- Tab: per peran ---- */}
          {PERAN_PANDUAN.map((p) => (
            <TabsContent key={p.id} value={p.id} className="mt-5">
              <PeranGuide p={p} />
            </TabsContent>
          ))}

          {/* ---- Tab: FAQ ---- */}
          <TabsContent value="faq" className="mt-5">
            <BagianFaq />
          </TabsContent>
        </Tabs>
      </main>

      {/* ===== Kaki halaman ===== */}
      <footer className="border-t bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
          <p>
            {APP_NAME} — Dinas Kesehatan Kabupaten Kutai Barat
          </p>
          <p>
            {sesiRole ? (
              <Link href="/dashboard" className="font-medium text-primary hover:underline">
                Kembali ke Aplikasi
              </Link>
            ) : (
              <Link href="/login" className="font-medium text-primary hover:underline">
                Masuk ke Aplikasi
              </Link>
            )}
            {' · '}
            <Link href="/daftar" className="font-medium text-primary hover:underline">
              Daftar Akun Baru
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
