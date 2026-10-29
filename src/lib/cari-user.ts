import { db } from '@/lib/db'

/**
 * v1.3.1 — Cari akun berdasarkan email TANPA memedulikan huruf besar/kecil.
 *
 * Latar belakang: akun yang dibuat/diedit manual lewat konsol database
 * (mis. Neon) kadang ber-email "SuperAdmin@Kredens.GO.ID". Pencarian persis
 * huruf-kecil gagal menemukannya sehingga login tampak "sandi salah" padahal
 * sandi benar. Kueri fallback memakai LOWER() yang portable di SQLite maupun
 * Postgres, dan tetap ber-parameterisasi (aman dari injeksi).
 *
 * Dipakai oleh: authorize() (login) dan /api/cek-akun agar perilaku keduanya
 * konsisten.
 */
export async function cariPenggunaByEmail(email: string) {
  const kunci = String(email ?? '').toLowerCase().trim()
  if (!kunci) return null
  const persis = await db.user.findUnique({ where: { email: kunci } })
  if (persis) return persis
  try {
    const baris = await db.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "User" WHERE LOWER("email") = LOWER(${kunci}) LIMIT 1
    `
    if (baris?.[0]?.id) {
      return await db.user.findUnique({ where: { id: baris[0].id } })
    }
  } catch {
    // Tabel belum siap / dialek tak dikenal — perlakukan sebagai tak ada.
  }
  return null
}
