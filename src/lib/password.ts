import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'crypto'

/**
 * Kata sandi disimpan dalam dua bentuk:
 *  1. `passwordHash`  — scrypt SATU-ARAH (untuk verifikasi login). Tidak dapat
 *     dibalik; inilah lapisan keamanan utama.
 *  2. `sandiTersimpan` — salinan TERENKRIPSI dua-arah AES-256-GCM (sejak
 *     v1.3.0), hanya untuk fitur superadmin "lihat sandi". Kunci enkripsi
 *     diturunkan dari NEXTAUTH_SECRET server, sehingga salinan ini tidak
 *     dapat dibaca siapa pun tanpa akses server + secret.
 *
 * Format salinan: aesgcm1:<iv hex>:<tag hex>:<cipher hex>
 * Ganti NEXTAUTH_SECRET membuat salinan lama tak terbaca (fitur menampilkan
 * "tidak tersimpan") — akun tetap bisa login, dan superadmin tinggal reset.
 */

const AWALAN_SALINAN = 'aesgcm1'

function kunciSandi(): Buffer {
  const sumber =
    process.env.KREDENS_KUNCI_SANDI ??
    process.env.NEXTAUTH_SECRET ??
    'kredens-kunci-cadangan-ganti-di-produksi'
  return createHash('sha256').update(`kredens-sandi:${sumber}`).digest()
}

/** Enkripsi sandi menjadi salinan yang dapat dibaca ulang superadmin. */
export function enkripsiSandi(sandi: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', kunciSandi(), iv)
  const terenkripsi = Buffer.concat([cipher.update(sandi, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${AWALAN_SALINAN}:${iv.toString('hex')}:${tag.toString('hex')}:${terenkripsi.toString('hex')}`
}

/** Baca salinan terenkripsi menjadi sandi asli; null bila tidak tersedia/tak
 *  valid (mis. dibuat dengan NEXTAUTH_SECRET yang berbeda). */
export function dekripsiSandi(terenkripsi: string | null | undefined): string | null {
  if (!terenkripsi) return null
  try {
    const [awalan, ivHex, tagHex, cipherHex] = terenkripsi.split(':')
    if (awalan !== AWALAN_SALINAN || !ivHex || !tagHex || !cipherHex) return null
    const decipher = createDecipheriv('aes-256-gcm', kunciSandi(), Buffer.from(ivHex, 'hex'))
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
    const asli = Buffer.concat([
      decipher.update(Buffer.from(cipherHex, 'hex')),
      decipher.final(),
    ])
    return asli.toString('utf8')
  } catch {
    return null
  }
}

/**
 * Hash password menggunakan scrypt (Node built-in, aman & tanpa dependency
 * native — kompatibel dengan runtime serverless Vercel).
 * Format tersimpan: scrypt:<salt hex>:<hash hex>
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `scrypt:${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, salt, hash] = stored.split(':')
    if (scheme !== 'scrypt' || !salt || !hash) return false
    const candidate = scryptSync(password, salt, 64)
    const original = Buffer.from(hash, 'hex')
    if (candidate.length !== original.length) return false
    return timingSafeEqual(candidate, original)
  } catch {
    return false
  }
}

/**
 * v1.3.1 — Jalur PEMULIHAN AKSES: mencocokkan sandi dengan nilai pada kolom
 * passwordHash, mendukung DUA bentuk tersimpan:
 *  1. `scrypt:...`  — format normal (hash satu-arah); diverifikasi scrypt.
 *  2. sandi polos   — bila sandi pernah diketik LANGSUNG di tabel database
 *     (mis. lewat konsol Neon) tanpa alat hash. Sebelum v1.3.1 bentuk ini
 *     selalu gagal login; kini cocok secara langsung, dan authorize() akan
 *     meng-upgrade-nya otomatis menjadi hash scrypt saat login pertama.
 * Dipakai oleh login (auth.ts), ganti sandi sendiri, dan cek-akun agar
 * perilaku konsisten di seluruh titik verifikasi.
 */
export function cocokkanSandi(
  sandi: string,
  tersimpan: string | null | undefined,
): boolean {
  if (!sandi || !tersimpan) return false
  if (tersimpan.startsWith('scrypt:')) return verifyPassword(sandi, tersimpan)
  return sandi === tersimpan.trim()
}

/** Benarkah nilai passwordHash masih sandi polos (bukan hash scrypt)? */
export function adalahSandiPolos(tersimpan: string | null | undefined): boolean {
  return Boolean(tersimpan) && !tersimpan!.startsWith('scrypt:')
}
