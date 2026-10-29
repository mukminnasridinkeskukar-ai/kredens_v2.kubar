import { cn } from '@/lib/utils'

/**
 * v2.3 — Avatar pengguna: menampilkan foto profil bila tersedia, jika tidak
 * menampilkan huruf awal nama (fallback). Dipakai pada header, kartu identitas
 * sidebar, dan halaman Akun Saya.
 *
 * `src` berupa URL API foto (mis. "/api/akun/foto?v=1730000000000"). Param
 * versi memastikan peramban memuat ulang foto setiap kali diganti.
 */
export function AvatarPengguna({
  nama,
  src,
  className,
  alt,
}: {
  nama: string
  src?: string | null
  className?: string
  alt?: string
}) {
  const inisial = (nama ?? '').trim().slice(0, 1).toUpperCase() || '?'
  return (
    <span
      className={cn(
        'relative flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-primary/10 font-bold text-primary',
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt ?? `Foto profil ${nama}`}
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <span aria-hidden="true">{inisial}</span>
      )}
    </span>
  )
}
