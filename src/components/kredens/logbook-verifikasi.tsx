'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { BadgeCheck, Loader2, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

/** Panel keputusan pimpinan fasyankes atas laporan logbook bulanan:
 * sahkan (DIVERIFIKASI) atau minta perbaikan (REVISI, wajib beralasan). */
export function LogbookVerifikasi({
  logbookId,
  periode,
  namaAsesi,
}: {
  logbookId: string
  periode: string
  namaAsesi: string
}) {
  const router = useRouter()
  const [catatan, setCatatan] = useState('')
  const [proses, setProses] = useState<'DIVERIFIKASI' | 'REVISI' | null>(null)

  async function kirim(aksi: 'DIVERIFIKASI' | 'REVISI') {
    if (aksi === 'REVISI' && !catatan.trim()) {
      toast.error('Isi catatan perbaikan terlebih dahulu')
      return
    }
    setProses(aksi)
    try {
      const res = await fetch('/api/pimpinan/logbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logbookId, aksi, catatan }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal memproses laporan')
      toast.success(
        aksi === 'DIVERIFIKASI'
          ? `Laporan ${periode} atas nama ${namaAsesi} telah diverifikasi`
          : 'Laporan dikembalikan ke asesi untuk diperbaiki'
      )
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Gagal memproses laporan')
    } finally {
      setProses(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Keputusan Verifikasi</CardTitle>
        <CardDescription>
          Periksa cek list harian di atas, lalu sahkan laporan atau minta perbaikan dengan
          memberikan catatan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="catatan-pimpinan">Catatan (wajib bila meminta perbaikan)</Label>
          <Textarea
            id="catatan-pimpinan"
            placeholder="Contoh: jumlah kasus pada tanggal 12 tidak sesuai register unit. Mohon dikoreksi."
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            rows={3}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => kirim('DIVERIFIKASI')} disabled={proses !== null} className="min-h-[40px]">
            {proses === 'DIVERIFIKASI' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BadgeCheck className="h-4 w-4" />
            )}
            Verifikasi &amp; Sahkan
          </Button>
          <Button
            variant="outline"
            onClick={() => kirim('REVISI')}
            disabled={proses !== null || !catatan.trim()}
            className="min-h-[40px] border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
          >
            {proses === 'REVISI' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Undo2 className="h-4 w-4" />
            )}
            Minta Perbaikan
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
