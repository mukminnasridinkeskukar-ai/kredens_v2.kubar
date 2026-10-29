import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      nama?: string
      /** v2.1 — fungsi tambahan akun, dipisah koma (ASESOR, PIMPINAN_FASYANKES, KETUA_TIM_KREDENSIAL) */
      peranEkstra?: string | null
      /** v2.1 — profesi ketua tim kredensial */
      profesi?: string | null
    }
  }
  interface User {
    role: string
    peranEkstra?: string | null
    profesi?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: string
    nama?: string
    /** v2.1 — fungsi tambahan akun, dipisah koma */
    peranEkstra?: string | null
    /** v2.1 — profesi ketua tim kredensial */
    profesi?: string | null
  }
}
