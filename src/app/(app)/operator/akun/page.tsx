import { requirePageRole } from '@/lib/role-guard'
import { db } from '@/lib/db'
import { AkunManager } from '@/components/kredens/staf/akun-manager'

export default async function OperatorAkunPage() {
  await requirePageRole(['OPERATOR_KREDENSIAL'])

  const daftar = await db.user.findMany({
    orderBy: [{ isActive: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      nama: true,
      email: true,
      role: true,
      nip: true,
      jabatan: true,
      instansi: true,
      isActive: true,
      createdAt: true,
    },
  })

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Verifikasi Akun</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pendaftaran akun mandiri (Asesi, Asesor, Pimpinan Fasyankes) harus Anda aktifkan
          sebelum pemiliknya dapat masuk ke aplikasi.
        </p>
      </div>
      <AkunManager daftar={daftar} />
    </div>
  )
}
