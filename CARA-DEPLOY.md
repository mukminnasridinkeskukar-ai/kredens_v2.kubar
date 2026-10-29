# CARA UPLOAD KREDENS v2.kubar KE GITHUB & DEPLOY KE VERCEL

Panduan ini untuk pemula. Ikuti pelan-pelan, satu per satu.
Total waktu: sekitar 15 menit.

> Nama teknis proyek: **kredensv2kubar** (huruf kecil, tanpa titik/garis —
> format ini yang dipakai untuk nama repo GitHub, nama proyek Vercel,
> dan nama paket di package.json). Nama tampilan di layar tetap
> **KREDENS v2.kubar**.

---

## BAGIAN 1 — UPLOAD KE GITHUB

### Langkah 1: Ekstrak file ZIP ini
1. Klik kanan file ZIP `kredensv2kubar` → **Extract All / Ekstrak Semua**.
2. Akan muncul folder berisi banyak file proyek.

### Langkah 2: Buat repositori baru di GitHub
1. Buka browser, masuk ke **https://github.com** (daftar/log in dulu bila belum punya akun).
2. Klik tombol **+** di pojok kanan atas → pilih **New repository**.
3. Isi:
   - Repository name: `kredensv2kubar` (huruf kecil semua, tanpa spasi/titik)
   - Pilih **Private** (disarankan, karena berisi data pegawai).
4. Klik **Create repository**.

### Langkah 3: Unggah semua file
1. Di halaman repositori yang baru dibuat, cari tulisan
   **"uploading an existing file"** (link biru) → klik.
2. Buka folder `kredens` hasil ekstraksi tadi.
3. **Seleksi SEMUA isinya** (Ctrl+A di dalam folder), lalu **seret (drag)**
   semuanya ke area unggah di browser.
   - Penting: yang diseret adalah ISI folder `kredens`, bukan foldernya,
     dan bukan file ZIP-nya.
   - Jika diminta izin menampilkan file tersembunyi (mis. `.gitignore`),
     pilih "tampilkan juga" / biarkan ikut terunggah.
4. Tunggu sampai semua file selesai diunggah (bisa beberapa menit,
   ada ratusan file kecil).
5. Di bawah, isi *Commit message* dengan: `KREDENS versi awal`
6. Klik tombol hijau **Commit changes**.

✅ Selesai Bagian 1. Kode Anda sekarang ada di GitHub.

---

## BAGIAN 2 — BUAT DATABASE DI NEON

1. Buka **https://neon.tech** → **Sign Up** (gratis, bisa pakai akun GitHub).
2. Klik **Create Project**:
   - Project name: `kredens`
   - Region: **Singapore**
3. Setelah jadi, cari panel **Connection Details** (atau menu **Dashboard → Connect**).
4. Salin *connection string* yang bentuknya seperti ini
   (klik tombol copy, simpan dulu di Notepad):

   ```
   postgresql://namauser:password@ep-something-123.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

✅ Selesai Bagian 2. Anda sudah punya alamat database.

---

## BAGIAN 3 — DEPLOY DI VERCEL

### Langkah 1: Import proyek
1. Buka **https://vercel.com** → **Sign Up / Log in dengan GitHub**.
2. Klik **Add New → Project**.
3. Cari repositori `kredensv2kubar` → klik **Import**.
4. **Penting (sudah otomatis di v2.2):** Build Command memakai
   `scripts/vercel-build.mjs` yang membangun aplikasi dengan **webpack**.
   Jangan mengganti Build Command ke `next build` biasa — bundler Turbopack
   bawaan Next.js 16 panik saat build (error *Dependency tracking is
   disabled so invalidation is not allowed*) dan deployment gagal.

### Langkah 2: Isi Environment Variables
Sebelum menekan Deploy, buka bagian **Environment Variables**,
lalu tambahkan 3 baris ini:

| Name | Value |
|------|-------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_SydNvtge40RY@ep-late-morning-a1m0ql28-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |
| `NEXTAUTH_SECRET` | `324d783744728d949132525c95b314c9` |
| `NEXTAUTH_URL` | `https://kredensv2kubar.vercel.app` |

> Nilai di atas adalah nilai produksi yang sudah disiapkan — salin persis.
> Bila suatu saat ganti nama proyek Vercel, sesuaikan `NEXTAUTH_URL`
> (harus sama persis dengan alamat situs, tanpa garis miring di akhir).

### Langkah 3: Deploy
1. Klik tombol **Deploy**.
2. Tunggu 2–5 menit sampai muncul tulisan **Congratulations!**.
3. Klik **Continue to Dashboard → Visit** — aplikasi KREDENS Anda sudah online!

