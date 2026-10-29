'use client'

// ============================================================
// KREDENS v2.kubar — Bagian-bagian tampilan Panduan (v2.3)
// ============================================================
import {
  CheckCircle2,
  Compass,
  Lightbulb,
  Menu as MenuIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import type { PanduanPeran } from './data'
import { FAQ_PANDUAN, ALUR_TAHAP } from './data'
import { KODE_DIMINTA, KODE_REKOMENDASI } from '@/lib/constants'

// ---------- Alur 8 tahap ----------
export function AlurVisual() {
  return (
    <ol className="grid gap-2 sm:grid-cols-2">
      {ALUR_TAHAP.map((t, i) => (
        <li
          key={t.label}
          className="flex items-start gap-3 rounded-xl border bg-card p-3"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {i + 1}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{t.label}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{t.pelaku}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

// ---------- Tabel kode (legenda) ----------
export function TabelKode({ judul, kode }: { judul: string; kode: Record<string, string> }) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <p className="border-b bg-muted/60 px-4 py-2.5 text-sm font-semibold text-foreground">
        {judul}
      </p>
      <table className="w-full text-sm">
        <tbody>
          {Object.entries(kode).map(([k, v]) => (
            <tr key={k} className="border-b last:border-b-0">
              <td className="w-14 px-4 py-2.5 align-top">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                  {k}
                </span>
              </td>
              <td className="px-2 py-2.5 text-muted-foreground">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------- Tabel menu per peran ----------
export function TabelMenu({ menus }: { menus: { menu: string; fungsi: string }[] }) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <p className="flex items-center gap-2 border-b bg-muted/60 px-4 py-2.5 text-sm font-semibold text-foreground">
        <MenuIcon className="h-4 w-4 text-primary" />
        Daftar Menu pada Bilah Samping
      </p>
      <table className="w-full text-sm">
        <tbody>
          {menus.map((m) => (
            <tr key={m.menu} className="border-b last:border-b-0">
              <td className="w-56 px-4 py-2.5 align-top font-medium text-foreground">{m.menu}</td>
              <td className="px-2 py-2.5 text-muted-foreground">{m.fungsi}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------- Kartu langkah bernomor ----------
function LangkahCard({ no, judul, isi, menu }: { no: number; judul: string; isi: string; menu?: string }) {
  return (
    <li className="flex gap-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {no}
      </span>
      <div className="min-w-0 flex-1 rounded-xl border bg-card p-4">
        <p className="font-semibold text-foreground">{judul}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{isi}</p>
        {menu && (
          <p className="mt-2.5 inline-flex items-start gap-1.5 rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground">
            <Compass className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              <span className="opacity-70">Menu: </span>
              {menu}
            </span>
          </p>
        )}
      </div>
    </li>
  )
}

// ---------- Tips ----------
function KartuTips({ tips }: { tips: string[] }) {
  return (
    <div className="rounded-xl border border-primary/25 bg-secondary/60 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-secondary-foreground">
        <Lightbulb className="h-4 w-4 text-primary" />
        Tips Penting
      </p>
      <ul className="mt-2 space-y-1.5">
        {tips.map((t) => (
          <li key={t} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---------- Panduan satu peran lengkap ----------
export function PeranGuide({ p }: { p: PanduanPeran }) {
  return (
    <div className="space-y-5">
      <div>
        <Badge variant="secondary" className="mb-2">
          {p.peranTeks}
        </Badge>
        <p className="text-sm leading-relaxed text-muted-foreground">{p.ringkasan}</p>
      </div>

      <div>
        <h3 className="mb-3 text-base font-bold text-foreground">Langkah demi Langkah</h3>
        <ol className="space-y-3">
          {p.langkah.map((l, i) => (
            <LangkahCard key={l.judul} no={i + 1} judul={l.judul} isi={l.isi} menu={l.menu} />
          ))}
        </ol>
      </div>

      {p.id === 'asesi' && (
        <TabelKode judul="Legenda Kode Diminta (usulan kewenangan oleh Asesi)" kode={KODE_DIMINTA} />
      )}
      {p.id === 'asesor' && (
        <TabelKode judul="Legenda Kode Rekomendasi (penilaian oleh Asesor/Anggota Tim)" kode={KODE_REKOMENDASI} />
      )}

      <TabelMenu menus={p.menus} />
      <KartuTips tips={p.tips} />
    </div>
  )
}

// ---------- FAQ ----------
export function BagianFaq() {
  return (
    <Accordion type="single" collapsible className="space-y-2">
      {FAQ_PANDUAN.map((f, i) => (
        <AccordionItem
          key={f.q}
          value={`faq-${i}`}
          className="rounded-xl border bg-card px-4 last:border-b"
        >
          <AccordionTrigger className="text-left text-sm font-semibold text-foreground hover:no-underline">
            {f.q}
          </AccordionTrigger>
          <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
            {f.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

// ---------- Kartu ringkas (tab umum) ----------
export function KartuRingkas({
  judul,
  isi,
}: {
  judul: string
  isi: string
}) {
  return (
    <Card className="border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-foreground">{judul}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-relaxed text-muted-foreground">{isi}</CardContent>
    </Card>
  )
}
