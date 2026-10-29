import type { Metadata } from 'next'
import { PanduanPenggunaan } from '@/components/kredens/panduan/panduan-penggunaan'

// ============================================================
// KREDENS v2.kubar — Halaman publik Panduan Penggunaan (v2.3)
// Bisa dibuka tanpa masuk (tautan dari halaman Masuk & bilah
// samping aplikasi). Tab per peran dipilih otomatis sesuai
// sesi pengguna bila tersedia (?peran=asesi|operator|...).
// ============================================================

export const metadata: Metadata = {
  title: 'Panduan Penggunaan — KREDENS v2.kubar',
  description:
    'Panduan penggunaan platform KREDENS v2.kubar untuk Asesi, Operator Kredensial, Asesor, Ketua Tim Kredensial, dan Pimpinan Fasyankes — Dinas Kesehatan Kabupaten Kutai Barat.',
}

export default function PanduanPage() {
  return <PanduanPenggunaan />
}
