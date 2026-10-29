import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ROLE_LABELS } from '@/lib/constants'
import { Construction, HeartPulse } from 'lucide-react'

export function DashboardPlaceholder({ role, nama }: { role: string; nama: string }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary to-[#0b6b2f] p-6 text-primary-foreground shadow-sm sm:pr-36">
        <div className="absolute -right-4 -top-4 hidden h-28 w-28 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm sm:flex">
          <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white shadow-md">
            <Image
              src="/logo-kubar.png"
              alt="Logo KREDENS"
              width={64}
              height={64}
              className="h-16 w-16 object-contain"
            />
          </div>
        </div>
        <p className="text-sm text-primary-foreground/80">Selamat datang di KREDENS</p>
        <h1 className="mt-1 text-xl font-bold sm:text-2xl">{nama || ROLE_LABELS[role] || 'Pengguna'}</h1>
        <p className="mt-2 text-sm text-primary-foreground/90">
          Anda masuk sebagai {ROLE_LABELS[role] ?? role}. Dinas Kesehatan Kabupaten Kutai Barat.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5 text-amber-500" />
            Modul Sedang Dikembangkan
          </CardTitle>
          <CardDescription>
            Panel kerja {ROLE_LABELS[role] ?? role} akan tersedia pada fase pengembangan
            berikutnya.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Saat ini platform KREDENS baru membuka modul lengkap untuk akun Asesi (tenaga medis
            dan tenaga kesehatan pengusul). Fungsi telaah, penilaian, dan penetapan untuk
            {` ${ROLE_LABELS[role] ?? 'akun Anda'} `}sedang disiapkan agar sesuai alur
            kredensialing Dinas Kesehatan Kabupaten Kutai Barat.
          </p>
          <div className="rounded-xl border border-dashed bg-muted/40 p-6">
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <HeartPulse className="h-10 w-10 text-primary/40" />
              <p className="text-sm">
                Nantikan pembaruan modul {ROLE_LABELS[role] ?? role} pada rilis berikutnya.
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Pertanyaan terkait akses akun dapat disampaikan kepada Operator Kredensial Dinas
            Kesehatan Kabupaten Kutai Barat.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
