import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getAuthSession } from '@/lib/role-guard'
import { KelolaAkunManager } from '@/components/kredens/superadmin/kelola-akun-manager'
import { TempatKerjaManager } from '@/components/kredens/superadmin/tempat-kerja-manager'

export const metadata = { title: 'Kelola Akun — KREDENS' }

export default async function KelolaAkunPage() {
  const session = await getAuthSession()
  if (session.role !== 'SUPERADMIN') redirect('/dashboard')

  const daftar = await db.user.findMany({
    orderBy: [{ isActive: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      nama: true,
      email: true,
      role: true,
      peranEkstra: true, // v2.1 — fungsi tambahan akun
      profesi: true, // v2.1 — profesi ketua tim kredensial
      nip: true,
      jabatan: true,
      instansi: true,
      telepon: true,
      isActive: true,
      createdAt: true,
      tempatKerja: { select: { nama: true } },
      sandiTersimpan: true,
      _count: { select: { pengajuan: true } },
    },
  })

  // Salinan sandi terenkripsi TIDAK PERNAH dikirim ke klien — hanya penanda
  // ketersediaannya (v1.3.0). Dekripsi terjadi hanya via API superadmin.
  const daftarAman = daftar.map(({ sandiTersimpan, ...u }) => ({
    ...u,
    sandiAda: Boolean(sandiTersimpan),
  }))

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kelola Akun</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Akses penuh atas seluruh akun platform: verifikasi pendaftaran mandiri, aktifkan atau
          nonaktifkan, ubah peran dan data, lihat sandi, ganti username, reset kata sandi, hingga
          hapus akun. Hanya Superadmin yang memiliki akses ini.
        </p>
      </div>
      <KelolaAkunManager daftar={daftarAman} selfId={session.id} />
      <TempatKerjaManager />
    </div>
  )
}
