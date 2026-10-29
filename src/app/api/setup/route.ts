import { NextResponse } from 'next/server'
import {
  ensureDbReady,
  periksaUlangDb,
  bacaVersiSkema,
  bacaGalatBootstrap,
  isPostgres,
  samarkanUrlDb,
  VERSI_SKEMA,
} from '@/lib/bootstrap'
import { db } from '@/lib/db'

/**
 * Setup satu-kali setelah deploy: buka https://<alamat-anda>/api/setup
 * Membuat tabel (bila belum ada) + data demo di database produksi (Neon),
 * lalu melaporkan status. Aman dibuka berulang kali.
 *
 * Varian pemulihan: https://<alamat-anda>/api/setup?force=1 — menghapus
 * penanda versi skema lalu menjalankan pemeriksaan struktur PENUH secara
 * paksa (DDL idempoten + seed yang masih kurang). Dipakai bila struktur
 * database dicurigai rusak/kurang (mis. tabel terhapus tanpa sengaja).
 *
 * Sejak v1.2.6: bila koneksi database gagal, JSON laporan memuat
 * `konfigurasiDb` (postgres? + URL tersamar), `galatKoneksi` (pesan asli
 * kueri), `penyebab` + `pesan` yang disusun sesuai kasusnya — sehingga
 * penyebab tidak lagi tersembunyi di balik "akun: -1".
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Rapikan pesan galat teknis: sembunyikan kredensial yang mungkin tertanam
 *  pada URL di dalam pesan, lalu batasi panjangnya. */
function bersihkanGalat(err: unknown): string {
  const teks = String((err as Error)?.message ?? err)
  const aman = teks.replace(/(postgres(?:ql)?:\/\/)[^\s]+/gi, '$1***')
  return aman.slice(0, 300)
}

export async function GET(request: Request) {
  try {
    const force = new URL(request.url).searchParams.get('force')
    if (force) {
      console.log('[setup] Mode paksa (?force=1) — pemeriksaan struktur penuh dijalankan.')
      await periksaUlangDb()
    } else {
      await ensureDbReady()
    }

    // Kueri pemeriksa — bila gagal, PESAN ASLINYA disimpan (v1.2.6) supaya
    // /api/setup tidak lagi melaporkan "akun: -1" tanpa penyebab.
    let akun = -1
    let galatKoneksi: string | null = null
    try {
      akun = await db.user.count()
    } catch (err) {
      galatKoneksi = bersihkanGalat(err)
    }
    const pengajuan = await db.pengajuan.count().catch(() => -1)
    const tersimpan = await bacaVersiSkema().catch(() => null)
    const galat = bacaGalatBootstrap()
    const konfigurasiDb = { postgres: isPostgres(), url: samarkanUrlDb() }

    if (akun > 0) {
      return NextResponse.json({
        ok: true,
        akun,
        pengajuan,
        versiSkema: tersimpan ?? 'belum tercatat',
        versiDiharapkan: VERSI_SKEMA,
        konfigurasiDb,
        ...(galat ? { catatan: `Sebagian pengisian data (seed) gagal: ${galat}` } : {}),
        pesan: force
          ? 'Database diperiksa ulang secara paksa (force). Struktur disesuaikan kembali. Silakan login dengan akun demo (sandi: kredens123).'
          : 'Database siap. Silakan login dengan akun demo (sandi: kredens123).',
      })
    }

    // ok:false — susun diagnosis sesuai penyebabnya (v1.2.6).
    let penyebab: string
    let pesan: string
    if (!konfigurasiDb.postgres) {
      penyebab = `DATABASE_URL tidak terbaca sebagai Postgres (nilai saat ini: ${konfigurasiDb.url}).`
      pesan =
        'DATABASE_URL belum diisi atau bukan connection string Postgres. Cara memperbaiki: ' +
        'Vercel → Project → Settings → Environment Variables → tambah DATABASE_URL berisi ' +
        'connection string Neon (berawalan postgresql://, ambil dari Neon → Dashboard → Connection string) ' +
        'untuk environment Production (dan Preview) → Save → lalu WAJIB Redeploy ' +
        '(tab Deployments → deployment terbaru → Redeploy), karena perubahan env hanya berlaku ' +
        'pada deployment baru. Setelah build selesai, buka halaman ini lagi.'
    } else if (galatKoneksi) {
      penyebab = galatKoneksi
      pesan =
        'DATABASE_URL sudah terbaca (postgres) tetapi kueri ke database gagal — lihat field ' +
        '"galatKoneksi" untuk pesan aslinya. Pastikan project Neon aktif (tidak dihapus/suspend), ' +
        'kredensial dan nama host benar, lalu Redeploy. Bila pesan menyebut tabel/kolom tidak ada, ' +
        'buka /api/setup?force=1 sekali.'
    } else if (akun === 0) {
      penyebab = 'Database terhubung tetapi belum ada akun (pengisian data demo belum berjalan).'
      pesan =
        'Koneksi database baik namun tabel User masih kosong. Buka /api/setup?force=1 sekali untuk ' +
        'menjalankan pemeriksaan struktur penuh + pengisian data, lalu login dengan akun demo (sandi: kredens123).'
    } else {
      penyebab = galat ?? 'Penyebab tidak tercatat — periksa Runtime Logs Vercel (cari baris [bootstrap]).'
      pesan =
        'Database belum terisi. Buka /api/setup?force=1, tunggu selesai, lalu buka halaman ini lagi. ' +
        'Bila tetap gagal, periksa Runtime Logs Vercel (cari baris [bootstrap]).'
    }

    return NextResponse.json(
      {
        ok: false,
        akun,
        versiSkema: tersimpan ?? 'belum tercatat',
        konfigurasiDb,
        penyebab,
        ...(galatKoneksi ? { galatKoneksi } : {}),
        ...(galat ? { galatBootstrap: galat } : {}),
        pesan,
      },
      { status: 500 },
    )
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        pesan: 'Gagal menyiapkan database. Periksa DATABASE_URL di Vercel, lalu muat ulang halaman ini.',
        rincian: bersihkanGalat(err),
      },
      { status: 500 },
    )
  }
}