### Langkah 4: Isi database (sekali saja, ±1 menit)
1. Di browser, buka alamat aplikasi Anda ditambah `/api/setup`,
   contoh: `https://kredensv2kubar.vercel.app/api/setup`
2. Tunggu sampai muncul tulisan `"ok": true` (artinya tabel + akun demo
   sudah dibuat otomatis di database Neon).
3. Selesai — tidak perlu menginstal apa pun di komputer.

> Catatan: halaman login juga bisa langsung dipakai — percobaan login
> pertama akan menyiapkan database secara otomatis (agak lambat ±10–30
> detik pada percobaan pertama, itu normal).

---

## BAGIAN 4 — MASUK KE APLIKASI

Akun demo bawaan (kata sandi semua akun: **kredens123**).
Seluruh 7 peran sudah memiliki modul yang berfungsi penuh.

> Tulis email persis seperti di tabel — semuanya berakhiran **@kredens.go.id**
> (bukan @kredens.kukar.go.id).

| Email | Peran | Menu utama setelah masuk |
|-------|-------|--------------------------|
| asesi@kredens.go.id | Asesi | Pengajuan, Biodata, Kredensialing, SPK & RKK, Jadwal |
| operator@kredens.go.id | Operator Kredensial | Verifikasi Berkas (+ penetapan 3 asesor), Kelola Jadwal |
| asesor@kredens.go.id | Asesor | Penilaian Kewenangan (hanya pengajuan yang ditugaskan) |
| mitra@kredens.go.id | Mitra Bestari | Penilaian Kewenangan |
| ketuatim@kredens.go.id | Ketua Tim Kredensial | Rekomendasi Tim |
| kadis@kredens.go.id | Kepala Dinas Kesehatan | Rekomendasi & Ketetapan |
| pimpinan@kredens.go.id | Pimpinan Fasyankes | Surat Penugasan Klinis (SPK) |
| superadmin@kredens.go.id | Superadmin | Template Kewenangan (unggah massal CSV) |
| calon.asesor@kredens.go.id | (contoh pendaftaran mandiri, status Menunggu Verifikasi) | Masuk sebagai operator → Verifikasi Akun → Aktifkan |

**Akun Superadmin (akses penuh):**
Superadmin adalah peran dengan kendali tertinggi di KREDENS:
- **Semua data**: seluruh pengajuan pada semua tahap (termasuk draf) lewat menu
  **Semua Pengajuan**, rincian lengkap tiap pengajuan, serta membuka modul staf
  mana pun (Verifikasi Berkas, Penilaian, Rekomendasi Tim, Ketetapan Kadis,
  SPK, Jadwal).
- **Semua akun**: verifikasi & nonaktifkan/aktifkan, ubah peran, ubah data,
  reset kata sandi, dan hapus akun lewat menu **Kelola Akun**.
- **Template Kewenangan**: menambah kewenangan untuk profesi lain (Apoteker,
  Sanitarian, dll.) melalui unggah massal CSV.
- Database baru: akun ini otomatis dibuat saat setup pertama.
- Database lama (sebelum pembaruan ini): akun otomatis dibuat juga saat
  aplikasi versi baru pertama kali diakses. Bila belum muncul, jalankan
  sekali file **sql/superadmin-neon.sql** di Neon Console → SQL Editor.

**Alur penugasan tiga asesor (sejak pembaruan ini):**
Saat Operator menyatakan berkas **lengkap** ( Lolos Verifikasi — Lanjut ke
Penilaian Tim), aplikasi mewajibkan Operator memilih **tepat tiga Asesor**
dari daftar asesor aktif. Hanya ketiga asesor tersebut yang dapat membuka
lembar penilaian dan mengisi kode rekomendasi pada pengajuan itu; asesor
lain tidak melihatnya di menu Penilaian. Mitra Bestari dan Ketua Tim tetap
melihat seluruh pengajuan tahap penilaian seperti sebelumnya. Tabel baru
`PenugasanAsesor` dibuat otomatis oleh bootstrap pada deployment lama —
tidak ada perintah SQL tambahan yang perlu dijalankan.

**Pendaftaran akun baru (tanpa bantuan admin):**
Orang yang belum punya akun dapat mendaftar sendiri lewat tombol **Daftar Akun**
di halaman masuk (memilih peran Asesi / Asesor / Pimpinan Fasyankes).
Akun baru **aktif setelah Operator Kredensial memverifikasinya** lewat menu
**Verifikasi Akun**.

