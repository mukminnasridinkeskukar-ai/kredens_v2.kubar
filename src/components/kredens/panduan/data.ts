// ============================================================
// KREDENS v2.kubar — Data konten Panduan Penggunaan (v2.3)
// Semua nama menu/langkah mengikuti UI asli aplikasi.
// ============================================================

export type Langkah = { judul: string; isi: string; menu?: string }
export type PanduanPeran = {
  id: string
  label: string
  peranTeks: string
  ringkasan: string
  langkah: Langkah[]
  menus: { menu: string; fungsi: string }[]
  tips: string[]
}

// ---------- Alur 8 tahap ----------
export const ALUR_TAHAP: { label: string; pelaku: string }[] = [
  { label: 'Draf', pelaku: 'Asesi menyusun berkas' },
  { label: 'Diajukan', pelaku: 'Asesi mengirim pengajuan' },
  { label: 'Verifikasi Operator', pelaku: 'Operator Kredensial memeriksa kelengkapan' },
  { label: 'Penilaian Tim', pelaku: 'Asesor/Mitra Bestari menilai kewenangan' },
  { label: 'Rekomendasi Tim', pelaku: 'Ketua Tim menyimpulkan & meneruskan' },
  { label: 'Ketetapan Kadis', pelaku: 'Kepala Dinas menerbitkan rekomendasi' },
  { label: 'Surat Penugasan', pelaku: 'Pimpinan Fasyankes menerbitkan SPK' },
  { label: 'Selesai', pelaku: 'Proses kredensial tuntas' },
]

