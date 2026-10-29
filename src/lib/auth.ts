import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import {
  cocokkanSandi,
  adalahSandiPolos,
  hashPassword,
  enkripsiSandi,
} from '@/lib/password'
import { cariPenggunaByEmail } from '@/lib/cari-user'
import { ensureDbReady } from '@/lib/bootstrap'

export const authOptions: NextAuthOptions = {
  // v1.3.6 — batas keras usia sesi 8 jam (pengamanan sesi); batas diam 15 menit
  // ditegakkan di sisi peramban oleh komponen PengamanLayar (AppShell).
  session: { strategy: 'jwt', maxAge: 60 * 60 * 8 },
  secret: process.env.NEXTAUTH_SECRET ?? 'kredens-dev-secret-change-me',
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'Akun KREDENS',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Kata Sandi', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        // Auto-setup produksi: buat tabel + data demo bila database masih kosong.
        // Idempoten — setelah eksekusi pertama, panggilan berikutnya tanpa biaya.
        await ensureDbReady()
        const kunciEmail = credentials.email.toLowerCase().trim()
        // v1.3.1 — pencarian email tidak case-sensitive (helper bersama dengan
        // /api/cek-akun): menangkap akun yang dibuat manual di konsol database
        // dengan huruf besar/bercampur, mis. "SuperAdmin@Kredens.go.id".
        const user = await cariPenggunaByEmail(kunciEmail)
        if (!user || !user.isActive) return null
        const sah = cocokkanSandi(credentials.password, user.passwordHash)
        if (!sah) return null
        // v1.3.1 — PEMULIHAN AKSES: bila passwordHash masih sandi polos (dulunya
        // diketik langsung di tabel database, mis. via konsol Neon), upgrade
        // OTOMATIS menjadi hash scrypt yang aman + isi salinan terenkripsi agar
        // sandi itu juga dapat dilihat superadmin. Terjadi satu kali saat login
        // pertama; login berikutnya memakai jalur hash normal.
        if (adalahSandiPolos(user.passwordHash)) {
          await db.user.update({
            where: { id: user.id },
            data: {
              passwordHash: hashPassword(credentials.password),
              sandiTersimpan: enkripsiSandi(credentials.password),
            },
          })
          console.log(
            `[audit] ${new Date().toISOString()} — sandi polos akun ${user.email} (dibuat manual di database) di-upgrade otomatis ke hash scrypt saat login`,
          )
        }
        return {
          id: user.id,
          email: user.email,
          name: user.nama,
          role: user.role,
          peranEkstra: user.peranEkstra ?? null,
          profesi: user.profesi ?? null,
        } as any
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Saat login — data sudah segar dari authorize().
        token.id = (user as any).id
        token.role = (user as any).role
        token.nama = (user as any).name
        token.name = (user as any).name
        token.peranEkstra = (user as any).peranEkstra ?? null
        token.profesi = (user as any).profesi ?? null
        return token
      }
      // Setelah login — segarkan identitas dari DB setiap pemeriksaan sesi
      // agar perubahan profil (nama/peran/fungsi tambahan) langsung tampil di
      // seluruh tampilan tanpa perlu login ulang. Akun yang dihapus/
      // dinonaktifkan kehilangan identitas sesinya sehingga semua guard
      // menolak (efek: ter-logout).
      if (token?.id) {
        try {
          const dbUser = await db.user.findUnique({
            where: { id: String(token.id) },
            select: { nama: true, role: true, isActive: true, peranEkstra: true, profesi: true },
          })
          if (!dbUser || !dbUser.isActive) {
            // Jangan kembalikan null (next-auth v4 mengabaikannya dan tetap
            // memakai token lama) — kosongkan identitasnya sebagai gantinya.
            return { ...token, id: undefined, role: undefined, nama: undefined, name: undefined, email: undefined, peranEkstra: undefined, profesi: undefined }
          }
          token.nama = dbUser.nama
          token.name = dbUser.nama
          token.role = dbUser.role
          token.peranEkstra = dbUser.peranEkstra
          token.profesi = dbUser.profesi
        } catch {
          // DB sesaat tidak terjangkau — pertahankan token lama agar sesi tidak rontok.
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        ;(session.user as any).id = token.id
        ;(session.user as any).role = token.role
        ;(session.user as any).nama = token.nama ?? token.name
        ;(session.user as any).peranEkstra = token.peranEkstra ?? null
        ;(session.user as any).profesi = token.profesi ?? null
      }
      return session
    },
  },
}
