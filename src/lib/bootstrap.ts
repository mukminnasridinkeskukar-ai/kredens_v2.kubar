/**
 * Auto-setup database untuk produksi (Neon/Vercel).
 *
 * Masalah yang diselesaikan: pengguna pemula yang deploy via GitHub + Vercel
 * tidak memiliki Node.js di komputer untuk menjalankan `prisma db push` dan
 * `seed`. Dengan modul ini, tabel dan data demo dibuat OTOMATIS saat:
 * - percobaan login pertama (dipanggil dari authorize di src/lib/auth.ts), atau
 * - membuka GET /api/setup sekali setelah deploy.
 *
 * Aman dijalankan berulang:
 * - DDL memakai CREATE SCHEMA IF NOT EXISTS + abaikan error "already exists".
 * - Seed hanya berjalan bila tabel User masih kosong (upsert per akun).
 * - Hanya aktif bila DATABASE_URL ber-Postgres; di sandbox SQLite dilewati.
 *
 * Optimasi kecepatan (sejak v1.2.2):
 * - Tabel penanda `_kredens_meta` menyimpan versi skema yang sudah terpasang.
 *   Saat server menyala, cukup 1 kueri SELECT untuk memastikan struktur DB siap
 *   (sebelumnya ±38 statement DDL dijalankan ulang di setiap cold start —
 *   membuat akses pertama setelah server sepi terasa lambat).
 * - Bila penanda tidak cocok/tidak ada, jalur penuh (DDL + seed) berjalan
 *   seperti biasa lalu penanda diperbarui.
 * - Pemeriksaan ulang paksa: GET /api/setup?force=1 (hapus penanda + jalankan
 *   jalur penuh) — berguna bila tabel terhapus tanpa sengaja.
 */
import { db } from '@/lib/db'
import { DDL_POSTGRES } from '@/lib/bootstrap-ddl'
import {
  seedDemo,
  seedKewenanganTemplate,
  seedSuperadmin,
  seedPenugasanDemo,
  migrasiTempatKerja,
  backfillSandiTersimpan,
  seedFungsiTimV21,
} from '@/lib/seed-demo'

/**
 * Versi skema yang diharapkan aplikasi ini.
 * NAIKKAN nilainya setiap kali DDL_POSTGRES/seed wajib dijalankan ulang pada
 * deployment lama (mis. ada tabel/kolom baru):
 *   '2' = struktur v1.2 (TempatKerja, DokumenPengajuan, PenugasanAsesor)
 *   '3' = v1.2.2 — tabel penanda _kredens_meta ditambahkan
 *   '4' = v1.3.0 — kolom User.sandiTersimpan (salinan sandi terenkripsi)
 *   '5' = v2.1 — User.peranEkstra + User.profesi + RekomendasiTim.anggotaNama2/3
 *   '6' = v2.3 — User.foto + User.fotoTipe + User.fotoPada (foto profil akun)
 */
const KEY_VERSI = 'schema_version'
export const VERSI_SKEMA = '6'

/** Penyebab kegagalan bootstrap terakhir (untuk diagnosis jarak jauh via /api/setup). */
let galatTerakhir: string | null = null

/** Baca penyebab kegagalan bootstrap terakhir (null bila tidak ada). */
export function bacaGalatBootstrap(): string | null {
  return galatTerakhir
}

function catatGalat(label: string, err: unknown): void {
  const pesan = String((err as Error)?.message ?? err)
  galatTerakhir = `${label}: ${pesan}`.slice(0, 280)
}

let selesai = false
let inFlight: Promise<void> | null = null

/** Benarkah DATABASE_URL mengarah ke Postgres (Neon)? Diekspor agar
 *  /api/setup dapat melaporkan konfigurasi saat diagnosis (v1.2.6). */
export function isPostgres(): boolean {
  const url = (process.env.DATABASE_URL ?? '').trim().toLowerCase()
  return url.startsWith('postgresql://') || url.startsWith('postgres://')
}

/** URL database dengan kredensial disembunyikan (untuk laporan diagnosis):
 *  postgresql://user:sandi@host/db?sslmode=... -> postgresql://***@host/db
 *  Bila tidak diisi, kembalikan penanda jelas "(tidak diisi)". */
export function samarkanUrlDb(): string {
  const url = (process.env.DATABASE_URL ?? '').trim()
  if (!url) return '(tidak diisi)'
  try {
    const u = new URL(url)
    const login = u.username ? '***@' : ''
    return `${u.protocol}//${login}${u.host}${u.pathname}`
  } catch {
    return `(tidak dapat dibaca; diawali "${url.slice(0, 10)}...")`
  }
}

