'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  FilePlus2,
  UserRound,
  FolderOpen,
  ShieldCheck,
  ClipboardSignature,
  CalendarDays,
  UserCircle,
  LogOut,
  ChevronDown,
  Menu,
  Lock,
  FileText,
  FileCheck,
  ListChecks,
  FileBadge,
  UserPlus,
  Database,
  NotebookPen,
  BookCheck,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { keluarKeSitusUtama } from '@/lib/keluar'
import { PengamanLayar } from '@/components/kredens/pengaman-layar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  APP_NAME,
  APP_FULL_NAME,
  PERAN_EKSTRA_LABELS,
  labelPeranLengkap,
  uraikanPeranEkstra,
} from '@/lib/constants'

type NavItem = { label: string; href: string; icon: React.ElementType }
type NavGroup = { label: string; icon: React.ElementType; items: NavItem[] }
type NavEntry = NavItem | NavGroup

const ASESI_MAIN_NAV: (NavItem | NavGroup)[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Pengajuan', href: '/pengajuan', icon: FilePlus2 },
  {
    label: 'Biodata',
    icon: UserRound,
    items: [
      { label: 'Riwayat Hidup', href: '/biodata/riwayat-hidup', icon: FolderOpen },
      { label: 'Formulir', href: '/biodata/formulir', icon: FileText },
      { label: 'Rincian Kewenangan Klinis', href: '/biodata/kewenangan-klinis', icon: ListChecks },
    ],
  },
  {
    label: 'Kredensialing',
    icon: ShieldCheck,
    items: [
      { label: 'Rekomendasi Tim', href: '/kredensialing/rekomendasi-tim', icon: FileCheck },
      { label: 'Rekomendasi Kadis', href: '/kredensialing/rekomendasi-kadis', icon: FileBadge },
      {
        label: 'Lampiran Rekomendasi Kadis',
        href: '/kredensialing/lampiran-rekomendasi-kadis',
        icon: FileText,
      },
    ],
  },
  {
    label: 'SPK dan RKK',
    icon: ClipboardSignature,
    items: [
      { label: 'Surat Penugasan Klinis', href: '/spk-rkk/surat-penugasan-klinis', icon: FileText },
      { label: 'Rincian Kewenangan Klinis', href: '/spk-rkk/rkk', icon: ListChecks },
    ],
  },
  { label: 'Jadwal Kredensial', href: '/jadwal-kredensial', icon: CalendarDays },
  { label: 'Logbook', href: '/logbook', icon: NotebookPen },
]

