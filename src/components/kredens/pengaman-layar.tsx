'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BATAS_IDLE_MENIT, SITUS_UTAMA } from '@/lib/constants'
import { keluarKeSitusUtama } from '@/lib/keluar'

const BATAS_IDLE_MS = BATAS_IDLE_MENIT * 60 * 1000
const PERINGATAN_MS = 60 * 1000 // dialog muncul 1 menit sebelum sesi berakhir

/** Escape karakter XML untuk teks di dalam SVG watermark. */
function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c] as string,
  )
}

/** Pola watermark diagonal berulang (data-URI SVG) bertanda identitas pengguna. */
function polaWatermark(teks: string): string {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='200'>` +
    `<text x='240' y='100' fill='rgba(0,144,53,0.09)' font-family='sans-serif' ` +
    `font-size='12.5' font-weight='600' text-anchor='middle' ` +
    `transform='rotate(-22 240 100)'>${teks}</text></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

/**
 * Pengamanan layar standar KREDENS (v1.3.6):
 * 1. Watermark identitas (nama + email + tanggal) di seluruh halaman aplikasi
 *    — pelacakan bila konten dibocorkan.
 * 2. Pemblokiran percobaan tangkap/cetak/salin: tombol PrintScreen (papan klip
 *    dikosongkan), Ctrl/Cmd+P (cetak), Ctrl/Cmd+S (simpan), Ctrl/Cmd+U,
 *    F12 & Ctrl/Cmd+Shift+I/J/C (alat pengembang), salin-tempel konten
 *    (input formulir tetap boleh), klik kanan, seret gambar/tautan.
 * 3. Konten otomatis disembunyikan (blur) saat jendela tidak aktif —
 *    termasuk saat alat tangkap layar di luar peramban dibuka.
 * 4. Batas diam 15 menit: dialog peringatan 1 menit sebelum berakhir, lalu
 *    sesi diakhiri otomatis dan pengguna dikembalikan ke situs utama.
 *
 * Catatan teknis: peramban tidak dapat mencegah tangkapan layar di tingkat
 * sistem operasi (mis. tangkapan bawaan macOS/Android); lapisan di atas adalah
 * pengamanan standar web + penandaan identitas sebagai pencegah dan penjerret.
 */
export function PengamanLayar({ nama, email }: { nama: string; email: string }) {
  const [tersembunyi, setTersembunyi] = useState(false)
  const [sisaDetik, setSisaDetik] = useState<number | null>(null)
  // Tanggal tanda air dihitung hanya di klien setelah hidrasi — menghindari
  // ketidakcocokan hidrasi SSR (zona waktu server != zona waktu pengguna).
  const [tanggalTanda, setTanggalTanda] = useState('')
  const terakhirRef = useRef(Date.now())
  const keluarRef = useRef(false)
  const toastTerakhirRef = useRef(0)

  useEffect(() => {
    setTanggalTanda(new Date().toLocaleDateString('id-ID'))
  }, [])

  // Celah uji e2e (hanya aktif di lingkungan pengembangan): durasi idle dapat
  // dipersingkat via sessionStorage. Di produksi selalu nilai penuh.
  const [idleMs] = useState<number>(() => {
    if (typeof window === 'undefined') return BATAS_IDLE_MS
    if (process.env.NODE_ENV === 'production') return BATAS_IDLE_MS
    const uji = Number(window.sessionStorage.getItem('KREDENS_UJI_IDLE_MS') || 0)
    return uji > 0 ? uji : BATAS_IDLE_MS
  })
  const peringatanMs = Math.min(PERINGATAN_MS, Math.floor(idleMs / 3))

  const tandaiAktif = useCallback(() => {
    terakhirRef.current = Date.now()
  }, [])

  const beriTahu = useCallback((pesan: string) => {
    const kini = Date.now()
    if (kini - toastTerakhirRef.current < 4000) return
    toastTerakhirRef.current = kini
    toast.warning(pesan)
  }, [])

  // 4a. Batas diam + penghitung peringatan
  useEffect(() => {
    const peristiwa = ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const
    peristiwa.forEach((ev) => window.addEventListener(ev, tandaiAktif, { passive: true }))

    const periksa = () => {
      if (keluarRef.current) return
      const sisa = idleMs - (Date.now() - terakhirRef.current)
      if (sisa <= 0) {
        keluarRef.current = true
        void keluarKeSitusUtama()
      } else if (sisa <= peringatanMs) {
        setSisaDetik(Math.max(1, Math.ceil(sisa / 1000)))
      } else {
        setSisaDetik(null)
      }
    }
    const id = setInterval(periksa, 1000)
    const vis = () => {
      if (document.visibilityState === 'visible') periksa()
    }
    document.addEventListener('visibilitychange', vis)
    return () => {
      peristiwa.forEach((ev) => window.removeEventListener(ev, tandaiAktif))
      clearInterval(id)
      document.removeEventListener('visibilitychange', vis)
    }
  }, [idleMs, peringatanMs, tandaiAktif])

  // 4b. Sembunyikan konten saat jendela/tab tidak aktif
  useEffect(() => {
    const sembunyikan = () => setTersembunyi(true)
    const tampilkan = () => {
      if (document.visibilityState !== 'hidden') setTersembunyi(false)
    }
    window.addEventListener('blur', sembunyikan)
    window.addEventListener('focus', tampilkan)
    document.addEventListener('visibilitychange', tampilkan)
    return () => {
      window.removeEventListener('blur', sembunyikan)
      window.removeEventListener('focus', tampilkan)
      document.removeEventListener('visibilitychange', tampilkan)
    }
  }, [])

  // 2. Pemblokiran tombol & papan klip
  useEffect(() => {
    const kosongkanPapanKlip = () => {
      try {
        void navigator.clipboard?.writeText('').catch(() => {})
      } catch {
        // izin papan klip tidak tersedia — abaikan
      }
    }
    const onKey = (e: KeyboardEvent) => {
      const k = (e.key || '').toLowerCase()
      if (e.key === 'PrintScreen') {
        kosongkanPapanKlip()
        setTimeout(kosongkanPapanKlip, 250)
        e.preventDefault()
        beriTahu('Tangkapan layar tidak diizinkan pada platform KREDENS.')
        return
      }
      const combo = e.ctrlKey || e.metaKey
      if (combo && ['p', 's', 'u'].includes(k)) {
        e.preventDefault()
        beriTahu('Cetak / simpan halaman dinonaktifkan demi keamanan dokumen.')
        return
      }
      if (e.key === 'F12' || (combo && e.shiftKey && ['i', 'j', 'c'].includes(k))) {
        e.preventDefault()
        beriTahu('Alat pengembang dinonaktifkan demi keamanan dokumen.')
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        kosongkanPapanKlip()
        setTimeout(kosongkanPapanKlip, 250)
        beriTahu('Tangkapan layar tidak diizinkan pada platform KREDENS.')
      }
    }
    const bolehSalin = (t: EventTarget | null) => {
      const el = t as HTMLElement | null
      return (
        !!el &&
        (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
      )
    }
    const onCopy = (e: ClipboardEvent) => {
      if (bolehSalin(e.target)) return
      e.preventDefault()
      beriTahu('Penyalinan konten tidak diizinkan.')
    }
    const onCut = (e: ClipboardEvent) => {
      if (bolehSalin(e.target)) return
      e.preventDefault()
    }
    const onMenu = (e: MouseEvent) => e.preventDefault()
    const onDrag = (e: DragEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'IMG' || el.tagName === 'A')) e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('copy', onCopy)
    window.addEventListener('cut', onCut)
    window.addEventListener('contextmenu', onMenu)
    window.addEventListener('dragstart', onDrag)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('copy', onCopy)
      window.removeEventListener('cut', onCut)
      window.removeEventListener('contextmenu', onMenu)
      window.removeEventListener('dragstart', onDrag)
    }
  }, [beriTahu])

  const tanda = `${nama} · ${email} · KREDENS v2.kubar${tanggalTanda ? ` · ${tanggalTanda}` : ''}`

  return (
    <>
      {/* Watermark identitas — di atas konten, tidak mengganggu interaksi */}
      <div
        aria-hidden
        data-testid="pengaman-watermark"
        className="pengaman-watermark"
        style={{ backgroundImage: polaWatermark(escapeXml(tanda)) }}
      />

      {/* Tirai saat jendela tidak aktif */}
      {tersembunyi && (
        <div
          data-testid="pengaman-tirai"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-xl"
          onMouseDown={() => setTersembunyi(false)}
        >
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground">Konten disembunyikan</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Jendela tidak aktif — klik di mana saja untuk menampilkan kembali.
            </p>
          </div>
        </div>
      )}

      {/* Dialog peringatan sesi hampir berakhir */}
      <Dialog
        open={sisaDetik !== null}
        onOpenChange={(o) => {
          if (!o) {
            tandaiAktif()
            setSisaDetik(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sesi tidak aktif</DialogTitle>
            <DialogDescription>
              Anda tidak beraktivitas selama hampir {BATAS_IDLE_MENIT} menit. Demi keamanan,
              sesi akan berakhir dan Anda dikembalikan ke situs utama ({SITUS_UTAMA.replace(/^https?:\/\//, '')})
              dalam {sisaDetik ?? 0} detik.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              onClick={() => {
                tandaiAktif()
                setSisaDetik(null)
              }}
            >
              Lanjutkan Sesi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