const DDL_PENANDA = `CREATE TABLE IF NOT EXISTS "_kredens_meta" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "_kredens_meta_pkey" PRIMARY KEY ("key")
)`

/** Baca versi skema yang tersimpan di DB (null bila belum tercatat). */
export async function bacaVersiSkema(): Promise<string | null> {
  try {
    const rows = await db.$queryRawUnsafe<Array<{ value: string }>>(
      `SELECT "value" FROM "_kredens_meta" WHERE "key" = '${KEY_VERSI}' LIMIT 1`,
    )
    return rows?.[0]?.value ?? null
  } catch {
    // Tabel penanda belum ada — perlakukan sebagai belum tercatat.
    return null
  }
}

/** Hapus penanda versi skema (untuk pemeriksaan ulang paksa). */
export async function resetPenandaSkema(): Promise<void> {
  try {
    await db.$executeRawUnsafe(`DELETE FROM "_kredens_meta" WHERE "key" = '${KEY_VERSI}'`)
  } catch {
    // Tabel penanda belum ada — aman diabaikan.
  }
}

async function simpanVersiSkema(): Promise<void> {
  await db.$executeRawUnsafe(
    `INSERT INTO "_kredens_meta" ("key", "value") VALUES ('${KEY_VERSI}', '${VERSI_SKEMA}')
     ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = CURRENT_TIMESTAMP`,
  )
}

async function jalankanDdl(): Promise<void> {
  // 1) Pastikan semua tabel ada. DDL bersifat idempoten (struktur yang sudah
  //    ada diabaikan), sehingga aman dijalankan juga pada deployment lama —
  //    tabel baru (mis. KewenanganTemplate) otomatis ikut terpasang.
  for (const stmt of DDL_POSTGRES) {
    try {
      await db.$executeRawUnsafe(stmt)
    } catch (err) {
      const pesan = String((err as Error)?.message ?? err)
      // Tabel/indeks/constraint yang sudah ada diabaikan (idempoten)
      if (!/already exists|duplicate/i.test(pesan)) throw err
    }
  }

  // 1b) Tabel penanda versi skema (idempoten) — dipakai jalur cepat boot.
  await db.$executeRawUnsafe(DDL_PENANDA)
}

/** Jalankan seluruh langkah seed satu per satu — kegagalan satu langkah
 *  TIDAK menggagalkan langkah lain (semua idempoten, bisa dicoba ulang via
 *  /api/setup?force=1). */
async function jalankanSeed(): Promise<void> {
  async function coba(label: string, langkah: () => Promise<void>): Promise<void> {
    try {
      await langkah()
    } catch (err) {
      catatGalat(`seed/${label}`, err)
      console.error(`[bootstrap] Langkah seed "${label}" gagal (dilewati, coba lagi via /api/setup?force=1):`, err)
    }
  }

  const jumlah = await db.user.count()
  if (jumlah === 0) {
    console.log('[bootstrap] Database kosong — mengisi akun & data demo...')
    await coba('seedDemo', async () => {
      const hasil = await seedDemo()
      console.log(`[bootstrap] Selesai: ${hasil.akun} akun, pengajuan demo: ${hasil.pengajuanBaru.join(', ') || '(sudah ada)'}`)
    })
    return
  }

  // Deployment lama: pastikan tabel template kewenangan terisi
  // (idempoten — hanya mengisi bila masih kosong) dan akun superadmin
  // tersedia (deployment lama tidak pernah menjalankan seedDemo penuh).
  await coba('seedKewenanganTemplate', async () => {
    await seedKewenanganTemplate()
  })
  await coba('seedSuperadmin', async () => {
    const sa = await seedSuperadmin()
    if (sa.dibuat) console.log('[bootstrap] Akun superadmin dibuat untuk deployment lama.')
  })
  // Deployment lama: pengajuan demo yang sudah melewati verifikasi diberi
  // penugasan asesor agar tetap dinilai sesuai aturan baru.
  await coba('seedPenugasanDemo', async () => {
    const tg = await seedPenugasanDemo()
    if (tg.dibuat) console.log('[bootstrap] Penugasan asesor demo dibuat untuk deployment lama.')
  })
  // Deployment lama: master data TempatKerja dibuat dari nilai teks yang
  // sudah ada (biodata asesi & akun pimpinan) lalu dihubungkan via ID.
  await coba('migrasiTempatKerja', async () => {
    const tk = await migrasiTempatKerja()
    if (tk.terhubung > 0) console.log(`[bootstrap] Tempat kerja: ${tk.dibuat} dibuat, ${tk.terhubung} terhubung.`)
  })
  // v1.3.0: akun lama tanpa salinan sandi terenkripsi — bila sandinya masih
  // sandi demo bawaan (kredens123), salinannya diisi agar superadmin dapat
  // melihatnya. Sandi non-demo tidak dapat (dan tidak boleh) dipulihkan.
  await coba('backfillSandiTersimpan', async () => {
    const bf = await backfillSandiTersimpan()
    if (bf.diisi > 0) console.log(`[bootstrap] Salinan sandi demo diisi untuk ${bf.diisi} akun.`)
  })
  // v2.1: pelengkap fitur fungsi tambahan akun, ketua tim per profesi, dan
  // anggota tim (perwakilan penilai) pada deployment lama.
  await coba('seedFungsiTimV21', async () => {
    const v21 = await seedFungsiTimV21()
    if (v21.akunBaru > 0 || v21.diperbarui > 0)
      console.log(`[bootstrap] v2.1: ${v21.akunBaru} akun baru, ${v21.diperbarui} data diperbarui.`)
  })
}

