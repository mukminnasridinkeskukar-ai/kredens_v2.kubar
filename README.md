# KREDENS v2.kubar

**Tata Kelola Kredensial Tenaga Medis dan Tenaga Kesehatan Kabupaten Kutai Barat**

> Nama teknis proyek: **`kredensv2kubar`** (huruf kecil, tanpa titik/garis) — dipakai pada
> nama paket `package.json`, nama repo GitHub, dan nama proyek Vercel
> (`https://kredensv2kubar.vercel.app`). Nama tampilan di layar: **KREDENS v2.kubar**.

Platform satu pintu untuk mengelola proses kredensialing tenaga medis dan tenaga kesehatan di lingkungan Dinas Kesehatan Kabupaten Kutai Barat — mulai dari pengajuan, biodata dan formulir, penilaian tim kredensial, rekomendasi Kepala Dinas Kesehatan, hingga Surat Penugasan Klinis (SPK) dan Rincian Kewenangan Klinis (RKK).

---

## Fitur

### Multi-role (7 jenis akun — semuanya berfungsi penuh)
| Akun | Status Modul |
|------|--------------|
| **Asesi** (tenaga medis/kesehatan pengusul) | Lengkap — siap dipakai |
| Operator Kredensial | Lengkap — verifikasi berkas & kelola jadwal |
| Asesor | Lengkap — penilaian kewenangan klinis |
| Mitra Bestari | Lengkap — penilaian kewenangan klinis |
| Ketua Tim Kredensial | Lengkap — rekomendasi tim (terbagi per profesi) |
| Kepala Dinas Kesehatan | Lengkap — rekomendasi & ketetapan kadis |
| Pimpinan Fasyankes | Lengkap — penerbitan SPK |

### Multi-Fungsi Akun (v2.1)
Satu akun dapat menjalankan **hingga 3 fungsi tambahan** di samping peran utamanya:
**Asesor**, **Pimpinan Fasyankes**, dan/atau **Ketua Tim Kredensial**.
- Superadmin mengaturnya pada menu **Kelola Akun → tombol “Fungsi”** (pilih centang fungsi tambahan).
- Menu milik fungsi tambahan muncul di bilah samping bagian **“Fungsi Tambahan”** tanpa perlu keluar-masuk ulang.
- Dashboard akun menampilkan kartu **Fungsi Tambahan Akun** berisi tautan cepat ke modul tiap fungsi.
- Contoh: akun Asesi yang juga ditugaskan sebagai Asesor tetap mengelola pengajuannya sendiri,
  sekaligus dapat menilai kewenangan klinis pengajuan yang ditugaskan Operator kepadanya.

### Ketua Tim Kredensial Per Profesi (v2.1)
- Superadmin menetapkan **profesi** akun ketua tim (Dokter, Dokter Gigi, Perawat, Bidan, dst.)
  pada menu **Kelola Akun → Data → Profesi Tim Kredensial**.
- Ketua tim dengan profesi tertentu **hanya menangani pengajuan asesi dengan profesi yang sama**;
  daftar dan halaman rekomendasinya otomatis tersaring. Ketua tim tanpa profesi melihat semua
  (kompatibel dengan data lama).
- Penetapan rekomendasi tim mencatat **Anggota Tim (Perwakilan Penilai) 1–3** — dua nama asesor
  lain di samping ketua. Nama asesor penilai yang ditetapkan Operator tersedia sebagai saran
  sekali-klik pada formulir rekomendasi, dan ketiganya tampil pada halaman read-only asesi.

### Modul Akun Asesi
- **Dashboard** — ringkasan status pengajuan, kelengkapan biodata, dan jadwal terdekat.
- **Pengajuan** — buat pengajuan *Kredensial* / *Rekredensial*, ajukan, pantau alur 8 tahap (Draf → Diajukan → Verifikasi Operator → Penilaian Tim → Rekomendasi Tim → Ketetapan Kadis → Surat Penugasan → Selesai).
- **Biodata** (dapat disunting seluruhnya):
  - *Riwayat Hidup* — data pribadi, riwayat pendidikan, pengalaman kerja, pengembangan kompetensi 5 tahun terakhir (mengikuti sheet `RIWAYAT HIDUP` pada template Excel).
  - *Formulir* — pernyataan kompetensi, sertifikasi (Perguruan Tinggi, Kolegium, Uji Kompetensi), STR, SIP, dan surat permohonan kredensial (mengikuti sheet `FORMULIR`).
  - *Rincian Kewenangan Klinis* — daftar diagnosa/keterampilan yang diusulkan dengan kode diminta 1–4 sesuai legenda (mengikuti sheet `RINCIAN KEWENANGAN KLINIS`).
