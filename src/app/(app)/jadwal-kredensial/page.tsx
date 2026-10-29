import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatTanggal } from '@/lib/format'
import { JADWAL_TAHAP, JADWAL_STATUS } from '@/lib/constants'
import { CalendarDays, Clock, MapPin, Milestone } from 'lucide-react'

export default async function JadwalKredensialPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const pengajuan = await db.pengajuan.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: { jadwal: { orderBy: { tanggal: 'asc' } } },
  })

  const jadwal = pengajuan?.jadwal ?? []

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Jadwal Kredensial</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Agenda proses kredensialing Anda — telaah berkas, asesmen, penilaian lapangan, hingga
          penetapan kewenangan.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agenda Terjadwal</CardTitle>
          <CardDescription>
            {pengajuan ? `Terkait pengajuan ${pengajuan.kode}` : 'Belum ada pengajuan aktif'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jadwal.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-12 text-center">
              <CalendarDays className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Belum ada jadwal kredensial. Jadwal akan ditetapkan oleh Operator Kredensial
                setelah pengajuan Anda diproses.
              </p>
            </div>
          ) : (
            <div className="relative space-y-4 border-l-2 border-primary/20 pl-6">
              {jadwal.map((j) => (
                <div key={j.id} className="relative">
                  <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-primary bg-background" />
                  <div className="rounded-xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{j.keterangan ?? 'Agenda kredensial'}</p>
                      <Badge
                        variant="outline"
                        className={
                          j.status === 'TERJADWAL'
                            ? 'border-amber-200 bg-amber-50 text-amber-700'
                            : j.status === 'SELESAI'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-red-200 bg-red-50 text-red-700'
                        }
                      >
                        {JADWAL_STATUS[j.status] ?? j.status}
                      </Badge>
                    </div>
                    <div className="mt-2 grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
                      <p className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-primary" />
                        {formatTanggal(j.tanggal)}
                      </p>
                      {j.waktu && (
                        <p className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" /> {j.waktu}
                        </p>
                      )}
                      {j.tempat && (
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" /> {j.tempat}
                        </p>
                      )}
                      <p className="flex items-center gap-2">
                        <Milestone className="h-4 w-4 text-primary" />
                        Tahap: {JADWAL_TAHAP[j.tahap] ?? j.tahap}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