**Cara mencoba alur lengkap (opsional):**
Masuk sebagai asesi → buka **Pengajuan** → ajukan salah satu draf.
Lalu bergantian masuk dengan akun lain: operator memverifikasi berkas,
asesor & mitra mengisi penilaian, ketua tim membuat rekomendasi,
kadis menerbitkan surat ketetapan, pimpinan menerbitkan SPK.
Setiap tahap otomatis terlihat di timeline asesi.

> Keamanan: setelah online, segera ganti kata sandi tiap akun
> lewat menu **Akun Saya → Keamanan**.

---

## MASALAH UMUM (TROUBLESHOOTING)

**1. Deploy gagal / error saat build di Vercel**
- **v2.2 sudah memperbaiki penyebab utamanya:** panic Turbopack
  (`TurbopackInternalError: Dependency tracking is disabled so invalidation
  is not allowed`). `scripts/vercel-build.mjs` kini otomatis membersihkan
  cache `.next` dan membangun dengan `next build --webpack`.
- Pastikan Build Command di Vercel TIDAK diubah/ditimpa — biarkan memakai
  `vercel.json` dari proyek.
- Pastikan 3 Environment Variables sudah terisi dengan benar
  (tanpa spasi berlebih, tanpa tanda kutip).
- Buka tab **Deployments** → klik deployment merah → baca **Build Logs**
  → bagian merahnya biasanya menyebut variabel mana yang salah.

**2. Halaman login muncul tapi tidak bisa masuk**
- Pastikan `NEXTAUTH_URL` sama persis dengan alamat situs Anda
  (mis. `https://kredensv2kubar.vercel.app`, tanpa garis miring di akhir).
- Pastikan `NEXTAUTH_SECRET` sudah diisi.

**3. Login gagal 401 / "Email atau kata sandi tidak sesuai" padahal kata sandi benar**
- Database kemungkinan belum terisi. Buka `https://alamat-anda.vercel.app/api/setup`
  sampai muncul `"ok": true`, lalu coba login lagi.
- Pastikan email ditulis persis: `asesi@kredens.go.id` (bukan yang lain)
  dan kata sandi `kredens123` (huruf kecil semua).
- Setelah mengubah Environment Variables di Vercel, lakukan **Redeploy**
  (tab Deployments → titik tiga → Redeploy) agar pengaturan baru aktif.

**4. Ingin memperbarui aplikasi nanti**
- Ubah file di GitHub (edit langsung di web, atau unggah ulang file yang berubah)
  → Vercel otomatis deploy ulang dalam ~1 menit.

**5. Build gagal di Vercel — "exited with 1"**
Pesan `Command ... exited with 1` hanyalah baris terakhir; penyebab sesungguhnya
tertulis beberapa baris di atasnya. Langkah pemeriksaan, berurutan:

- **Gunakan ZIP versi terbaru.** ZIP KREDENS v1.1 (dengan fitur Logbook) sudah
  menyertakan `scripts/vercel-build.mjs` yang mengurus `prisma generate` +
  `next build` secara otomatis. Skrip versi lama yang tertinggal di repo dapat
  membuat build gagal — pastikan file `scripts/vercel-build.mjs` di repo adalah
  versi dari ZIP terbaru (timpa file lama).
- **Bersihkan file lama saat mengunggah versi baru.** GitHub Desktop *tidak*
  menghapus file yang tidak ada lagi di ZIP baru. Cara aman: hapus seluruh isi
  folder repo, lalu salin isi ZIP terbaru (isi folder `kredens/` ke **akar**
  repo), commit, push.
- **Pastikan struktur repo benar**: `package.json`, `src/`, `prisma/`,
  `scripts/` harus berada di **akar repo**, bukan di dalam subfolder `kredens/`.
  Bila berada di subfolder, isi **Root Directory** pada Vercel → Settings →
  General dengan nama subfolder tersebut.
- **Environment Variables** (Settings → Environment Variables) wajib berisi:
  `DATABASE_URL` (URL PostgreSQL Neon), `NEXTAUTH_SECRET`, dan `NEXTAUTH_URL`
  (= alamat situs persis, tanpa garis miring di akhir).
- **Baca log yang sebenarnya**: tab Deployments → klik deployment merah →
  Build Logs; gulir ke atas dari baris `exited with 1` dan cari baris berisi
  kata `Error` / `error` — itulah penyebabnya.
- Build terverifikasi pada kode v1.1: `prisma generate --schema
  prisma/schema.postgres.prisma` + `next build` berjalan tanpa error (semua
  rute, termasuk Logbook, terdaftar).

