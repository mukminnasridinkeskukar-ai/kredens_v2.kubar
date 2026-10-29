import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, FileCheck2 } from 'lucide-react'
import { formatTanggal } from '@/lib/format'
import type { DokumenInfo } from '@/components/kredens/dokumen-upload'

/** Kartu unduhan dokumen terunggah (SPK/RKK) untuk asesi — hanya-lihat. */
export function DokumenUnduh({
  dokumen,
  judul,
  keterangan,
}: {
  dokumen: DokumenInfo | null
  judul: string
  keterangan: string
}) {
  if (!dokumen) return null
  return (
    <Card className="border-emerald-200 bg-emerald-50/50">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
            <FileCheck2 className="h-5 w-5 text-emerald-700" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-900">{judul}</p>
            <p className="mt-0.5 truncate text-xs text-emerald-800/80">
              {dokumen.namaFile} · {keterangan}
              {dokumen.diunggahOleh ? ` · Diunggah ${formatTanggal(String(dokumen.createdAt))}` : ''}
            </p>
          </div>
        </div>
        <Button asChild className="min-h-[40px] bg-primary hover:bg-primary/90">
          <a href={`/api/dokumen/${dokumen.id}?unduh=1`}>
            <Download className="h-4 w-4" /> Unduh Dokumen
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