- **Kredensialing** (hanya-lihat / read-only):
  - *Rekomendasi Tim* — kesimpulan penilaian tim kredensial + rincian kode rekomendasi.
  - *Rekomendasi Kadis* — surat rekomendasi penetapan kewenangan klinis.
  - *Lampiran Rekomendasi Kadis* — daftar ketetapan kewenangan klinis.
- **SPK dan RKK** (read-only):
  - *Surat Penugasan Klinis* — SPK yang diterbitkan Kepala UPTD.
  - *Rincian Kewenangan Klinis* — RKK final (kewenangan disetujui penuh / dengan supervisi).
- **Jadwal Kredensial** — agenda telaah berkas, asesmen, penilaian lapangan, dst.
- **Akun Saya** (menu terpisah di bagian bawah sidebar) — profil dan keamanan (ganti kata sandi, keluar).
- **Cetak/PDF** — tombol cetak pada seluruh dokumen read-only (via dialog cetak browser → simpan sebagai PDF).

### Modul Staf (6 peran lain)
Setiap peran melihat dashboard antrean "Perlu Tindakan Anda" sesuai tahap pengajuan:
- **Operator Kredensial** — *Verifikasi Berkas*: periksa kelengkapan biodata & formulir asesi, lolos/teruskan/kembalikan ke draf; *Verifikasi Akun*: aktifkan atau tolak pendaftaran akun mandiri; *Kelola Jadwal*: buat, ubah, hapus agenda kredensialing.
- **Asesor & Mitra Bestari** — *Penilaian Kewenangan*: beri kode rekomendasi 1–4 per kewenangan klinis usulan asesi.
- **Ketua Tim Kredensial** — *Rekomendasi Tim*: simpulan penilaian, isi rekomendasi (validasi: seluruh kewenangan wajib dinilai), teruskan ke Kadis.
- **Kepala Dinas Kesehatan** — *Rekomendasi & Ketetapan*: terbitkan surat rekomendasi (nomor, tanggal, lampiran ketetapan kewenangan).
- **Pimpinan Fasyankes** — *Surat Penugasan Klinis*: terbitkan SPK dan tandai selesai.

Semua transisi status divalidasi per peran + status sumber di server (API guard), sehingga alur tidak bisa dilompati.

### Pendaftaran Akun Mandiri
- Halaman publik **`/daftar`** (tautan dari halaman login) — pendaftar memilih peran:
  **Asesi**, **Asesor**, atau **Pimpinan Fasyankes**.
- Akun baru berstatus **Menunggu Verifikasi** dan belum bisa dipakai masuk.
- **Operator Kredensial** memverifikasi lewat menu **Verifikasi Akun**: mengaktifkan
  (akun langsung bisa dipakai) atau menghapus (menolak pendaftaran).
- Percobaan login akun yang belum diverifikasi menampilkan pesan yang jelas,
  bukan sekadar "email/sandi salah".
- Kartu pengingat muncul di dashboard operator saat ada pendaftaran menunggu.

### Panduan Penggunaan Terpadu (v2.3)
- Halaman publik **`/panduan`** (tautan dari halaman Masuk dan bilah samping bagian
  **Akun Saya**) — buku saku digital penggunaan platform.
- **Tab per peran**: Alur Umum, **Asesi**, **Operator Kredensial**,
  **Asesor**, **Tim Kredensial** (Ketua Tim per profesi v2.1), **Pimpinan Faskes**,
  dan **Tanya Jawab** (FAQ Accordion).
- Tiap peran berisi langkah bernomor sesuai menu asli, chip "Menu: …", daftar menu
  bilah samping, legenda Kode Diminta/Kode Rekomendasi, dan tips penting.
- Tab peran dipilih otomatis mengikuti sesi pengguna yang sedang masuk
  (atau tautan langsung `?peran=asesi|operator|asesor|tim|pimpinan`).
- Alur 8 tahap divisualkan, tombol Cetak tersedia, seluruhnya mengikuti tema
  hijau lambang Kutai Barat; halaman tetap publik (dikecualikan pada proxy).