**6. Pembaruan versi 1.2 (unggah dokumen SPK/RKK + tempat kerja)**
- Fitur baru: unggah pindaian SPK (pimpinan fasyankes) & RKK (ketua tim) yang dapat
  diunduh asesi; tempat kerja asesi berupa pilihan fasyankes yang dikelola Superadmin
  dan terhubung ke akun pimpinan fasyankes.
- Tidak ada SQL manual: tabel & kolom baru (TempatKerja, DokumenPengajuan,
  tempatKerjaId) dibuat OTOMATIS oleh bootstrap saat deployment baru diakses pertama
  kali; data lama (teks tempat kerja/instansi) dimigrasikan otomatis ke daftar
  TempatKerja.
- Langkah pembaruan tetap sama: unggah isi ZIP terbaru ke GitHub (hapus file lama yang
  sudah tidak ada), pastikan Redeploy berjalan, selesai.

**7. Setelah update: halaman error "Server Components render" (di console browser
muncul `An error occurred in the Server Components render... A digest property...`)**
- Penyebab: struktur database belum lengkap untuk versi baru — tabel/kolom baru
  (mis. v1.2: `TempatKerja`, `DokumenPengajuan`, `tempatKerjaId`) belum terpasang di
  Neon, sedangkan pengguna membuka aplikasi memakai sesi lama (tanpa login ulang,
  yang dulu menjadi pemicu pembuatan struktur otomatis).
- **Solusi cepat (tanpa deploy ulang):** buka
  `https://alamat-anda.vercel.app/api/setup` satu kali di peramban. Halaman ini
  membuat seluruh tabel/kolom yang kurang secara otomatis (idempoten — aman dibuka
  berulang). Bila responsnya `"ok": true`, aplikasi sudah sehat kembali.
- **Solusi permanen:** gunakan ZIP v1.2.1 (atau lebih baru). Versi ini menambahkan
  `src/instrumentation.ts` sehingga struktur database disiapkan otomatis SETIAP kali
  server start, sebelum halaman mana pun dilayani — sehingga kasus serupa tidak
  terulang pada pembaruan versi berikutnya.
- Cara membaca kode galat: angka `digest` (mis. `3237281317`) tampil pada layar error
  dan di console; sebutkan angka tersebut saat melapor agar mudah dicari di log
  Vercel (tab Deployments → Runtime Logs).

**10. Pembaruan versi 1.2.4 — panel "Dokumen Pindaian Masuk" untuk Superadmin**
- Halaman **Semua Pengajuan** superadmin kini memiliki:
  1) kolom **Dokumen** pada tabel — badge `SPK` / `RKK` hijau-biru untuk pengajuan
     yang pindaianya sudah terunggah (tanpa perlu membuka rincian); dan
  2) panel **Dokumen Pindaian Masuk (SPK & RKK)** — seluruh pindaian yang masuk
     dari seluruh pengajuan, urut terbaru, lengkap dengan kode pengajuan, nama
     asesi, status, dan tombol **Lihat/Unduh** langsung (10 terbaru; jumlah
     seluruhnya tertera pada badge).
- Alur pimpinan fasyankes & asesi tidak berubah: daftar pimpinan tetap
  menampilkan kolom "Dokumen SPK", tombol unggah tetap di halaman detail
  (klik **Proses**), dan asesi tetap mengunduh dari menu **SPK dan RKK**.
- Cara pembaruan sama seperti biasa: timpa file yang berubah di GitHub dengan
  isi ZIP terbaru → commit → Vercel deploy ulang otomatis.

**11. Pembaruan versi 1.2.5 — diagnosis mandiri saat ada galat setelah deploy**
- Halaman galat aplikasi kini menampilkan **tautan pemulihan langsung**: buka
  `/api/setup`; bila tertulis `ok: false`, buka `/api/setup?force=1` sekali
  sampai muncul `ok: true`, lalu login kembali — selain kode galat yang sudah
  ditampilkan sebelumnya.
- `/api/setup` kini melaporkan penyebab teknis bila penyiapan database gagal.
- Bootstrap diperkuat: penanda struktur database disimpan **setelah seluruh
  tabel dibuat dan sebelum pengisian data demo**, sehingga kegagalan pengisian
  data tidak lagi membuat halaman crash maupun memicu DDL ulang tiap server
  menyala. Tiap langkah pengisian data dijaga sendiri-sendiri.
- Bila galat masih muncul: Vercel → **Deployments** → Runtime Logs → cari
  baris `[bootstrap]`, salin dan laporkan beserta kode galatnya.

