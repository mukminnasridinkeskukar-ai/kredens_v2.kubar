/**
 * Instrumentasi Next.js — dijalankan SEKALI saat server produksi (atau dev)
 * mulai di-boot, SEBELUM permintaan pertama dilayani.
 *
 * Tujuan: menyiapkan struktur database secara otomatis (idempoten) sehingga
 * pembaruan versi yang menambah tabel/kolom baru (mis. v1.2: TempatKerja,
 * DokumenPengajuan, tempatKerjaId) TIDAK lagi membuat halaman Server Component
 * crash pada deployment lama ketika pengguna membuka aplikasi dengan sesi JWT
 * yang masih aktif (tanpa login ulang — yang dulu satu-satunya pemicu
 * bootstrap database).
 *
 * Catatan:
 * - Hanya aktif pada runtime Node.js (bukan Edge).
 * - Di sandbox SQLite bootstrap dilewati (dikelola via prisma db push).
 * - Aman berulang: seluruh DDL idempoten dan hasilnya di-cache per proses.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  try {
    const { ensureDbReady } = await import('@/lib/bootstrap')
    await ensureDbReady()
    console.log('[instrumentation] Bootstrap database selesai dicek.')
  } catch (err) {
    // Jangan pernah menggagalkan boot server karena bootstrap; error
    // selanjutnya tetap terlihat pada percobaan login (authorize) dan
    // /api/setup. Log cukup untuk diagnosa.
    console.error('[instrumentation] Bootstrap database gagal:', err)
  }
}