// ---------- Panduan per peran ----------
export const PERAN_PANDUAN: PanduanPeran[] = [
  {
    id: 'asesi',
    label: 'Asesi',
    peranTeks: 'Tenaga Medis & Tenaga Kesehatan Pengusul',
    ringkasan:
      'Asesi adalah pemohon kredensial. Tugas utama Anda: melengkapi biodata, membuat pengajuan kredensial/rekredensial, memantau alurnya, mengisi logbook, lalu mengunduh dokumen hasil (Rekomendasi, SPK, RKK).',
    langkah: [
      {
        judul: 'Masuk dan periksa Dashboard',
        isi: 'Buka halaman masuk, tulis email dan kata sandi Anda, lalu tekan Masuk. Dashboard menampilkan ringkasan status pengajuan, kelengkapan biodata, dan jadwal terdekat. Percobaan masuk pertama bisa agak lambat (±10–30 detik) karena sistem menyiapkan database — itu normal.',
        menu: 'Dashboard',
      },
      {
        judul: 'Lengkapi Biodata (wajib sebelum mengajukan)',
        isi: 'Isi tiga bagian biodata secara lengkap dan benar. Riwayat Hidup: data pribadi, riwayat pendidikan, pengalaman kerja, dan pengembangan kompetensi 5 tahun terakhir. Formulir: pernyataan kompetensi, sertifikasi (Perguruan Tinggi, Kolegium, Uji Kompetensi), STR, SIP, dan surat permohonan. Rincian Kewenangan Klinis: usulkan diagnosa/keterampilan yang diminta.',
        menu: 'Biodata → Riwayat Hidup / Formulir / Rincian Kewenangan Klinis',
      },
      {
        judul: 'Tentukan Kode Diminta tiap kewenangan',
        isi: 'Pada Rincian Kewenangan Klinis, pilih kode permintaan 1–4 untuk tiap usulan sesuai legenda resmi. Daftar kewenangan mengikuti template standar Dinkes dan otomatis menyesuaikan jenis profesi pada Riwayat Hidup Anda.',
        menu: 'Biodata → Rincian Kewenangan Klinis',
      },
      {
        judul: 'Buat dan ajukan pengajuan',
        isi: 'Tekan Buat Pengajuan, pilih jenis (Kredensial untuk pertama kali, Rekredensial untuk perpanjangan), periksa kelengkapan, lalu tekan Ajukan. Status berubah dari Draf menjadi Diajukan dan berpindah ke antrean Operator. Pengajuan yang masih Draf dapat disunting; setelah diajukan menunggu verifikasi.',
        menu: 'Pengajuan',
      },
      {
        judul: 'Pantau alur dan jadwal',
        isi: 'Ikuti perjalanan pengajuan pada 8 tahap dari Draf hingga Selesai (lihat bagian Alur Umum di tab pertama). Cek menu Jadwal Kredensial untuk agenda telaah berkas, asesmen, dan penilaian lapangan yang ditetapkan Operator.',
        menu: 'Pengajuan · Jadwal Kredensial',
      },
      {
        judul: 'Isi Logbook (setelah Rekomendasi Tim terbit)',
        isi: 'Setelah Ketua Tim menetapkan rekomendasi kewenangan, menu Logbook aktif. Catat pelaksanaan kewenangan klinis bulanan, lalu ajukan. Logbook diverifikasi Pimpinan Fasyankes; bila berstatus Perlu Perbaikan, sunting lalu ajukan ulang.',
        menu: 'Logbook',
      },
      {
        judul: 'Unduh dan cetak dokumen hasil',
        isi: 'Dokumen resmi tampil hanya-baca: Rekomendasi Tim, Rekomendasi Kadis, Lampiran Rekomendasi Kadis (menu Kredensialing), serta Surat Penugasan Klinis (SPK) dan Rincian Kewenangan Klinis final/RKK (menu SPK dan RKK). Gunakan tombol cetak pada tiap dokumen, lalu pilih Simpan sebagai PDF.',
        menu: 'Kredensialing · SPK dan RKK',
      },
    ],
    menus: [
      { menu: 'Dashboard', fungsi: 'Ringkasan status, kelengkapan biodata, jadwal terdekat' },
      { menu: 'Pengajuan', fungsi: 'Buat, ajukan, dan pantau pengajuan Kredensial/Rekredensial' },
      { menu: 'Biodata', fungsi: 'Riwayat Hidup, Formulir, Rincian Kewenangan Klinis' },
      { menu: 'Kredensialing', fungsi: 'Rekomendasi Tim, Rekomendasi Kadis, Lampiran (baca-saja)' },
      { menu: 'SPK dan RKK', fungsi: 'Surat Penugasan Klinis dan RKK final (baca-saja)' },
      { menu: 'Jadwal Kredensial', fungsi: 'Agenda telaah berkas, asesmen, penilaian lapangan' },
      { menu: 'Logbook', fungsi: 'Catatan kewenangan klinis bulanan pasca-rekomendasi' },
    ],
    tips: [
      'Berkas dikembalikan Operator ke status Draf berarti ada kekurangan — perbaiki pada bagian yang dicatat, lalu ajukan ulang.',
      'Seluruh dokumen resmi diunduh lewat fitur aplikasi; konten layar sengaja tidak dapat dicetak langsung agar dokumen tetap tertata.',
      'Sesi berhenti otomatis setelah 15 menit diam. Gunakan Akun Saya → Profil dan Keamanan untuk mengganti kata sandi.',
      'Jika Anda ditugaskan fungsi tambahan (Asesor/Pimpinan Fasyankes/Ketua Tim), menu tambahan muncul di bagian Fungsi Tambahan pada bilah samping tanpa perlu keluar-masuk ulang.',
    ],
  },
  {
    id: 'operator',
    label: 'Operator Kredensial',
    peranTeks: 'Verifikator Berkas & Pengelola Jadwal',
    ringkasan:
      'Operator adalah gerbang awal proses. Tugas Anda: memverifikasi kelengkapan berkas asesi, menetapkan asesor penilai, mengaktifkan pendaftaran akun mandiri, dan mengelola jadwal kredensialing.',
    langkah: [
      {
        judul: 'Periksa antrean pada Dashboard',
        isi: 'Dashboard menampilkan antrean Perlu Tindakan Anda: pengajuan berstatus Diajukan yang menunggu verifikasi, pendaftaran akun baru, dan jadwal yang perlu disiapkan. Buka rincian pengajuan untuk memeriksa seluruh biodata dan formulir asesi.',
        menu: 'Dashboard',
      },
      {
        judul: 'Verifikasi Berkas: loloskan atau kembalikan',
        isi: 'Periksa kelengkapan Riwayat Hidup, Formulir (STR, SIP, sertifikasi), dan Rincian Kewenangan Klinis. Bila lengkap, tekan Lolos & Teruskan — status naik ke Penilaian Tim. Bila kurang, tekan Kembalikan ke Asesi (Draf) dan tulis catatan perbaikan yang jelas.',
        menu: 'Verifikasi Berkas',
      },
      {
        judul: 'Tetapkan tiga asesor penilai',
        isi: 'Saat meneruskan berkas, tetapkan nama 3 asesor penilai untuk pengajuan tersebut. Nama-nama ini menjadi saran sekali-klik pada kolom Anggota Tim (Perwakilan Penilai) 1–3 ketika Ketua Tim mengisi rekomendasi — pastikan penugasan tepat bidang.',
        menu: 'Verifikasi Berkas → penetapan asesor',
      },
      {
        judul: 'Verifikasi pendaftaran akun mandiri',
        isi: 'Calon Asesi/Asesor/Pimpinan Fasyankes yang mendaftar sendiri berstatus Menunggu Verifikasi dan belum bisa masuk. Buka menu Verifikasi Akun, lalu Aktifkan akun yang sah atau Hapus pendaftaran yang tidak sesuai. Kartu pengingat muncul di Dashboard saat ada pendaftar baru.',
        menu: 'Verifikasi Akun',
      },
      {
        judul: 'Kelola jadwal kredensialing',
        isi: 'Buat, ubah, atau hapus agenda pada lima tahap: Telaah Berkas, Asesmen, Penilaian Lapangan, Rekomendasi Tim, dan Ketetapan Kewenangan. Isi tanggal dan keterangan dengan lengkap; jadwal otomatis tampil pada semua pihak terkait, termasuk asesi.',
        menu: 'Kelola Jadwal',
      },
    ],
    menus: [
      { menu: 'Dashboard', fungsi: 'Antrean Perlu Tindakan Anda (verifikasi, akun, jadwal)' },
      { menu: 'Verifikasi Berkas', fungsi: 'Periksa berkas, loloskan/kembalikan, tetapkan 3 asesor' },
      { menu: 'Verifikasi Akun', fungsi: 'Aktifkan atau tolak pendaftaran akun mandiri' },
      { menu: 'Kelola Jadwal', fungsi: 'Buat/ubah/hapus agenda lima tahap kredensialing' },
    ],
    tips: [
      'Catatan saat mengembalikan berkas terbaca oleh asesi — tulis instruksi yang spesifik, mis. "STR kedaluwarsa, unggah STR terbaru".',
      'Penetapan asesor penilai menentukan saran Perwakilan Penilai pada rekomendasi tim — sesuaikan dengan kebutuhan profesi asesi.',
    ],
  },
  {
    id: 'asesor',
    label: 'Asesor',
    peranTeks: 'Penilai Kewenangan Klinis (termasuk Mitra Bestari)',
    ringkasan:
      'Asesor menilai kewenangan klinis yang diusulkan asesi. Anda hanya melihat pengajuan yang ditugaskan Operator kepada Anda (Mitra Bestari memakai alur yang sama). Hasil penilaian menjadi bahan simpulan Ketua Tim.',
    langkah: [
      {
        judul: 'Buka daftar penugasan',
        isi: 'Dashboard dan menu Penilaian Kewenangan hanya menampilkan pengajuan yang ditugaskan kepada Anda. Bila daftar kosong, berarti belum ada penugasan baru — hubungi Operator Kredensial.',
        menu: 'Dashboard · Penilaian Kewenangan',
      },
      {
        judul: 'Nilai tiap kewenangan klinis dengan Kode Rekomendasi',
        isi: 'Buka rincian pengajuan, lalu beri kode 1–4 pada setiap kewenangan yang diusulkan sesuai legenda kode rekomendasi (lihat tabel di bawah). Nilai mencerminkan kompetensi dan dukungan fasilitas fasyankes.',
        menu: 'Penilaian Kewenangan → pilih pengajuan',
      },
      {
        judul: 'Simpan penilaian',
        isi: 'Setelah semua kewenangan bernilai, simpan. Penilaian Anda terekam pada rincian pengajuan dan otomatis terbaca oleh Ketua Tim sebagai dasar simpulan. Penilaian hanya dapat dilakukan pada tahap Penilaian Tim.',
        menu: 'Penilaian Kewenangan → Simpan',
      },
    ],
    menus: [
      { menu: 'Dashboard', fungsi: 'Antrean pengajuan yang ditugaskan kepada Anda' },
      { menu: 'Penilaian Kewenangan', fungsi: 'Beri Kode Rekomendasi 1–4 per kewenangan klinis' },
    ],
    tips: [
      'Gunakan kode supervisi bila kompetensi asesi baik tetapi masih perlu pendampingan — jangan langsung menolak.',
      'Akun multi-fungsi (mis. Asesi yang juga Asesor) menemukan menu penilaian di bagian Fungsi Tambahan pada bilah samping.',
    ],
  },
  {
    id: 'tim',
    label: 'Tim Kredensial',
    peranTeks: 'Ketua Tim Kredensial — terbagi per profesi (v2.1)',
    ringkasan:
      'Ketua Tim menyimpulkan hasil penilaian anggota menjadi Rekomendasi Tim. Sejak v2.1, akun ketua tim dipilah per profesi: ketua dengan profesi tertentu hanya menangani pengajuan asesi berprofesi sama; ketua tanpa profesi melihat semuanya.',
    langkah: [
      {
        judul: 'Periksa antrean sesuai profesi Anda',
        isi: 'Daftar pada menu Rekomendasi Tim otomatis tersaring: pengajuan asesi dengan profesi yang sama dengan profesi tim Anda (Dokter, Dokter Gigi, Perawat, Bidan, dst.). Profesi akun ditetapkan Superadmin pada Kelola Akun → Data → Profesi Tim Kredensial.',
        menu: 'Rekomendasi Tim',
      },
      {
        judul: 'Telaah hasil penilaian anggota tim',
        isi: 'Buka rincian pengajuan untuk melihat kode penilaian dari setiap asesor/anggota tim pada tiap kewenangan klinis. Pastikan seluruh kewenangan sudah dinilai — formulir rekomendasi baru dapat disimpan bila lengkap.',
        menu: 'Rekomendasi Tim → rincian pengajuan',
      },
      {
        judul: 'Isi simpulan rekomendasi tim',
        isi: 'Lengkapi Tanggal Penilaian, pilih Simpulan Penilaian (Direkomendasikan, Direkomendasikan dengan catatan, atau Tidak direkomendasikan), dan tulis Catatan Tim bila perlu. Simpan untuk menetapkan rekomendasi kewenangan klinis.',
        menu: 'Rekomendasi Tim → formulir rekomendasi',
      },
      {
        judul: 'Isi Anggota Tim (Perwakilan Penilai) 1–3',
        isi: 'Tulis nama asesor penilai pada kolom Perwakilan Penilai 1, 2, dan 3 — ketua adalah penilai pertama, dua nama lainnya diambil dari penugasan Operator (tersedia saran sekali-klik). Ketiganya tampil pada dokumen dan halaman baca-saja asesi.',
        menu: 'Rekomendasi Tim → Anggota Tim — Perwakilan Penilai 1–3',
      },
      {
        judul: 'Teruskan ke Kepala Dinas Kesehatan',
        isi: 'Setelah rekomendasi tersimpan, teruskan pengajuan — status naik ke Ketetapan Kadis dan berpindah ke meja Kepala Dinas untuk penerbitan surat rekomendasi penetapan kewenangan.',
        menu: 'Rekomendasi Tim → Teruskan',
      },
    ],
    menus: [
      { menu: 'Dashboard', fungsi: 'Antrean pengajuan sesuai profesi tim Anda' },
      { menu: 'Rekomendasi Tim', fungsi: 'Simpulan penilaian, Perwakilan Penilai 1–3, teruskan ke Kadis' },
    ],
    tips: [
      'Validasi server mewajibkan seluruh kewenangan telah dinilai sebelum rekomendasi disimpan — koordinasikan dengan asesor penilai bila ada yang belum mengisi.',
      'Bila profesi akun Anda belum terisi, Anda melihat semua pengajuan (kompatibel data lama) — minta Superadmin mengisi Profesi Tim Kredensial agar tersaring otomatis.',
    ],
  },
  {
    id: 'pimpinan',
    label: 'Pimpinan Faskes',
    peranTeks: 'Penerbit SPK & Verifikator Logbook Fasyankes',
    ringkasan:
      'Pimpinan Fasyankes menutup proses kredensial: menerbitkan Surat Penugasan Klinis (SPK) bagi tenaga yang lolos, menandai proses selesai, serta memverifikasi logbook bulanan asesi di fasyankes Anda.',
    langkah: [
      {
        judul: 'Periksa antrean pengajuan fasyankes',
        isi: 'Dashboard menampilkan pengajuan yang telah memperoleh Ketetapan Kepala Dinas dan menunggu penerbitan SPK. Buka rincian untuk menelaah ketetapan kewenangan klinis sebelum menugaskan.',
        menu: 'Dashboard',
      },
      {
        judul: 'Terbitkan Surat Penugasan Klinis (SPK)',
        isi: 'Isi Nomor SPK (contoh format: 800/0122/PKM-TGR/2025), tanggal penugasan, dan data penugasan lainnya, lalu terbitkan. SPK tampil pada halaman baca-saja asesi dan dapat dicetak/unduh PDF.',
        menu: 'Surat Penugasan Klinis → Terbitkan SPK',
      },
      {
        judul: 'Tandai proses selesai',
        isi: 'Setelah SPK terbit dan penugasan berjalan, tekan Tandai Proses Selesai. Status pengajuan menjadi Selesai — seluruh alur kredensial tuntas dan arsip dokumen lengkap.',
        menu: 'Surat Penugasan Klinis → Tandai Proses Selesai',
      },
      {
        judul: 'Verifikasi logbook bulanan asesi',
        isi: 'Buka menu Verifikasi Logbook untuk memeriksa catatan kewenangan klinis bulanan asesi fasyankes Anda. Setujui bila sesuai (status Terverifikasi) atau kembalikan dengan status Perlu Perbaikan bila ada kekeliruan.',
        menu: 'Verifikasi Logbook',
      },
    ],
    menus: [
      { menu: 'Dashboard', fungsi: 'Antrean SPK menunggu terbit dan logbook menunggu verifikasi' },
      { menu: 'Surat Penugasan Klinis', fungsi: 'Terbitkan SPK, tandai proses selesai' },
      { menu: 'Verifikasi Logbook', fungsi: 'Setujui/kembalikan logbook bulanan asesi' },
    ],
    tips: [
      'Nomor SPK mengikuti tata naskah dinas fasyankes Anda — tulis lengkap dengan kode unit dan tahun.',
      'Pendaftaran akun mandiri tersedia untuk peran ini: daftar lewat halaman Daftar, lalu aktifasi oleh Operator Kredensial.',
    ],
  },
]