**12. Pembaruan versi 1.2.6 — /api/setup menyebutkan penyebab koneksi gagal**
- Laporan `/api/setup` diperinci sehingga tidak lagi berhenti pada
  `"akun: -1"` tanpa alasan. Bila database tidak terhubung, JSON kini memuat:
  1) **`konfigurasiDb`** — benar/tidaknya `DATABASE_URL` terbaca sebagai
     Postgres, beserta URL tersamar tanpa kredensial;
  2) **`galatKoneksi`** — pesan asli kueri yang gagal;
  3) **`penyebab`** + **`pesan`** — ringkasan dan langkah perbaikan otomatis
     sesuai kasusnya.
- Tiga kasus dibedakan: `DATABASE_URL` kosong/bukan postgres (→ isi env var
  lalu **WAJIB Redeploy**), env terbaca tetapi kueri gagal (→ cek Neon aktif,
  kredensial, host), database terhubung tetapi kosong (→ `/api/setup?force=1`).
- **Penting**: pastikan `vercel.json`, `src/proxy.ts`, dan
  `scripts/vercel-build.mjs` ikut terunggah di GitHub (semuanya ada pada akar
  ZIP). Tanpa `vercel.json`, build Vercel memakai command bawaan yang tidak
  sesuai dan region Singapore (sin1) tidak aktif.

**13. Pembaruan versi 1.3.0 — Superadmin: lihat & kelola username/sandi seluruh akun**
- Hanya **Superadmin** yang kini dapat:
  1. **Melihat username dan sandi seluruh pengguna** — pada halaman
     **Kelola Akun**, setiap baris akun memiliki baris "Sandi" bertanda ••••••••
     dengan tombol **Lihat/Sembunyikan** per akun, serta tombol
     **Tampilkan Semua Sandi** untuk memunculkan seluruhnya sekaligus
     (peran lain ditolak 403 di tingkat API);
  2. **Mengganti username** akun lain — tombol **Username** pada baris akun
     (format email, dicek unik; pengguna wajib masuk memakai username baru);
  3. **Mereset kata sandi** akun lain — tombol **Reset Sandi** (sistem dapat
     membuat sandi acak yang aman, atau isi sandi pilihan, minimal 8 karakter).
- Cara kerja teknis (ringkas): sandi tetap disimpan sebagai hash satu-arah
  untuk verifikasi login; SEJALAN ITU disimpan salinan terenkripsi
  AES-256-GCM yang kuncinya diturunkan dari secret server — sehingga sandi
  dapat ditampilkan kepada Superadmin tetapi tidak dapat dibaca dari database
  saja. Salinan terenkripsi tidak pernah dikirim mentah ke browser.
- Akun lama yang sandinya masih sandi demo bawaan (kredens123) otomatis
  mendapat salinan saat server menyala. Akun dengan sandi lain (atau salinan
  yang tidak terbaca karena secret pernah diganti) menampilkan
  "belum tersimpan — gunakan Reset Sandi": reset sekali, setelah itu sandinya
  dapat dilihat kapan saja.
- Setiap pembacaan/penggantian/penyetelan ulang sandi dicatat pada log server
  (baris `[audit]`) — dapat ditelusuri lewat Vercel → Deployments → Runtime Logs.
- Pembaruan struktur database (kolom baru pada tabel User) berjalan otomatis
  saat deployment baru menyala, atau sekali lewat `/api/setup?force=1`.

**14. Pembaruan versi 1.3.1 — Pemulihan akses: sandi yang dibuat/diubah langsung di tabel Neon kini bisa dipakai masuk**

*Situasi yang sebelumnya gagal:* sandi superadmin dibuat atau diubah dengan
mengetiknya langsung pada tabel `User` di Neon Console (SQL Editor), mis.

```sql
UPDATE "User" SET "passwordHash" = 'SandiBaruSaya123'
WHERE "email" = 'superadmin@kredens.go.id';
```

Pada versi lama login PASTI gagal ("Email atau kata sandi tidak sesuai")
walaupun sandinya benar, karena kolom `passwordHash` berisi **sandi polos**
bukan hash scrypt milik aplikasi. Kini (v1.3.1) sudah diperbaiki:

- **Sandi polos di database dikenali saat login** — pada percobaan masuk
  pertama, sandi tersebut otomatis di-upgrade menjadi hash scrypt yang aman
  (terjadi sekali, tanpa langkah tambahan), lalu login berjalan normal.
- **Salinannya ikut terisi** — sandi tersebut juga langsung terlihat oleh
  Superadmin di menu **Kelola Akun** (fitur lihat sandi v1.3.0).
