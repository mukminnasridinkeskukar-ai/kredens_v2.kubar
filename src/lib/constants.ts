// ============================================================
// Konstanta & label KREDENS
// ============================================================

export const APP_NAME = 'KREDENS v2.kubar'
export const APP_FULL_NAME =
  'Tata Kelola Kredensial Tenaga Medis dan Tenaga Kesehatan Kabupaten Kutai Barat'

export const ROLES = [
  'ASESI',
  'ASESOR',
  'OPERATOR_KREDENSIAL',
  'KETUA_TIM_KREDENSIAL',
  'MITRA_BESTARI',
  'PIMPINAN_FASYANKES',
  'KEPALA_DINAS_KESEHATAN',
  'SUPERADMIN',
] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<string, string> = {
  ASESI: 'Asesi',
  ASESOR: 'Asesor',
  OPERATOR_KREDENSIAL: 'Operator Kredensial',
  KETUA_TIM_KREDENSIAL: 'Ketua Tim Kredensial',
  MITRA_BESTARI: 'Mitra Bestari',
  PIMPINAN_FASYANKES: 'Pimpinan Fasyankes',
  KEPALA_DINAS_KESEHATAN: 'Kepala Dinas Kesehatan',
  SUPERADMIN: 'Superadmin',
}

// ============ v2.1 FUNGSI TAMBAHAN SATU AKUN (MULTI-FUNGSI) ============
// Satu akun (umumnya akun Asesi) dapat diberi 1–3 fungsi tambahan oleh
// Superadmin: sebagai Asesor, Pimpinan Fasyankes, dan/atau Ketua Tim
// Kredensial. Nilainya disimpan dipisah koma pada kolom User.peranEkstra.
export const PERAN_EKSTRA = [
  'ASESOR',
  'PIMPINAN_FASYANKES',
  'KETUA_TIM_KREDENSIAL',
] as const
export type PeranEkstra = (typeof PERAN_EKSTRA)[number]

export const PERAN_EKSTRA_LABELS: Record<string, string> = {
  ASESOR: 'Asesor',
  PIMPINAN_FASYANKES: 'Pimpinan Fasyankes',
  KETUA_TIM_KREDENSIAL: 'Ketua Tim Kredensial',
}

/** Uraikan kolom peranEkstra (dipisah koma) menjadi daftar peran valid. */
export function uraikanPeranEkstra(nilai: string | null | undefined): string[] {
  if (!nilai) return []
  return nilai
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is PeranEkstra => (PERAN_EKSTRA as readonly string[]).includes(s))
}

/** Susun daftar peran tambahan menjadi nilai kolom (terurut, tanpa duplikat). */
export function susunPeranEkstra(daftar: string[]): string | null {
  const unik = PERAN_EKSTRA.filter((r) => daftar.includes(r))
  return unik.length > 0 ? unik.join(',') : null
}

/** Label peran utama; ketua tim kredensial disertai profesinya
 *  (mis. "Ketua Tim Kredensial · Perawat") sesuai pembagian profesi. */
export function labelPeranLengkap(role: string, profesi?: string | null): string {
  const dasar = ROLE_LABELS[role] ?? role
  if (role === 'KETUA_TIM_KREDENSIAL' && profesi) return `${dasar} · ${profesi}`
  return dasar
}

export const PENGAJUAN_STATUS = [
  'DRAFT',
  'DIAJUKAN',
  'VERIFIKASI',
  'PENILAIAN_TIM',
  'REKOMENDASI_TIM',
  'KETETAPAN_KADIS',
  'SURAT_PENUGASAN',
  'SELESAI',
] as const
export type PengajuanStatus = (typeof PENGAJUAN_STATUS)[number]

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draf',
  DIAJUKAN: 'Diajukan',
  VERIFIKASI: 'Verifikasi Operator',
  PENILAIAN_TIM: 'Penilaian Tim',
  REKOMENDASI_TIM: 'Rekomendasi Tim',
  KETETAPAN_KADIS: 'Ketetapan Kadis',
  SURAT_PENUGASAN: 'Surat Penugasan',
  SELESAI: 'Selesai',
}

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  DIAJUKAN: 'bg-amber-50 text-amber-700 border-amber-200',
  VERIFIKASI: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  PENILAIAN_TIM: 'bg-violet-50 text-violet-700 border-violet-200',
  REKOMENDASI_TIM: 'bg-teal-50 text-teal-700 border-teal-200',
  KETETAPAN_KADIS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SURAT_PENUGASAN: 'bg-lime-50 text-lime-700 border-lime-200',
  SELESAI: 'bg-green-100 text-green-800 border-green-300',
}

// alur urutan untuk timeline
export const STATUS_ORDER: Record<string, number> = {
  DRAFT: 0,
  DIAJUKAN: 1,
  VERIFIKASI: 2,
  PENILAIAN_TIM: 3,
  REKOMENDASI_TIM: 4,
  KETETAPAN_KADIS: 5,
  SURAT_PENUGASAN: 6,
  SELESAI: 7,
}

