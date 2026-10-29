import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

/** Ambil sesi server; null bila belum login. */
export async function getSession() {
  return getServerSession(authOptions)
}

/** Guard API — mengembalikan Response bila ditolak, atau sesi bila lolos. */
export async function requireSession(): Promise<
  { ok: true; session: NonTypeSession } | { ok: false; response: NextResponse }
> {
  const session = await getSession()
  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 }),
    }
  }
  return { ok: true, session: session as NonTypeSession }
}

type NonTypeSession = {
  user: { id: string; email: string; name: string; role: string }
}