- **Email tidak lagi memedulikan huruf besar/kecil** — akun yang dibuat
  manual dengan email `SuperAdmin@Kredens.GO.ID` tetap dapat masuk meski
  diketik `superadmin@kredens.go.id`.

**Resep pemulihan superadmin (±2 menit):**

1. *Bila sudah memakai ZIP v1.3.1 (atau lebih baru):* di Neon Console →
   SQL Editor, set sandi pilihan Anda sebagai teks biasa:

   ```sql
   UPDATE "User"
   SET "passwordHash" = 'SandiBaruSaya123', "isActive" = true,
       "role" = 'SUPERADMIN'
   WHERE LOWER("email") = 'superadmin@kredens.go.id';
   ```

   Lalu masuk ke aplikasi memakai sandi `SandiBaruSaya123` — selesai;
   sistem mengamankannya otomatis setelah login.

2. *Bila aplikasi masih versi lama (sebelum 1.3.1):* jalankan sekali file
   **sql/superadmin-neon.sql** (ada di dalam ZIP) di Neon Console — sandi
   kembali ke `kredens123` dengan hash yang benar — lalu perbarui aplikasi
   ke ZIP v1.3.1 dan ganti sandi lewat menu **Akun Saya → Keamanan**.

**Checklist bila login superadmin masih gagal:**
- `NEXTAUTH_URL` di Vercel harus sama persis dengan alamat situs
  (tanpa garis miring di akhir) — setelah diubah, **Redeploy**.
- Pastikan baris akun memiliki `"role" = 'SUPERADMIN'` dan
  `"isActive" = true`.
- Pastikan email yang diketik memakai domain yang benar
  (`@kredens.go.id`).
- Cek log server (Vercel → Deployments → Runtime Logs): baris
  `[audit] ... di-upgrade otomatis ke hash scrypt` menandakan jalur
  pemulihan bekerja.

**15. Pembaruan versi 1.3.2 — Akun Asesi: unduh & unggah Formulir Kewenangan Klinis**
- Pada menu **Rincian Kewenangan Klinis** (asesi), kanan atas kini tersedia dua tombol:
  1. **Unduh Formulir (PDF)** — formulir siap cetak berisi daftar kewenangan klinis yang
     diusulkan pada pengajuan terpilih. Kolomnya sama persis dengan tabel pada layar:
     **No | Kode | Daftar Diagnosa/Keterampilan | Diminta | Rekomendasi** (kolom Rekomendasi
     dibiarkan kosong bila penilaian tim belum ada — sebagai ruang isian manual di kertas),
     dilengkapi keterangan kode Diminta serta **blok tanda tangan Asesi dan Asesor
     Kredensial** di bagian bawah halaman terakhir. Berkas bernama
     `Formulir-Kewenangan-Klinis-<kode>.pdf` (bisa lebih dari 1 halaman bila item banyak).
  2. **Unggah Formulir** — memasukkan pindaian formulir yang sudah diisi dan ditandatangani
     (PDF/JPG/PNG/WebP, maksimal 5 MB). Unggah ulang menimpa berkas sebelumnya.
- Setelah terunggah, panel hijau **"Formulir bertanda tangan sudah diunggah"** tampil di
  halaman tersebut dengan tombol **Lihat** (membuka dokumen) dan **Ganti** (unggah ulang).
- Dokumen ini juga otomatis muncul pada panel **Dokumen Pindaian Masuk** milik Superadmin
  (menu Semua Pengajuan) dengan badge `FORM_KEWENANGAN`, dan dapat diunduh staf penilai
  dari rincian pengajuan.
- Hanya asesi pemilik pengajuan yang dapat mengunduh formulir PDF dan mengunggah;
  peran lain ditolak (403/404). Tidak ada perubahan struktur database — dokumen memakai
  tabel DokumenPengajuan yang sudah ada (jenis baru `FORM_KEWENANGAN`), sehingga pembaruan
  cukup mengunggah isi ZIP seperti biasa.

**16. Pembaruan versi 1.3.3 — Akun Pimpinan Fasyankes: Template Contoh Surat Penugasan Klinis (SPK)**
- Pada panel **Unggah Dokumen SPK** (rincian pengajuan di akun pimpinan fasyankes), di
  **sebelah kiri** tombol unggah kini tersedia tombol **Template Contoh (PDF)**.