const NON_ASESI_NAV: Record<string, NavEntry[]> = {
  OPERATOR_KREDENSIAL: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Verifikasi Berkas', href: '/operator/verifikasi', icon: FolderOpen },
    { label: 'Verifikasi Akun', href: '/operator/akun', icon: UserPlus },
    { label: 'Kelola Jadwal', href: '/operator/jadwal', icon: CalendarDays },
  ],
  ASESOR: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Penilaian Kewenangan', href: '/penilaian', icon: ListChecks },
  ],
  MITRA_BESTARI: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Penilaian Kewenangan', href: '/penilaian', icon: ListChecks },
  ],
  KETUA_TIM_KREDENSIAL: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Rekomendasi Tim', href: '/ketua-tim', icon: ShieldCheck },
  ],
  KEPALA_DINAS_KESEHATAN: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Rekomendasi & Ketetapan', href: '/kadis', icon: FileBadge },
  ],
  PIMPINAN_FASYANKES: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Surat Penugasan Klinis', href: '/pimpinan', icon: ClipboardSignature },
    { label: 'Verifikasi Logbook', href: '/pimpinan/logbook', icon: BookCheck },
  ],
  SUPERADMIN: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    {
      label: 'Data & Akun',
      icon: Database,
      items: [
        { label: 'Semua Pengajuan', href: '/semua-data', icon: FolderOpen },
        { label: 'Kelola Akun', href: '/kelola-akun', icon: UserPlus },
        { label: 'Template Kewenangan', href: '/template-kewenangan', icon: ListChecks },
      ],
    },
    {
      label: 'Akses Modul Staf',
      icon: ShieldCheck,
      items: [
        { label: 'Verifikasi Berkas', href: '/operator/verifikasi', icon: FolderOpen },
        { label: 'Penilaian Kewenangan', href: '/penilaian', icon: ListChecks },
        { label: 'Rekomendasi Tim', href: '/ketua-tim', icon: FileCheck },
        { label: 'Rekomendasi & Ketetapan', href: '/kadis', icon: FileBadge },
        { label: 'Surat Penugasan Klinis', href: '/pimpinan', icon: ClipboardSignature },
        { label: 'Verifikasi Logbook', href: '/pimpinan/logbook', icon: BookCheck },
        { label: 'Kelola Jadwal', href: '/operator/jadwal', icon: CalendarDays },
      ],
    },
  ],
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-4 py-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-border shadow-sm">
        <Image
          src="/logo-kubar.png"
          alt="Logo KREDENS"
          width={40}
          height={40}
          className="h-10 w-10 object-contain"
        />
      </div>
      <div className="min-w-0">
        <p className="truncate text-lg font-bold tracking-tight text-foreground">{APP_NAME}</p>
        <p className="text-[11px] leading-tight text-muted-foreground">
          Kredensial Tenaga Medis &amp; Kesehatan
        </p>
      </div>
    </div>
  )
}

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname()
  const active = pathname === item.href
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      )}
    >
      <Icon className="h-4.5 w-4.5 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  )
}

