'use client'

import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { STATUS_LABELS, JENIS_PENGAJUAN_LABELS } from '@/lib/constants'

export interface PengajuanOption {
  id: string
  kode: string
  jenis: string
  status: string
}

export function PengajuanPicker({
  options,
  selectedId,
  basePath,
}: {
  options: PengajuanOption[]
  selectedId: string
  basePath: string
}) {
  const router = useRouter()

  if (options.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/40 p-3">
      <span className="text-sm font-medium text-muted-foreground">Pengajuan:</span>
      <Select
        value={selectedId}
        onValueChange={(v) => router.push(`${basePath}?pengajuan=${v}`)}
      >
        <SelectTrigger className="w-full max-w-sm bg-background" aria-label="Pilih pengajuan">
          <SelectValue placeholder="Pilih pengajuan" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.kode} · {JENIS_PENGAJUAN_LABELS[o.jenis] ?? o.jenis} ·{' '}
              {STATUS_LABELS[o.status] ?? o.status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
