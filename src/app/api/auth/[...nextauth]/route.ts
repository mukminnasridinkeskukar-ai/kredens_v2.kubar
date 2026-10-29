import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// Percobaan login pertama dapat memicu auto-setup database (buat tabel +
// data demo). Beri waktu eksekusi cukup di serverless Vercel.
export const maxDuration = 60

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
