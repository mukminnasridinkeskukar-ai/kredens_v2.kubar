import { db } from '@/lib/db'

/**
 * Otorisasi pimpinan fasyankes atas asesi.
 *
 * Aturan (fitur "tempat bekerja sebagai option"):
 * 1. Sumber kebenaran utama = TempatKerja (master data fasyankes yang
 *    dikelola Superadmin). Pimpinan dan asesi masing-masing terhubung ke
 *    satu TempatKerja melalui kolom tempatKerjaId. Keduanya WAJIB cocok —
 *    pimpinan fasyankes lain tidak boleh memproses asesi di luar
 *    fasyankesnya.
 * 2. Fallback untuk data lama yang belum ter-link: pencocokan nama
 *    (User.instansi vs Pengajuan.fasyankes). Bila keduanya terisi tetapi
 *    berbeda, akses ditolak.
 *
 * Seluruh endpoint & halaman pimpinan wajib memakai helper ini agar
 * konsisten: verifikasi logbook, unggah SPK, dan daftar pengajuan.
 */

export type WewenangPimpinan = {
  tempatKerjaId: string | null
  instansi: string | null
  nama: string
}

export function pimpinanWewenangError(
  w: WewenangPimpinanPlus,
  fasyankes: string | null
): string {
  return `Pengajuan ini milik fasyankes "${fasyankes ?? '—'}" — bukan wewenang Anda (${w.tempatKerja?.nama ?? w.instansi ?? 'tempat kerja belum ditetapkan'})`
}

export type WewenangPimpinanPlus = WewenangPimpinan & {
  tempatKerja?: { nama: string } | null
}

/** Ambil identitas wewenang pimpinan (tempat kerja + instansi) dari DB. */
export async function ambilWewenangPimpinan(
  userId: string
): Promise<WewenangPimpinanPlus | null> {
  const u = await db.user.findUnique({
    where: { id: userId },
    select: {
      nama: true,
      instansi: true,
      tempatKerjaId: true,
      tempatKerja: { select: { nama: true, aktif: true } },
    },
  })
  if (!u) return null
  return u
}

/**
 * Keputusan wewenang pimpinan atas satu asesi.
 * @param pimpinan  identitas pimpinan (dari ambilWewenangPimpinan)
 * @param asesiTKId tempatKerjaId asesi (dari AsesiProfile, boleh null)
 * @param fasyankes nama fasyankes pada pengajuan (snapshot, boleh null)
 */
export function pimpinanBolehAkses(
  pimpinan: WewenangPimpinanPlus | null,
  asesiTKId: string | null | undefined,
  fasyankes: string | null | undefined
): { ok: boolean; alasan?: string } {
  if (!pimpinan) return { ok: false, alasan: 'Akun pimpinan tidak ditemukan' }

  // 1) Cocokkan via TempatKerja (utama)
  if (pimpinan.tempatKerjaId) {
    if (asesiTKId) {
      if (pimpinan.tempatKerjaId === asesiTKId) return { ok: true }
      return {
        ok: false,
        alasan: pimpinanWewenangError(pimpinan, fasyankes ?? null),
      }
    }
    // Asesi belum ter-link TempatKerja → jatuh ke pencocokan nama
  }

  // 2) Fallback nama (data lama): instansi pimpinan vs fasyankes pengajuan
  const a = pimpinan.instansi?.trim()
  const b = fasyankes?.trim()
  if (a && b && a === b) return { ok: true }

  return {
    ok: false,
    alasan: pimpinanWewenangError(pimpinan, fasyankes ?? null),
  }
}
