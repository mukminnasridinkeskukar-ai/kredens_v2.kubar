import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { uraikanPeranEkstra } from '@/lib/constants'

type SessionUser = {
  id: string
  email: string
  name: string
  role: string
  /** v2.1 — fungsi tambahan akun dipisah koma (ASESOR, PIMPINAN_FASYANKES, KETUA_TIM_KREDENSIAL) */
  peranEkstra?: string | null
  /** v2.1 — profesi ketua tim kredensial */
  profesi?: string | null
}

/** Sesi untuk halaman server; redirect ke /login bila belum masuk. */
export async function getAuthSession(): Promise<SessionUser> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  return session.user as SessionUser
}

/** SUPERADMIN adalah pengguna dengan akses penuh: lolos di semua guard halaman
 * dan API. Dengan begitu seluruh modul staf (verifikasi berkas, penilaian,
 * rekomendasi tim, ketetapan kadis, SPK, jadwal) serta seluruh datanya dapat
 * dibuka superadmin tanpa perlu mendaftarkan rolenya satu per satu. */
export function isSuperadmin(role: string): boolean {
  return role === 'SUPERADMIN'
}

/** v2.1 — daftar fungsi tambahan satu akun (dari kolom peranEkstra). */
export function peranTambahan(user: Pick<SessionUser, 'peranEkstra'>): string[] {
  return uraikanPeranEkstra(user.peranEkstra)
}

/** v2.1 — benarkah akun memegang salah satu peran yang ditanyakan, baik
 *  sebagai peran utama maupun fungsi tambahan (multi-fungsi)?
 *  Dipakai guard halaman/API dan logika tampilan per-peran. */
export function punyaPeran(
  user: Pick<SessionUser, 'role' | 'peranEkstra'>,
  allowed: string[]
): boolean {
  if (allowed.includes(user.role)) return true
  return peranTambahan(user).some((r) => allowed.includes(r))
}

/** Guard halaman: pastikan role (utama atau fungsi tambahan) termasuk daftar;
 *  selain itu kembali ke dashboard. */
export async function requirePageRole(allowed: string[]): Promise<SessionUser> {
  const user = await getAuthSession()
  if (!isSuperadmin(user.role) && !punyaPeran(user, allowed)) redirect('/dashboard')
  return user
}

/** Guard API: pastikan role (utama atau fungsi tambahan) termasuk daftar;
 *  selain itu tolak 403. */
export async function requireApiRole(
  allowed: string[]
): Promise<{ ok: true; user: SessionUser } | { ok: false; response: NextResponse }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { ok: false, response: NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 }) }
  }
  const user = session.user as SessionUser
  if (!isSuperadmin(user.role) && !punyaPeran(user, allowed)) {
    return { ok: false, response: NextResponse.json({ error: 'Peran Anda tidak berwenang untuk aksi ini' }, { status: 403 }) }
  }
  return { ok: true, user }
}

export const ROLE_PENILAI = ['ASESOR', 'MITRA_BESTARI', 'KETUA_TIM_KREDENSIAL']

/** v2.1 — apakah akun ini menjalankan fungsi ASESOR pada konteks tertentu?
 *  Benar bila ASESOR peran utamanya ATAU tercantum pada fungsi tambahan. */
export function sebagaiAsesor(user: Pick<SessionUser, 'role' | 'peranEkstra'>): boolean {
  return punyaPeran(user, ['ASESOR'])
}

/** v2.1 — apakah akun ini menjalankan fungsi Ketua Tim Kredensial? */
export function sebagaiKetuaTim(user: Pick<SessionUser, 'role' | 'peranEkstra'>): boolean {
  return punyaPeran(user, ['KETUA_TIM_KREDENSIAL'])
}

/** v2.1 — apakah akun ini menjalankan fungsi Pimpinan Fasyankes? */
export function sebagaiPimpinan(user: Pick<SessionUser, 'role' | 'peranEkstra'>): boolean {
  return punyaPeran(user, ['PIMPINAN_FASYANKES'])
}
