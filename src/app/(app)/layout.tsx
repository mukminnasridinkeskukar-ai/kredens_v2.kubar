import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AppShell } from '@/components/kredens/app-shell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  return (
    <AppShell
      role={session.user.role}
      userNama={session.user.name ?? 'Pengguna'}
      userEmail={session.user.email ?? ''}
      peranEkstra={session.user.peranEkstra ?? null}
      profesi={session.user.profesi ?? null}
    >
      {children}
    </AppShell>
  )
}