## Tumpuan Teknologi
- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS 4** + shadcn/ui
- **Prisma ORM** — SQLite untuk pratinjau lokal, **PostgreSQL (Neon)** untuk produksi
- **NextAuth v4** (credentials, JWT session) — aman untuk serverless Vercel
- Deployment target: **GitHub → Vercel**, database **Neon**

---

## Menjalankan Secara Lokal

```bash
# 1. Install dependensi
bun install        # atau: npm install

# 2. Salin environment
cp .env.example .env
# sesuaikan DATABASE_URL lokal: file:./db/custom.db

# 3. Dorong skema ke database + isi data demo
bun run db:push
bun run seed

# 4. Jalankan
bun run dev
```

### Akun Demo (data seed)
| Email | Peran |
|-------|-------|
| asesi@kredens.go.id | Asesi **+ fungsi tambahan Asesor & Pimpinan Fasyankes** (contoh multi-fungsi v2.1) |
| asesor@kredens.go.id | Asesor |
| operator@kredens.go.id | Operator Kredensial |
| ketuatim@kredens.go.id | Ketua Tim Kredensial — profesi **Dokter** |
| ketuatim.perawat@kredens.go.id | Ketua Tim Kredensial — profesi **Perawat** (v2.1) |
| mitra@kredens.go.id | Mitra Bestari |
| pimpinan@kredens.go.id | Pimpinan Fasyankes |
| calon.asesor@kredens.go.id | Calon asesor — contoh pendaftaran mandiri, status **Menunggu Verifikasi** (masuk sebagai operator untuk mengaktifkannya) |
| kadis@kredens.go.id | Kepala Dinas Kesehatan |

Kata sandi seluruh akun demo: **kredens123**

---

## Deployment: GitHub + Vercel + Neon