- Template berupa contoh surat resmi **"SURAT PENUGASAN KLINIS"** yang mengikuti sheet
  SURAT PENUGASAN KLINIS pada Template Akun Asesi, dengan kalimat-kalimat yang kurang
  lengkap telah dirangkai utuh: blok *Yang bertanda tangan di bawah ini* (Nama/NIP/Jabatan
  Kepala UPTD — Pemberi Tugas), blok *Dengan ini memberikan Penugasan Klinis kepada*
  (Nama/NIP/Jenis Tenaga Kesehatan — Penerima Tugas), kalimat pelayanan di UPTD sesuai
  surat ketetapan kewenangan klinis (nomor & tanggal), kalimat masa berlaku penugasan
  sampai perubahan keputusan Kepala Dinas Kesehatan Kab. Kutai Barat, serta blok
  tanda tangan **Sendawar, … — Kepala UPTD (tanda tangan dan cap dinas, nama, NIP/NIK)**.
- **Data pengajuan terisi otomatis** dari yang sudah ada di sistem: nomor & tanggal SPK,
  nama UPTD, nomor ketetapan kewenangan klinis + tanggalnya, masa berlaku, identitas
  asesi (nama/NIP/profesi), serta nama & NIP pimpinan. Bagian yang belum ada ditampilkan
  sebagai garis titik untuk dilengkapi manual sebelum ditandatangani.
- Berkas bernama `Template-Contoh-SPK-<kode>.pdf`, terbuka di tab baru (siap dicetak).
- Wewenang sama dengan unggah SPK: hanya pimpinan fasyankes pemilik asesi (403 bila
  bukan wewenangnya). Tidak ada perubahan struktur database — pembaruan cukup mengunggah
  isi ZIP seperti biasa.

**17. Pembaruan versi 1.3.4 — Akun Pimpinan Fasyankes: Template Contoh SPK versi Word (DOCX) dengan KOP FASYANKES**
- Pada panel **Unggah Dokumen SPK**, di sebelah kiri tombol unggah kini tersedia DUA
  tombol: **Template Contoh (PDF)** (v1.3.3, siap cetak) dan **Template Contoh (Word)**
  (baru, v1.3.4) — keduanya dalam satu baris, tetap di kiri tombol unggah.
- Versi Word berformat `.docx` sehingga **dapat diedit langsung** di Microsoft Word /
  WPS / LibreOffice sebelum dicetak — cocok bila fasyankes ingin menyesuaikan teks surat.
- **Bagian atas dokumen diberi notifikasi KOP FASYANKES**: kotak putus-putus berisi teks
  "KOP FASYANKES" + instruksi mencantumkan *Ganti kotak ini dengan kop surat fasyankes
  Anda (logo, nama instansi, alamat, telepon, email) sebelum surat digunakan* — karena
  setiap fasyankes memiliki kop surat sendiri.
- Isi surat identik dengan versi PDF: judul + nomor SPK, blok Pemberi Tugas (Kepala UPTD),
  blok Penerima Tugas (tenaga kesehatan), kalimat pelayanan sesuai surat ketetapan
  kewenangan klinis, masa berlaku sampai keputusan Kepala Dinas Kesehatan Kab. Kutai
  Barat, dan blok tanda tangan + cap di kanan bawah. Data pengajuan terisi
  otomatis; bagian kosong menjadi garis titik.
- Berkas bernama `Template-Contoh-SPK-<kode>.docx`. Dependensi baru: paket `docx`
  (murni JavaScript, aman di serverless Vercel) — sudah tercantum pada package.json
  dan bun.lock dalam ZIP ini.
- Wewenang tetap ketat: hanya pimpinan fasyankes pemilik asesi (403 bila bukan
  wewenangnya). Tidak ada perubahan struktur database — cukup unggah isi ZIP seperti
  biasa; contoh hasil: `Contoh-Template-SPK-Word.docx` (terlampir bersama panduan).


**18. Pembaruan versi 1.3.5 — Logo baru KREDENS (dari desain healthcare terbaru)**
- Logo KREDENS diperbarui sesuai desain baru: huruf **K** bergradasi biru–teal dengan
  palang medis putih, siluet tenaga kesehatan berstetoskop, ikon dokumen, dan perisai
  hijau bertanda centang (simbol kredensial & keamanan).
- Logo kini tampil **jelas dan tajam** di semua titik utama aplikasi:
  - Halaman **Masuk** dan **Daftar** — kartu putih membulat besar (80 px) pada panel
    hijau, sehingga warna logo kontras dan mudah dikenali;
  - **Sidebar** aplikasi (desktop & drawer mobile) — kartu putih 44 px;
  - **Banner sambutan** dashboard — kartu putih di sisi kanan banner;
  - **Favicon** tab peramban (ikon baru menggantikan favicon lama).
