'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, Edit3, FileDown, FileText, Loader2, RefreshCw, Upload } from 'lucide-react'
import { formatTanggal } from '@/lib/format'

export type DokumenInfo = {
  id: string
  namaFile: string
  tipeFile: string
  ukuran: number
  diunggahOleh: string | null
  createdAt: Date | string
}

const TIPE_OK = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const MAKS = 5 * 1024 * 1024

function ukuranTeks(b: number): string {
  if (b >= 1024 * 1024) return `${(b / 1024 / 1024).toFixed(2)} MB`
  return `${Math.max(1, Math.round(b / 1024))} KB`
}

/**
 * Panel unggah dokumen pindaian (SPK oleh pimpinan fasyankes / RKK oleh
 * ketua tim kredensial). Satu dokumen aktif per jenis — unggah ulang
 * menimpa dokumen sebelumnya. Dokumen dapat diunduh asesi dari akunnya.
 *
 * Bila `templateHref` diisi (SPK), tombol "Template Contoh (PDF)" dan —
 * bila `templateDocxHref` juga diisi (v1.3.4) — tombol "Template Contoh
 * (Word)" tampil di SEBELAH KIRI tombol unggah — membuka contoh format
 * surat (PDF siap cetak / DOCX yang dapat diedit, lengkap dengan
 * notifikasi KOP FASYANKES di bagian atas) yang datanya sudah terisi
 * dari pengajuan.
 */
export function DokumenUpload({
  pengajuanId,
  jenis,
  apiPath,
  judul,
  deskripsi,
  dokumen,
  templateHref,
  templateDocxHref,
}: {
  pengajuanId: string
  jenis: 'SPK' | 'RKK'
  apiPath: string
  judul: string
  deskripsi: string
  dokumen: DokumenInfo | null
  templateHref?: string
  templateDocxHref?: string
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [unggah, setUnggah] = useState(false)

  async function kirim(file: File) {
    if (!TIPE_OK.includes(file.type)) {
      toast.error('Format file harus PDF, JPG, PNG, atau WebP')
      return
    }
    if (file.size > MAKS) {
      toast.error(`Ukuran file maksimal 5 MB (file Anda ${(file.size / 1024 / 1024).toFixed(2)} MB)`)
      return
    }
    if (dokumen && !window.confirm(`Unggah ulang akan MENIMPA dokumen "${dokumen.namaFile}" yang sudah ada. Lanjutkan?`)) {
      return
    }
    setUnggah(true)
    try {
      // Protokol binary langsung (bukan multipart) — body = isi file,
      // metadata dikirim via header. Menghindari bug Next.js 16 yang
      // salah mendeteksi POST multipart sebagai Server Action.
      const res = await fetch(`${apiPath}?pengajuanId=${encodeURIComponent(pengajuanId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
          'X-File-Name': encodeURIComponent(file.name),
        },
        body: file,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal mengunggah dokumen')
      toast.success(`Dokumen ${jenis} berhasil diunggah — asesi dapat mengunduhnya dari akunnya`)
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Gagal mengunggah dokumen')
    } finally {
      setUnggah(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" /> {judul}
        </CardTitle>
        <CardDescription>{deskripsi}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {dokumen && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 p-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{dokumen.namaFile}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {ukuranTeks(dokumen.ukuran)} · Diunggah {formatTanggal(String(dokumen.createdAt))}
                {dokumen.diunggahOleh ? ` oleh ${dokumen.diunggahOleh}` : ''}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700">
                Terunggah
              </Badge>
              <Button asChild variant="outline" size="sm" className="min-h-[36px]">
                <a href={`/api/dokumen/${dokumen.id}`} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" /> Lihat
                </a>
              </Button>
            </div>
          </div>
        )}

        <div>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) kirim(f)
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            {templateHref && (
              <Button asChild variant="outline" className="min-h-[40px]">
                <a href={templateHref} target="_blank" rel="noopener noreferrer">
                  <FileDown className="h-4 w-4" /> Template Contoh (PDF)
                </a>
              </Button>
            )}
            {templateDocxHref && (
              <Button asChild variant="outline" className="min-h-[40px]">
                <a href={templateDocxHref} target="_blank" rel="noopener noreferrer">
                  <Edit3 className="h-4 w-4" /> Template Contoh (Word)
                </a>
              </Button>
            )}
            <Button onClick={() => inputRef.current?.click()} disabled={unggah} className="min-h-[40px]">
              {unggah ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : dokumen ? (
                <RefreshCw className="h-4 w-4" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {dokumen ? 'Ganti Dokumen' : `Unggah Dokumen ${jenis}`}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Format PDF, JPG, PNG, atau WebP · maksimal 5 MB.
            {dokumen && ' Unggah ulang akan menimpa dokumen sebelumnya.'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