### 1. Siapkan Database Neon
1. Daftar/masuk ke [neon.tech](https://neon.tech) → **Create Project** (pilih region terdekat, mis. Singapore).
2. Buka **Dashboard → Connection Details**, salin *connection string* berformat:
   `postgresql://USER:PASSWORD@EP-HOST/DBNAME?sslmode=require`
3. Tidak perlu mengisi data secara manual — langkah **Auto-setup** di bawah yang menyiapkannya.
   (Alternatif manual dari komputer ber-Node.js:
   `DATABASE_URL="postgresql://..." bun run db:push:pg && DATABASE_URL="postgresql://..." bun run seed`)

### 2. Push Proyek ke GitHub
```bash
git init
git add .
git commit -m "KREDENS v2.kubar: platform kredensial tenaga medis & kesehatan Kutar"
git branch -M main
git remote add origin https://github.com/<username>/kredensv2kubar.git
git push -u origin main
```

> Gunakan nama repo **`kredensv2kubar`** (huruf kecil, tanpa titik/garis) agar
> konsisten dengan URL produksi.

### 3. Import ke Vercel
1. Masuk [vercel.com](https://vercel.com) → **Add New → Project** → pilih repositori GitHub `kredensv2kubar`.
2. Framework preset terdeteksi otomatis (**Next.js**). **Biarkan Build Command bawaan** —
   `vercel.json` mengarahkan ke `scripts/vercel-build.mjs` yang membangun dengan **webpack**
   (bukan Turbopack) dan membersihkan cache `.next` otomatis.
   > ⚠️ Jangan mengganti Build Command ke `next build` biasa: bundler Turbopack bawaan
   > Next.js 16 panik saat build (*Dependency tracking is disabled so invalidation is not
   > allowed*) sehingga deployment selalu gagal. Perbaikan ini masuk di **v2.2**.
3. Buka **Environment Variables**, tambahkan:
   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | `postgresql://neondb_owner:npg_SydNvtge40RY@ep-late-morning-a1m0ql28-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |
   | `NEXTAUTH_SECRET` | `324d783744728d949132525c95b314c9` |
   | `NEXTAUTH_URL` | `https://kredensv2kubar.vercel.app` |
4. **Deploy**.

### 4. Auto-setup Database (sekali saja setelah deploy)
Buka **`https://kredensv2kubar.vercel.app/api/setup`** satu kali di browser.
Endpoint ini otomatis:
1. Membuat seluruh tabel (DDL PostgreSQL, idempoten — aman dibuka ulang).
2. Mengisi 7 akun demo + data contoh bila database masih kosong.

Hasil `"ok": true` berarti database siap. Selain itu, **percobaan login pertama**
juga memicu setup yang sama (agak lambat ±10–30 detik pada percobaan pertama — normal).

### 5. Selesai
Aplikasi aktif di **https://kredensv2kubar.vercel.app**. Setiap `git push` ke `main` akan memicu deploy ulang otomatis.

### Cara kerja pemilihan skema Prisma (otomatis)
Proyek memuat dua skema Prisma: `prisma/schema.prisma` (SQLite, pratinjau lokal) dan `prisma/schema.postgres.prisma` (PostgreSQL/Neon, produksi). Hook `postinstall` (`scripts/prisma-generate.mjs`) memeriksa `DATABASE_URL` pada fase build:
- `DATABASE_URL` berawalan `postgresql://` → Prisma Client dibuat dari `schema.postgres.prisma`
- selain itu → Prisma Client dibuat dari `schema.prisma` (SQLite)

Dengan begitu build Vercel **selalu** menghasilkan client yang cocok dengan database produksi tanpa konfigurasi tambahan. Bila ingin memaksa manual, atur Build Command di Vercel:

```bash
npx prisma generate --schema prisma/schema.postgres.prisma && npx next build --webpack
```

> **Penting Vercel + Neon:** NextAuth berjalan dengan strategi **JWT** sehingga tidak memerlukan tabel sesi; Prisma Client berjalan normal di runtime Node.js Vercel. Untuk koneksi lebih efisien pada skala besar, pertimbangkan *pooled connection string* Neon (`...-pooler...`) pada `DATABASE_URL`.

---

## Struktur Proyek (Inti)

```
prisma/
  schema.prisma                # skema SQLite (pratinjau lokal)
  schema.postgres.prisma       # skema PostgreSQL (Neon produksi)
scripts/
  seed.ts                      # seed manual lokal (memanggil src/lib/seed-demo.ts)
src/
  app/
    login/                     # halaman masuk
    (app)/                     # area terproteksi (sidebar + header)
      dashboard/               # dashboard per peran
      pengajuan/               # daftar + buat + detail pengajuan
      biodata/                 # riwayat-hidup, formulir, kewenangan-klinis
      kredensialing/           # rekomendasi tim, kadis, lampiran (read-only)
      spk-rkk/                 # surat penugasan klinis, RKK final (read-only)
      jadwal-kredensial/       # agenda kredensialing
      akun-saya/               # profil & keamanan
      operator/                # verifikasi berkas + kelola jadwal
      penilaian/               # penilaian kewenangan (asesor & mitra bestari)
      ketua-tim/               # rekomendasi tim
      kadis/                   # rekomendasi & ketetapan kadis
      pimpinan/                # surat penugasan klinis (SPK)
    api/                       # REST API (auth, biodata, pengajuan, jadwal, akun, staf, setup)
  components/kredens/          # AppShell, dashboard, badge, read-only, komponen staf
  lib/                         # auth, db, constants, password, format, role-guard
  lib/bootstrap.ts             # auto-setup database produksi (tabel + data demo)
  lib/seed-demo.ts             # sumber data demo (dipakai seed & bootstrap)
```

## Alur Kredensialing End-to-End (8 tahap)
```
DRAF → DIAJUKAN → VERIFIKASI OPERATOR → PENILAIAN TIM → REKOMENDASI TIM
     → REKOMENDASI KADIS → KETETAPAN KADIS → SURAT PENUGASAN (SPK) → SELESAI
```
| Tahap | Pelaksana | Aksi |
|-------|-----------|------|
| Draf → Diajukan | Asesi | Mengajukan pengajuan dari halaman Pengajuan |
| Verifikasi | Operator Kredensial | Memeriksa berkas; lolos → lanjut, tidak lengkap → kembali ke draf |
| Penilaian | Asesor + Mitra Bestari | Memberi kode rekomendasi 1–4 per kewenangan |
| Rekomendasi Tim | Ketua Tim | Menyusun kesimpulan & meneruskan |
| Rekomendasi & Ketetapan | Kepala Dinas | Menerbitkan surat rekomendasi + lampiran ketetapan |
| Surat Penugasan | Pimpinan Fasyankes | Menerbitkan SPK; status menjadi SELESAI |

Data demo mencakup satu pengajuan **SELESAI** (KR-2025-1001), satu **REKREDENSIAL** draf (KR-2026-1002), dan satu pengajuan pada tahap **PENILAIAN TIM** (KR-2026-1003) agar seluruh peran dapat langsung diuji.