/**
 * Dipanggil sebelum pencocokan akun pada login, atau dari /api/setup.
 * Idempoten dan ber-concurrency aman: hanya satu eksekusi per instance.
 *
 * Jalur cepat (sejak v1.2.2): bila penanda versi skema cocok, cukup 1 kueri
 * SELECT — seluruh DDL/seed dilewati.
 */
export function ensureDbReady(): Promise<void> {
  if (selesai) return Promise.resolve()
  if (inFlight) return inFlight

  if (!isPostgres()) {
    // Sandbox/lokal SQLite dikelola lewat `bun run db:push` — lewati.
    selesai = true
    // Namun di Vercel (produksi) Prisma client dibangun dari
    // schema.postgres.prisma — DATABASE_URL yang kosong/bukan postgres
    // membuat SEMUA kueri gagal dengan galat samar. Catat penyebabnya
    // supaya /api/setup dapat melaporkannya (sebelumnya: lewat diam-diam).
    if (process.env.VERCEL) {
      catatGalat(
        'bootstrap',
        new Error(
          `DATABASE_URL tidak berawalan postgresql:// (nilai saat ini: ${samarkanUrlDb()}). Prisma client produksi dibangun untuk Postgres/Neon, sehingga semua kueri database gagal.`,
        ),
      )
      console.error(
        '[bootstrap] DATABASE_URL kosong/bukan postgres:// di Vercel — bootstrap dilewati, kueri database akan gagal.',
      )
    }
    return Promise.resolve()
  }

  inFlight = (async () => {
    const tersimpan = await bacaVersiSkema()
    if (tersimpan === VERSI_SKEMA) {
      selesai = true
      return
    }
    console.log(
      `[bootstrap] Menyiapkan struktur database (penanda skema: ${tersimpan ?? 'belum ada'} -> ${VERSI_SKEMA})...`,
    )
    // 1) Struktur dulu — begitu selesai, halaman TIDAK AKAN crash karena
    //    tabel/kolom kurang. Penanda langsung disimpan sebelum seed agar
    //    kegagalan seed (data, bukan struktur) tidak membuat boot berikutnya
    //    mengulang seluruh DDL.
    await jalankanDdl()
    await simpanVersiSkema()
    selesai = true
    // 2) Seed data demo / pelengkap deployment lama — best-effort.
    try {
      await jalankanSeed()
    } catch (err) {
      catatGalat('seed', err)
      console.error('[bootstrap] Seed gagal (struktur tetap siap):', err)
    }
  })()
    .catch((err) => {
      catatGalat('bootstrap', err)
      console.error('[bootstrap] Gagal menyiapkan database:', err)
    })
    .finally(() => {
      inFlight = null
    })

  return inFlight
}

/**
 * Pemeriksaan ulang PAKSA: hapus penanda versi skema lalu jalankan jalur
 * penuh (DDL idempoten + seed yang masih kurang). Dipakai oleh
 * GET /api/setup?force=1 bila struktur database dicurigai rusak/kurang.
 */
export async function periksaUlangDb(): Promise<void> {
  selesai = false
  galatTerakhir = null
  await resetPenandaSkema()
  return ensureDbReady()
}
