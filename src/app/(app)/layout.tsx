import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { AppShell } from '@/components/kredens/app-shell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  // v2.3 — metadata foto profil untuk avatar header/sidebar. Isi gambar tidak
  // dibaca di sini (cukup penanda ada/tidak + versi untuk cache-busting URL).
  const pengguna = await db.user.findUnique({
    where: { id: session.user.id },
    select: { fotoTipe: true, fotoPada: true },
  })

  return (
    <AppShell
      role={session.user.role}
      userNama={session.user.name ?? 'Pengguna'}
      userEmail={session.user.email ?? ''}
      peranEkstra={session.user.peranEkstra ?? null}
      profesi={session.user.profesi ?? null}
      fotoAda={!!pengguna?.fotoTipe}
      fotoVersi={pengguna?.fotoPada ? pengguna.fotoPada.getTime() : null}
    >
      {children}
    </AppShell>
  )
}