// Kode Diminta (Asesi) - sheet RINCIAN KEWENANGAN KLINIS
export const KODE_DIMINTA: Record<string, string> = {
  '1': 'Kompeten sepenuhnya',
  '2': 'Memerlukan supervisi',
  '3': 'Tidak dimintakan kewenangannya karena di luar kompetensi',
  '4': 'Tidak dimintakan kewenangannya karena fasilitas tidak tersedia',
}

// Kode Rekomendasi (Tim Kredensial/Mitra Bestari)
export const KODE_REKOMENDASI: Record<string, string> = {
  '1': 'Disetujui berwenang penuh',
  '2': 'Disetujui di bawah supervisi',
  '3': 'Tidak disetujui karena belum memenuhi kompetensinya',
  '4': 'Tidak disetujui karena fasilitas tidak tersedia',
}

export const KEPUTUSAN_TIM_LABELS: Record<string, string> = {
  DIREKOMENDASIKAN: 'Direkomendasikan',
  DIREKOMENDASIKAN_DENGAN_CATATAN: 'Direkomendasikan dengan catatan',
  TIDAK_DIREKOMENDASIKAN: 'Tidak direkomendasikan',
  DILANJUTKAN: 'Kewenangan dilanjutkan',
  DITAMBAH: 'Kewenangan ditambah',
  DIKURANGI: 'Kewenangan dikurangi',
  DIBEKUKAN: 'Kewenangan dibekukan untuk waktu tertentu',
  DIUBAH: 'Kewenangan diubah/dimodifikasi',
  DIAKHIRI: 'Kewenangan klinis diakhiri',
}

export const JENIS_PENGAJUAN_LABELS: Record<string, string> = {
  KREDENSIAL: 'Kredensial',
  REKREDENSIAL: 'Rekredensial',
}

// ============ LOGBOOK KEWENANGAN KLINIS ============
export const LOGBOOK_STATUS: Record<string, string> = {
  DRAFT: 'Draf',
  DIAJUKAN: 'Menunggu Verifikasi',
  DIVERIFIKASI: 'Terverifikasi',
  REVISI: 'Perlu Perbaikan',
}

export const LOGBOOK_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  DIAJUKAN: 'bg-amber-50 text-amber-700 border-amber-200',
  DIVERIFIKASI: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REVISI: 'bg-red-50 text-red-700 border-red-200',
}

export const NAMA_BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const

// Pengajuan hanya dianggap punya logbook setelah tim kredensial
// menetapkan rekomendasi kewenangan (tahap REKOMENDASI_TIM ke atas).
export const STATUS_LOGBOOK_SIAP = [
  'REKOMENDASI_TIM',
  'KETETAPAN_KADIS',
  'SURAT_PENUGASAN',
  'SELESAI',
] as const

export const JADWAL_TAHAP: Record<string, string> = {
  TELAAH_BERKAS: 'Telaah Berkas',
  ASESMEN: 'Asesmen',
  PENILAIAN_LAPANGAN: 'Penilaian Lapangan',
  REKOMENDASI: 'Rekomendasi Tim',
  KETETAPAN: 'Ketetapan Kewenangan',
}

export const JADWAL_STATUS: Record<string, string> = {
  TERJADWAL: 'Terjadwal',
  SELESAI: 'Selesai',
  DIBATALKAN: 'Dibatalkan',
}

export const JENIS_PROFESI = [
  'Dokter',
  'Dokter Gigi',
  'Perawat',
  'Bidan',
  'Apoteker',
  'Nutritionis',
  'Sanitarian',
  'Ahli Teknologi Laboratorium Medik',
  'Ahli Radiologi',
  'Ahli Fisioterapi',
  'Ahli Okupasi Terapi',
  'Ahli Nutrisi',
  'Psikolog Klinis',
] as const

export const LEVEL_KOMPETENSI = ['Ahli Pertama', 'Ahli Muda', 'Ahli Madya', 'Ahli Utama'] as const

export const STATUS_KEPEGAWAIAN = [
  'PNS',
  'PPPK',
  'Honorer',
  'Kontrak',
  'Tetap Non ASN',
] as const

export const JENIS_KELAMIN = ['Laki-laki', 'Perempuan'] as const

// Daftar kewenangan klinis per profesi kini memakai template standar Dinkes
// (tabel KewenanganTemplate — sumber: RINCIAN KEWENANGAN KLINIS REVISI BARU).
// Diakses via GET /api/kewenangan-template (otomatis sesuai jenisProfesi
// pada Riwayat Hidup asesi).

// Situs utama organisasi — tujuan pengembalian saat logout / sesi habis /
// akses tanpa sesi (pengamanan sesi, v1.3.6). Dapat ditimpa via env publik.
export const SITUS_UTAMA =
  process.env.NEXT_PUBLIC_SITUS_UTAMA || 'https://mukminnasri.com'

// Batas waktu diam (idle) sebelum sesi diakhiri otomatis (menit).
export const BATAS_IDLE_MENIT = 15