function GroupNav({ group, onNavigate }: { group: NavGroup; onNavigate?: () => void }) {
  const pathname = usePathname()
  const groupActive = group.items.some((i) => pathname.startsWith(i.href))
  const [open, setOpen] = useState(groupActive)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]',
          groupActive
            ? 'bg-sidebar-accent text-primary'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        )}
      >
        <group.icon className="h-4.5 w-4.5 shrink-0" />
        <span className="flex-1 truncate text-left">{group.label}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 space-y-0.5 border-l-2 border-sidebar-border pl-3 ml-4">
          {group.items.map((item) => (
            <NavLink key={item.href} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function SidebarContent({
  role,
  userNama,
  userEmail,
  peranEkstra,
  profesi,
  onNavigate,
}: {
  role: string
  userNama: string
  userEmail: string
  peranEkstra?: string | null
  profesi?: string | null
  onNavigate?: () => void
}) {
  const isAsesi = role === 'ASESI'
  const stafNav = NON_ASESI_NAV[role] ?? [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ]

  // v2.1 — akun multi-fungsi: navigasi milik fungsi tambahan ditampilkan
  // setelah navigasi utama, dipisah dengan judul bagian kecil agar jelas
  // fungsi mana yang sedang dibuka pengguna.
  const ekstra = uraikanPeranEkstra(peranEkstra)
  const navUtama = isAsesi ? ASESI_MAIN_NAV : stafNav
  const navEkstra: NavEntry[] = []
  const terpasang = new Set<string>([
    ...navUtama.flatMap((n) => ('items' in n ? n.items.map((i) => i.href) : [n.href])),
  ])
  for (const r of ekstra) {
    for (const item of NON_ASESI_NAV[r] ?? []) {
      const hrefs = 'items' in item ? item.items.map((i) => i.href) : [item.href]
      // Dashboard tidak perlu diduplikasi — sudah selalu tersedia di atas.
      if (hrefs.every((h) => h === '/dashboard' || terpasang.has(h))) continue
      hrefs.forEach((h) => terpasang.add(h))
      navEkstra.push(item)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <Brand />
      <div className="mx-4 mb-3 rounded-lg border bg-sidebar-accent/50 px-3 py-2.5">
        <p className="truncate text-sm font-semibold text-foreground">{userNama}</p>
        <p className="truncate text-xs text-muted-foreground">
          {labelPeranLengkap(role, profesi)}
        </p>
        {ekstra.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {ekstra.map((r) => (
              <span
                key={r}
                className="rounded border border-dashed px-1.5 py-0.5 text-[10px] font-medium leading-tight text-muted-foreground"
              >
                + {PERAN_EKSTRA_LABELS[r] ?? r}
              </span>
            ))}
          </div>
        )}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-4" aria-label="Navigasi utama">
        {navUtama.map((item) =>
          'items' in item ? (
            <GroupNav key={item.label} group={item} onNavigate={onNavigate} />
          ) : (
            <NavLink key={item.href} item={item} onNavigate={onNavigate} />
          )
        )}
        {navEkstra.length > 0 && (
          <>
            <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Fungsi Tambahan
            </p>
            {navEkstra.map((item) =>
              'items' in item ? (
                <GroupNav key={item.label} group={item} onNavigate={onNavigate} />
              ) : (
                <NavLink key={item.href} item={item} onNavigate={onNavigate} />
              )
            )}
          </>
        )}
      </nav>
      {/* Menu bagian bawah — terpisah: Akun Saya */}
      <div className="border-t px-4 py-3 space-y-1">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Akun Saya
        </p>
        <NavLink item={{ label: 'Profil dan Keamanan', href: '/akun-saya', icon: UserCircle }} onNavigate={onNavigate} />
        {/* v2.3 — Panduan Penggunaan: buka di tab baru agar sesi aplikasi tak tertutup */}
        <a
          href="/panduan"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground min-h-[44px]"
        >
          <BookOpen className="h-4.5 w-4.5 shrink-0" />
          <span className="truncate">Panduan Penggunaan</span>
        </a>
        <button
          onClick={() => void keluarKeSitusUtama()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 min-h-[44px]"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          Keluar
        </button>
        <p className="flex items-center gap-1.5 px-3 pt-1 text-[11px] text-muted-foreground">
          <Lock className="h-3 w-3" />
          {userEmail}
        </p>
      </div>
    </div>
  )
}

export function AppShell({
  children,
  role,
  userNama,
  userEmail,
  peranEkstra,
  profesi,
}: {
  children: React.ReactNode
  role: string
  userNama: string
  userEmail: string
  peranEkstra?: string | null
  profesi?: string | null
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()

  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* Pengamanan layar: watermark identitas + blok tangkap/cetak/salin + batas diam */}
      <PengamanLayar nama={userNama ?? 'Pengguna'} email={userEmail ?? '-'} />
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r bg-sidebar text-sidebar-foreground lg:block">
        <SidebarContent
          role={role}
          userNama={userNama}
          userEmail={userEmail}
          peranEkstra={peranEkstra}
          profesi={profesi}
        />
      </aside>

      {/* Sidebar mobile */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/50 lg:hidden transition-opacity',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setMobileOpen(false)}
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 border-r bg-sidebar text-sidebar-foreground transition-transform lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent
          role={role}
          userNama={userNama}
          userEmail={userEmail}
          peranEkstra={peranEkstra}
          profesi={profesi}
          onNavigate={() => setMobileOpen(false)}
        />
      </aside>

      {/* Konten */}
      <div className="flex min-h-screen w-full flex-col lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Buka menu navigasi"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{APP_NAME}</p>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              {APP_FULL_NAME}
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-full border bg-card px-3 py-1.5 sm:flex">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {userNama?.slice(0, 1).toUpperCase() ?? 'A'}
            </div>
            <div className="max-w-[180px]">
              <p className="truncate text-xs font-semibold">{userNama}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>

        <footer className="mt-auto border-t bg-background px-4 py-4 sm:px-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <p className="text-center text-xs text-muted-foreground">
            {APP_NAME} · {APP_FULL_NAME}
          </p>
        </footer>
      </div>
    </div>
  )
}
