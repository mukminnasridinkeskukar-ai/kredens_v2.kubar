'use client'

import { signOut } from 'next-auth/react'
import { SITUS_UTAMA } from '@/lib/constants'

/**
 * Akhiri sesi lalu kembalikan pengguna ke situs utama (mukminnasri.com).
 * signOut dengan redirect:false dipakai karena callbackUrl NextAuth tidak
 * menerima URL eksternal — pengalihan dilakukan manual di sisi peramban.
 */
export async function keluarKeSitusUtama(): Promise<void> {
  try {
    await signOut({ redirect: false })
  } catch {
    // tetap alihkan walau signOut gagal (mis. sesi sudah hangus)
  }
  window.location.assign(SITUS_UTAMA)
}