- Berkas logo: `public/logo-mark.png` (ikon K persegi) dan `public/logo-full.png`
  (logo utuh dengan tulisan KREDENS) — sudah dioptimalkan dan bebas latar belakang.
- Tidak ada perubahan struktur database, tidak ada dependensi baru — cukup unggah isi
  ZIP seperti biasa (hapus file lama yang tidak ada di ZIP, termasuk `public/logo.svg`
  lama bila masih ada), lalu Redeploy.

**19. Pembaruan versi 1.3.6 — Pengamanan layar & pengembalian otomatis ke situs utama (mukminnasri.com)**
- **Pengamanan layar standar** kini aktif di seluruh halaman aplikasi:
  - **Watermark identitas**: nama, email, dan tanggal pengguna tercetak samar berulang
    secara diagonal di seluruh halaman — konten yang bocor dapat dilacak pemiliknya.
  - **Tombol PrintScreen** menampilkan peringatan dan papan klip dikosongkan;
    **Ctrl/Cmd+P** (cetak), **Ctrl/Cmd+S** (simpan), **Ctrl/Cmd+U**, **F12**, dan
    **Ctrl/Cmd+Shift+I/J/C** (alat pengembang) dinonaktifkan;
    **penyalinan konten** di luar kolom formulir diblokir; **klik kanan** dinonaktifkan;
    **pencetakan halaman** menghasilkan halaman kosong bertuliskan perintah memakai
    fitur unduh resmi (formulir PDF/Word resmi tetap dapat diunduh seperti biasa).
  - **Konten otomatis disembunyikan (kabur)** saat jendela aplikasi tidak aktif —
    termasuk saat alat tangkap layar di luar peramban dibuka — dan tampil kembali
    saat jendela diaktifkan.
  - Catat: peramban tidak dapat mencegah 100% tangkapan layar di tingkat sistem
    operasi (mis. tangkapan layar bawaan macOS/Android); lapisan di atas adalah
    praktik standar aplikasi web pemerintah + penandaan identitas sebagai pencegah.
- **Pengembalian ke situs utama mukminnasri.com** pada kondisi berikut:
  - **Logout** (menu Keluar di sidebar maupun keluar otomatis setelah ubah kata sandi);
  - **Membuka aplikasi tanpa sesi** (baru buka peramban, tab baru, sesi hangus) —
    semua halaman terlindungi dialihkan ke situs utama; halaman **/login** tetap
    dapat dibuka langsung oleh yang mengetahui tautannya;
  - **Diam tanpa aktivitas 15 menit** — muncul peringatan 1 menit sebelumnya
    (dapat menekan "Lanjutkan Sesi"), selanjutnya sesi diakhiri otomatis dan
    pengguna dikembalikan ke situs utama.
- Pengerasan tambahan: usia maksimal sesi login 8 jam (perpanjangan otomatis selama
  pengguna aktif; wajib masuk ulang setelahnya).
- Tanpa perubahan struktur database, tanpa dependensi baru — cukup unggah isi ZIP
  seperti biasa, lalu Redeploy.

**20. Pembaruan versi 1.3.7 — Koreksi akses masuk (bug v1.3.6): membuka platform tanpa sesi kini ke halaman login**
- **Masalah**: pada v1.3.6, semua pengunjung tanpa sesi (termasuk pemilik akun yang
  hendak masuk) langsung dialihkan ke mukminnasri.com — halaman login tidak pernah
  terlihat sehingga platform mustahil dimasuki ("selalu ke web utama").
- **Koreksi**: membuka halaman terlindungi tanpa sesi (peramban baru, tab baru, sesi
  hangus) kini diarahkan ke **halaman login /login** platform. Pengguna dapat masuk
  seperti biasa; sesi tetap tidak dibawa antar-peramban/tab (wajib masuk ulang).
- **Perilaku yang TIDAK berubah** (tetap kembali ke mukminnasri.com):
  - Tombol **Keluar** (logout) di sidebar / dialog keluar / pasca-ubah kata sandi;
  - **Diam 15 menit** (idle) — peringatan 1 menit sebelumnya, lalu sesi berakhir
    dan pengguna dikembalikan ke situs utama;
  - Batas usia sesi maksimal 8 jam.
- Semua lapisan pengamanan layar v1.3.6 (watermark identitas, blok tangkap layar,
  tirai kabur, blok cetak/salin) tetap aktif tanpa perubahan.
- Tanpa perubahan struktur database, tanpa dependensi baru — cukup unggah isi ZIP
  seperti biasa, lalu Redeploy.
