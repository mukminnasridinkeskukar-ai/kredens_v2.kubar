import type { MetadataRoute } from 'next'

/**
 * Manifest PWA KREDENS — memungkinkan aplikasi dipasang ke layar utama
 * (Android/Chrome: "Instal aplikasi"; iPhone/Safari: "Tambahkan ke Layar
 * Utama"; PC/TV: ikon pasang pada bilah alamat). Mode standalone membuat
 * KREDENS tampil tanpa bilah alamat seperti aplikasi native.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KREDENS v2.kubar — Kredensial Tenaga Medis & Kesehatan Kutai Barat',
    short_name: 'KREDENS',
    description:
      'Tata Kelola Kredensial Tenaga Medis dan Tenaga Kesehatan Kabupaten Kutai Barat.',
    start_url: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#ffffff',
    theme_color: '#009035',
    lang: 'id',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
