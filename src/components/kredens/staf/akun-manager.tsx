'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { BadgeCheck, Check, Loader2, ShieldQuestion, Trash2, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ROLE_LABELS } from '@/lib/constants'
import { formatTanggal } from '@/lib/format'

type BarisAkun = {
  id: string
  nama: string
  email: string
  role: string
  nip: string | null
  jabatan: string | null
  instansi: string | null
  isActive: boolean
  createdAt: Date
}

function BadgeStatus({ aktif }: { aktif: boolean }) {
  return aktif ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
      <BadgeCheck className="h-3.5 w-3.5" /> Aktif
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
      <ShieldQuestion className="h-3.5 w-3.5" /> Menunggu Verifikasi
    </span>
  )
}

function Baris({
  akun,
  onAktifkan,
  onHapus,
  bisaHapus,
  sementara,
}: {
  akun: BarisAkun
  onAktifkan: (id: string) => void
  onHapus: (id: string) => void
  bisaHapus: boolean
  sementara: boolean
}) {
  return (
    <div className="flex flex-col gap-3 border-b p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-foreground">{akun.nama}</p>
          <BadgeStatus aktif={akun.isActive} />
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {ROLE_LABELS[akun.role] ?? akun.role}
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{akun.email}</p>
        <p className="text-xs text-muted-foreground">
          {[akun.jabatan, akun.instansi].filter(Boolean).join(' · ') || 'Instansi tidak diisi'} ·
          Mendaftar {formatTanggal(akun.createdAt)}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        {!akun.isActive && (
          <Button size="sm" onClick={() => onAktifkan(akun.id)} disabled={sementara} className="min-h-[36px]">
            {sementara ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Aktifkan
          </Button>
        )}
        {bisaHapus && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onHapus(akun.id)}
            disabled={sementara}
            className="min-h-[36px] border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" /> Hapus
          </Button>
        )}
      </div>
    </div>
  )
}

export function AkunManager({ daftar }: { daftar: BarisAkun[] }) {
  const router = useRouter()
  const [sementara, mulai] = useTransition()
  const [hapusId, setHapusId] = useState<string | null>(null)

  const menunggu = daftar.filter((u) => !u.isActive)
  const aktif = daftar.filter((u) => u.isActive)

  async function aktifkan(id: string) {
    const res = await fetch('/api/staf/akun', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      toast.error(data?.error ?? 'Gagal mengaktifkan akun.')
      return
    }
    toast.success(data?.pesan ?? 'Akun diaktifkan.')
    mulai(() => router.refresh())
  }

  async function hapus(id: string) {
    setHapusId(null)
    const res = await fetch(`/api/staf/akun?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      toast.error(data?.error ?? 'Gagal menghapus akun.')
      return
    }
    toast.success(data?.pesan ?? 'Pendaftaran dihapus.')
    mulai(() => router.refresh())
  }

  const targetHapus = daftar.find((u) => u.id === hapusId)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5 text-primary" /> Menunggu Verifikasi
            {menunggu.length > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                {menunggu.length}
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Akun baru hasil pendaftaran mandiri. Aktifkan bila identitas meyakinkan, atau hapus
            untuk menolak pendaftaran.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {menunggu.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              Tidak ada pendaftaran yang menunggu verifikasi.
            </p>
          ) : (
            menunggu.map((u) => (
              <Baris
                key={u.id}
                akun={u}
                onAktifkan={aktifkan}
                onHapus={setHapusId}
                bisaHapus
                sementara={sementara}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Akun Aktif</CardTitle>
          <CardDescription>Seluruh pengguna yang dapat masuk ke aplikasi.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {aktif.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Belum ada akun aktif.</p>
          ) : (
            aktif.map((u) => (
              <Baris
                key={u.id}
                akun={u}
                onAktifkan={aktifkan}
                onHapus={setHapusId}
                bisaHapus={false}
                sementara={sementara}
              />
            ))
          )}
        </CardContent>
      </Card>

      <AlertDialog open={hapusId !== null} onOpenChange={(o) => !o && setHapusId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pendaftaran ini?</AlertDialogTitle>
            <AlertDialogDescription>
              {targetHapus
                ? `Akun ${targetHapus.nama} (${targetHapus.email}) akan dihapus permanen dan tidak dapat dipulihkan. Pemiliknya perlu mendaftar ulang bila masih berminat.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => hapusId && hapus(hapusId)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