// ---------- FAQ ----------
export const FAQ_PANDUAN: { q: string; a: string }[] = [
  {
    q: 'Bagaimana cara memasang atau mengganti foto profil? (v2.3)',
    a: 'Buka menu Akun Saya → Profil dan Keamanan, lalu ketuk ikon kamera pada kartu identitas di bagian atas. Pilih foto JPG/PNG/WebP — sistem otomatis mengecilkan foto ke 512px sebelum menyimpan, sehingga hemat kuota dan cepat. Foto langsung tampil pada bilah samping, pojok kanan atas, dan halaman Akun Saya. Untuk menghapus, tekan tombol Hapus Foto di bawah nama Anda.',
  },
  {
    q: 'Saya lupa kata sandi. Bagaimana cara mengatasinya?',
    a: 'Hubungi Superadmin/Kelola Akun di Dinas Kesehatan untuk penataan ulang kata sandi akun Anda. Setelah kata sandi baru diberikan, masuk ulang lalu segera ganti sendiri melalui menu Akun Saya → Profil dan Keamanan demi keamanan.',
  },
  {
    q: 'Akun baru saya tidak bisa dipakai masuk. Kenapa?',
    a: 'Pendaftaran mandiri berstatus Menunggu Verifikasi. Operator Kredensial perlu mengaktifkannya lewat menu Verifikasi Akun. Bila diteruskan masuk sebelum aktif, sistem menampilkan pesan yang jelas — bukan sekadar email/sandi salah.',
  },
  {
    q: 'Percobaan masuk pertama terasa lambat. Apakah normal?',
    a: 'Ya. Pada pembukaan pertama, sistem menyiapkan tabel dan data awal database (±10–30 detik). Percobaan berikutnya berjalan cepat seperti biasa.',
  },
  {
    q: 'Mengapa saya tiba-tiba keluar dari aplikasi?',
    a: 'Sesi diakhiri otomatis setelah 15 menit diam demi keamanan data pegawai, dan sesi tidak dibawa antar-peramban/tab. Masuk ulang untuk melanjutkan; pekerjaan formulir yang sudah disimpan tetap aman.',
  },
  {
    q: 'Kenapa Ketua Tim saya hanya melihat sebagian pengajuan?',
    a: 'Sejak v2.1 ketua tim dipilah per profesi: akun ketua dengan profesi tertentu hanya menangani pengajuan asesi berprofesi sama. Ketua tanpa profesi melihat seluruh pengajuan (perilaku lama). Pemilahan diatur Superadmin pada Kelola Akun.',
  },
  {
    q: 'Bagaimana cara mencetak atau menyimpan dokumen?',
    a: 'Gunakan tombol cetak pada dokumen baca-saja (Rekomendasi, SPK, RKK). Dialog cetak peramban terbuka — pilih Simpan sebagai PDF. Konten layar lain sengaja dilindungi agar tidak tercetak sembarangan.',
  },
  {
    q: 'Pengajuan saya kembali berstatus Draf. Apa yang terjadi?',
    a: 'Operator mengembalikan berkas karena ada kekurangan, disertai catatan perbaikan. Buka rincian pengajuan, baca catatannya, perbaiki bagian yang ditandai, lalu ajukan ulang.',
  },
  {
    q: 'Satu akun bisa memegang lebih dari satu peran?',
    a: 'Bisa. Superadmin dapat menambahkan hingga tiga fungsi tambahan pada satu akun: Asesor, Pimpinan Fasyankes, dan/atau Ketua Tim Kredensial. Menu fungsi tambahan muncul di bagian Fungsi Tambahan bilah samping tanpa perlu keluar-masuk ulang.',
  },
]
