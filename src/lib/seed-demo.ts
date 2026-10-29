/**
 * Data demo KREDENS — dipakai oleh:
 * - scripts/seed.ts (seed manual lokal)
 * - src/lib/bootstrap.ts (auto-setup pertama di produksi/Neon)
 * Semua operasi idempoten: aman dijalankan berulang.
 */
import { db } from '@/lib/db'
import {
  hashPassword,
  enkripsiSandi,
  dekripsiSandi,
  verifyPassword,
  adalahSandiPolos,
} from '@/lib/password'
import { TEMPLATE_KEWENANGAN } from '@/lib/kewenangan-template-data'

const PASS = 'kredens123'

// v2.1 — akun demo mencakup fitur baru:
// - asesi dengan fungsi tambahan (ASESOR + PIMPINAN_FASYANKES) di satu akun
// - ketua tim kredensial per profesi (Dokter & Perawat)
const USERS = [
  { email: 'asesi@kredens.go.id', nama: 'Ns. Ratna Kurniawati, S.Kep', role: 'ASESI', peranEkstra: 'ASESOR,PIMPINAN_FASYANKES', nip: '198705122010012004', jabatan: 'Perawat Ahli Pertama', instansi: 'Puskesmas Sendawar' },
  { email: 'asesor@kredens.go.id', nama: 'drg. Siti Aminah, M.Kes', role: 'ASESOR', nip: '198003152005012003', jabatan: 'Asesor Kredensial', instansi: 'Dinas Kesehatan Kubar' },
  { email: 'operator@kredens.go.id', nama: 'Yudho Prasetyo, S.Kom', role: 'OPERATOR_KREDENSIAL', nip: '199102232015031001', jabatan: 'Operator Kredensial', instansi: 'Dinas Kesehatan Kubar' },
  { email: 'ketuatim@kredens.go.id', nama: 'dr. H. Muhajir, Sp.PD', role: 'KETUA_TIM_KREDENSIAL', profesi: 'Dokter', nip: '197504102003121002', jabatan: 'Ketua Tim Kredensial', instansi: 'Dinas Kesehatan Kubar' },
  { email: 'ketuatim.perawat@kredens.go.id', nama: 'Ns. Dewi Sartika, M.Kep', role: 'KETUA_TIM_KREDENSIAL', profesi: 'Perawat', nip: '198203072008012005', jabatan: 'Ketua Tim Kredensial Perawat', instansi: 'Dinas Kesehatan Kubar' },
  { email: 'mitra@kredens.go.id', nama: 'dr. Amelia Putri', role: 'MITRA_BESTARI', nip: '199204182018012005', jabatan: 'Mitra Bestari', instansi: 'RSUD Kutai Barat' },
  { email: 'pimpinan@kredens.go.id', nama: 'dr. Hasan Basri', role: 'PIMPINAN_FASYANKES', nip: '197809202006041003', jabatan: 'Kepala Puskesmas', instansi: 'Puskesmas Sendawar' },
  { email: 'kadis@kredens.go.id', nama: 'H. Dr. Hamdani, M.Kes', role: 'KEPALA_DINAS_KESEHATAN', nip: '197002051995121001', jabatan: 'Kepala Dinas Kesehatan', instansi: 'Dinas Kesehatan Kubar' },
  { email: 'superadmin@kredens.go.id', nama: 'Super Administrator', role: 'SUPERADMIN', nip: null, jabatan: 'Administrator Sistem', instansi: 'Dinas Kesehatan Kubar' },
]

export async function seedDemo(): Promise<{ akun: number; pengajuanBaru: string[] }> {
  const pengajuanBaru: string[] = []

  for (const u of USERS) {
    await db.user.upsert({
      where: { email: u.email },
      update: {
        passwordHash: hashPassword(PASS),
        sandiTersimpan: enkripsiSandi(PASS),
        nama: u.nama,
        role: u.role,
        peranEkstra: u.peranEkstra ?? null,
        profesi: u.profesi ?? null,
        nip: u.nip,
        jabatan: u.jabatan,
        instansi: u.instansi,
      },
      create: { ...u, passwordHash: hashPassword(PASS), sandiTersimpan: enkripsiSandi(PASS) },
    })
  }

  // Contoh pendaftaran mandiri yang menunggu verifikasi operator
  // (menampilkan antrean "Verifikasi Akun" pada modul operator)
  await db.user.upsert({
    where: { email: 'calon.asesor@kredens.go.id' },
    update: {},
    create: {
      email: 'calon.asesor@kredens.go.id',
      passwordHash: hashPassword(PASS),
      sandiTersimpan: enkripsiSandi(PASS),
      nama: 'drg. Rina Melati',
      role: 'ASESOR',
      nip: '199306122019022003',
      jabatan: 'Calon Asesor Kredensial',
      instansi: 'RSUD Kutai Barat',
      telepon: '0813-4567-8901',
      isActive: false, // menunggu verifikasi Operator Kredensial
    },
  })

  // ---- Biodata asesi ----
  const asesi = await db.user.findUnique({ where: { email: 'asesi@kredens.go.id' } })
  if (!asesi) throw new Error('asesi tidak ada')
  const asesorDemo = await db.user.findUnique({ where: { email: 'asesor@kredens.go.id' } })

  const profile = await db.asesiProfile.upsert({
    where: { userId: asesi.id },
    update: {},
    create: {
      userId: asesi.id,
      namaLengkapGelar: 'Ns. Ratna Kurniawati, S.Kep',
      tempatLahir: 'Sendawar',
      tanggalLahir: '1987-05-12',
      nip: '198705122010012004',
      nik: '6402054105870003',
      jenisProfesi: 'Perawat',
      levelKompetensi: 'Ahli Pertama',
      jenisKelamin: 'Perempuan',
      alamat: 'Jl. Merdeka No. 45, Sendawar, Kutai Barat',
      telepon: '0812-5456-7890',
      email: 'ratna.k@kutaibarat.go.id',
      statusKepegawaian: 'PNS',
      jenjangJabatan: 'Ahli Pertama',
      tempatBekerja: 'Puskesmas Sendawar',
    },
  })

  const nPend = await db.riwayatPendidikan.count({ where: { asesiId: profile.id } })
  if (nPend === 0) {
    await db.riwayatPendidikan.createMany({
      data: [
        { asesiId: profile.id, jenjang: 'D3 Keperawatan', namaInstitusi: 'Poltekkes Kemenkes Samarinda', tahun: '2009', nomorIjazah: '09.9061/0241', urutan: 0 },
        { asesiId: profile.id, jenjang: 'Profesi Ners', namaInstitusi: 'Universitas Mulawarman', tahun: '2015', nomorIjazah: 'UNMUL/NERS/2015/118', urutan: 1 },
        { asesiId: profile.id, jenjang: 'S2 Kesehatan Masyarakat', namaInstitusi: 'Universitas Mulawarman', tahun: '2023', nomorIjazah: 'UNMUL/FKM/S2/2023/076', urutan: 2 },
      ],
    })
  }

  const nKerja = await db.pengalamanKerja.count({ where: { asesiId: profile.id } })
  if (nKerja === 0) {
    await db.pengalamanKerja.createMany({
      data: [
        { asesiId: profile.id, tempatKerja: 'Puskesmas Muara Jawa', jabatan: 'Perawat Pelaksana', periodeMulai: '2010-03-01', periodeSelesai: '2016-11-30', masihBekerja: false, urutan: 0 },
        { asesiId: profile.id, tempatKerja: 'Puskesmas Sendawar', jabatan: 'Perawat Ahli Pertama', periodeMulai: '2016-12-01', masihBekerja: true, urutan: 1 },
      ],
    })
  }

  const nPlat = await db.pelatihanKompetensi.count({ where: { asesiId: profile.id } })
  if (nPlat === 0) {
    await db.pelatihanKompetensi.createMany({
      data: [
        { asesiId: profile.id, namaKegiatan: 'Pelatihan Asuhan Persalinan Normal (APN)', penyelenggara: 'Dinas Kesehatan Prov. Kaltim', tahun: '2021', jumlahJp: '40', nomorSertifikat: 'APN/2021/0345', urutan: 0 },
        { asesiId: profile.id, namaKegiatan: 'Workshop Basic Life Support (BHD)', penyelenggara: 'PPNI Kaltim', tahun: '2023', jumlahJp: '16', nomorSertifikat: 'BLS/2023/0876', urutan: 1 },
        { asesiId: profile.id, namaKegiatan: 'Pelatihan Manajemen Penyakit Kronis (Prolanis)', penyelenggara: 'BPJS Kesehatan', tahun: '2024', jumlahJp: '24', nomorSertifikat: 'PROLANIS/2024/0212', urutan: 2 },
      ],
    })
  }

  // ---- Pengajuan 1: selesai penuh (untuk tampilan read-only) ----
  const ada1 = await db.pengajuan.findUnique({ where: { kode: 'KR-2025-1001' } })
  if (!ada1) {
    const p1 = await db.pengajuan.create({
      data: {
        kode: 'KR-2025-1001',
        userId: asesi.id,
        jenis: 'KREDENSIAL',
        status: 'SELESAI',
        fasyankes: 'Puskesmas Sendawar',
        submittedAt: new Date('2025-06-02'),
        createdAt: new Date('2025-05-28'),
        formulir: {
          create: {
            pernyataan: true,
            strNomor: 'STR/PER/0967345/2015',
            strBerlaku: '2027-09-14',
            sipNomor: '445/0193/DK/2020',
            sipBerlaku: '2026-06-30',
            suratPermohonanNomor: '072/045/PMK/2025',
            suratPermohonanTanggal: '2025-05-26',
            ptNomor: 'UNMUL/NERS/2015/118',
            ptTanggal: '2015-11-12',
            kolegiumNomor: 'SK-0199/PPNI/2016',
            kolegiumTanggal: '2016-03-02',
            ujiKompetensiNomor: 'UK/PER/2020/0231',
            ujiKompetensiTanggal: '2020-02-18',
          },
        },
        kewenangan: {
          create: [
            { urutan: 1, kodeRef: 'MED-001', namaKewenangan: 'Penanganan kasus emergensi dasar (BHD)', kodeDiminta: '1', kodeRekomendasi: '1' },
            { urutan: 2, kodeRef: 'MED-002', namaKewenangan: 'Diagnosis dan tata laksana hipertensi', kodeDiminta: '1', kodeRekomendasi: '1' },
            { urutan: 3, kodeRef: 'MED-003', namaKewenangan: 'Diagnosis dan tata laksana diabetes melitus tipe 2', kodeDiminta: '2', kodeRekomendasi: '2' },
            { urutan: 4, kodeRef: 'MED-010', namaKewenangan: 'Perawatan luka dan perawatan luka kronis', kodeDiminta: '1', kodeRekomendasi: '1' },
            { urutan: 5, kodeRef: 'MED-007', namaKewenangan: 'Pelayanan persalinan normal (APN)', kodeDiminta: '2', kodeRekomendasi: '3' },
          ],
        },
        rekomendasiTim: {
          create: {
            kesimpulan: 'DIREKOMENDASIKAN_DENGAN_CATATAN',
            tanggal: '2025-06-20',
            catatan:
              'Perlu supervisi pada tata laksana DM tipe 2 selama 3 bulan. Kewenangan APN tidak disetujui karena belum melampirkan bukti pembaruan kompetensi terkini.',
            simpulan:
              'Ns. Ratna Kurniawati, S.Kep telah menjalani kredensial sebagai perawat Ahli Pertama dengan hasil direkomendasikan dengan catatan terhadap kewenangan klinis yang diusulkan.',
            ketuaNama: 'dr. H. Muhajir, Sp.PD',
            anggotaNama: 'drg. Siti Aminah, M.Kes',
            // v2.1 — anggota tim (perwakilan penilai): dua asesor lain
            anggotaNama2: 'Ns. Budi Santoso, S.Kep',
            anggotaNama3: 'dr. Amelia Putri',
            penetapanNomor: '800/233/DKK/2025',
            penetapanTanggal: '2025-07-01',
            penetapanBerlakuSampai: '2028-07-01',
          },
        },
        rekomendasiKadis: {
          create: {
            nomorSurat: '900/451/DKK/2025',
            tanggalSurat: '2025-07-08',
            sifat: 'Biasa',
            lampiran: '1 (satu) Berkas',
            hal: 'Rekomendasi Penetapan Kewenangan Klinis',
            refSuratNomor: '072/045/PMK/2025',
            refSuratTanggal: '2025-05-26',
            tujuanUptd: 'Puskesmas Sendawar',
            tempat: 'Sendawar',
            ketetapanNomor: '800/233/DKK/2025',
            ketetapanTanggal: '2025-07-01',
            ketetapanBerlakuSampai: '2028-07-01',
          },
        },
        spk: {
          create: {
            nomorSpk: '800/0122/PKM-TGR/2025',
            tanggalSpk: '2025-07-15',
            uptd: 'Puskesmas Sendawar',
            nomorSkKewenangan: '800/233/DKK/2025',
            berlakuSampai: '2028-07-01',
            kepalaUptd: 'dr. Hasan Basri',
          },
        },
        riwayat: {
          create: [
            { status: 'DRAFT', keterangan: 'Pengajuan dibuat', oleh: 'Ns. Ratna Kurniawati, S.Kep', createdAt: new Date('2025-05-28') },
            { status: 'DIAJUKAN', keterangan: 'Pengajuan dikirim oleh asesi', oleh: 'Ns. Ratna Kurniawati, S.Kep', createdAt: new Date('2025-06-02') },
            { status: 'VERIFIKASI', keterangan: 'Berkas diverifikasi operator, dinyatakan lengkap', oleh: 'Yudho Prasetyo, S.Kom', createdAt: new Date('2025-06-05') },
            { status: 'PENILAIAN_TIM', keterangan: 'Penilaian oleh tim kredensial/mitra bestari', oleh: 'drg. Siti Aminah, M.Kes', createdAt: new Date('2025-06-12') },
            { status: 'REKOMENDASI_TIM', keterangan: 'Direkomendasikan dengan catatan', oleh: 'dr. H. Muhajir, Sp.PD', createdAt: new Date('2025-06-20') },
            { status: 'KETETAPAN_KADIS', keterangan: 'Rekomendasi kadis terbit: 900/451/DKK/2025', oleh: 'H. Dr. Hamdani, M.Kes', createdAt: new Date('2025-07-08') },
            { status: 'SURAT_PENUGASAN', keterangan: 'SPK terbit: 800/0122/PKM-TGR/2025', oleh: 'dr. Hasan Basri', createdAt: new Date('2025-07-15') },
            { status: 'SELESAI', keterangan: 'Proses kredensial selesai', oleh: 'Operator Kredensial', createdAt: new Date('2025-07-16') },
          ],
        },
      },
    })

    await db.jadwalKredensial.createMany({
      data: [
        { pengajuanId: p1.id, tanggal: '2025-06-12', waktu: '08.00 - 12.00 WITA', tempat: 'Ruang Rapat Dinkes Kubar', tahap: 'ASESMEN', keterangan: 'Asesmen kompetensi oleh tim kredensial', status: 'SELESAI' },
        { pengajuanId: p1.id, tanggal: '2025-06-18', waktu: '09.00 - 11.00 WITA', tempat: 'Puskesmas Sendawar', tahap: 'PENILAIAN_LAPANGAN', keterangan: 'Penilaian lapangan praktik', status: 'SELESAI' },
      ],
    })
    pengajuanBaru.push('KR-2025-1001')
  }

  // ---- Pengajuan 2: draf ----
  const ada2 = await db.pengajuan.findUnique({ where: { kode: 'KR-2026-1002' } })
  if (!ada2) {
    const p2 = await db.pengajuan.create({
      data: {
        kode: 'KR-2026-1002',
        userId: asesi.id,
        jenis: 'REKREDENSIAL',
        status: 'DRAFT',
        fasyankes: 'Puskesmas Sendawar',
        createdAt: new Date('2026-01-10'),
        formulir: { create: { pernyataan: false } },
        kewenangan: {
          create: [
            { urutan: 1, kodeRef: 'MED-001', namaKewenangan: 'Penanganan kasus emergensi dasar (BHD)', kodeDiminta: '1' },
            { urutan: 2, kodeRef: 'MED-011', namaKewenangan: 'Pelayanan kesehatan jiwa tingkat pertama', kodeDiminta: '1' },
          ],
        },
        riwayat: { create: { status: 'DRAFT', keterangan: 'Pengajuan dibuat', oleh: 'Ns. Ratna Kurniawati, S.Kep', createdAt: new Date('2026-01-10') } },
      },
    })
    await db.jadwalKredensial.create({
      data: {
        pengajuanId: p2.id,
        tanggal: '2026-02-20',
        waktu: '08.30 WITA',
        tempat: 'Dinas Kesehatan Kab. Kutai Barat',
        tahap: 'TELAAH_BERKAS',
        keterangan: 'Telaah berkas rekredensial oleh operator',
        status: 'TERJADWAL',
      },
    })
    pengajuanBaru.push('KR-2026-1002')
  }

  // ---- Pengajuan 3: tahap penilaian tim (demo modul staf) ----
  const ada3 = await db.pengajuan.findUnique({ where: { kode: 'KR-2026-1003' } })
  if (!ada3) {
    const p3 = await db.pengajuan.create({
      data: {
        kode: 'KR-2026-1003',
        userId: asesi.id,
        jenis: 'KREDENSIAL',
        status: 'PENILAIAN_TIM',
        fasyankes: 'Puskesmas Sendawar',
        submittedAt: new Date('2026-02-02'),
        createdAt: new Date('2026-01-25'),
        formulir: {
          create: {
            pernyataan: true,
            strNomor: 'STR/PER/0967345/2015',
            strBerlaku: '2027-09-14',
            sipNomor: '445/0193/DK/2020',
            sipBerlaku: '2026-06-30',
            suratPermohonanNomor: '072/061/PMK/2026',
            suratPermohonanTanggal: '2026-01-20',
            ptNomor: 'UNMUL/NERS/2015/118',
            ptTanggal: '2015-11-12',
            kolegiumNomor: 'SK-0199/PPNI/2016',
            kolegiumTanggal: '2016-03-02',
            ujiKompetensiNomor: 'UK/PER/2020/0231',
            ujiKompetensiTanggal: '2020-02-18',
          },
        },
        kewenangan: {
          create: [
            { urutan: 1, kodeRef: 'MED-001', namaKewenangan: 'Penanganan kasus emergensi dasar (BHD)', kodeDiminta: '1' },
            { urutan: 2, kodeRef: 'MED-004', namaKewenangan: 'Tata laksana kegawatdaruratan hipoglikemia', kodeDiminta: '1' },
            { urutan: 3, kodeRef: 'MED-012', namaKewenangan: 'Perawatan luka bakar ringan', kodeDiminta: '2' },
          ],
        },
        riwayat: {
          create: [
            { status: 'DRAFT', keterangan: 'Pengajuan dibuat', oleh: 'Ns. Ratna Kurniawati, S.Kep', createdAt: new Date('2026-01-25') },
            { status: 'DIAJUKAN', keterangan: 'Pengajuan dikirim oleh asesi', oleh: 'Ns. Ratna Kurniawati, S.Kep', createdAt: new Date('2026-02-02') },
            { status: 'VERIFIKASI', keterangan: 'Operator mulai memverifikasi berkas', oleh: 'Yudho Prasetyo, S.Kom', createdAt: new Date('2026-02-04') },
            { status: 'PENILAIAN_TIM', keterangan: 'Berkas diverifikasi operator, dinyatakan lengkap — diteruskan ke penilaian tim — Asesor penilai: drg. Siti Aminah, M.Kes', oleh: 'Yudho Prasetyo, S.Kom', createdAt: new Date('2026-02-06') },
          ],
        },
        // Demo pengajuan sudah melewati verifikasi: tetapkan asesor penilai
        // agar sesuai aturan baru (hanya asesor yang ditugaskan yang menilai).
        ...(asesorDemo
          ? {
              penugasanAsesor: {
                create: {
                  asesorId: asesorDemo.id,
                  ditetapkanOleh: 'Yudho Prasetyo, S.Kom',
                },
              },
            }
          : {}),
      },
    })
    await db.jadwalKredensial.createMany({
      data: [
        { pengajuanId: p3.id, tanggal: '2026-02-18', waktu: '08.00 - 12.00 WITA', tempat: 'Ruang Rapat Dinkes Kubar', tahap: 'ASESMEN', keterangan: 'Asesmen kompetensi oleh tim kredensial', status: 'TERJADWAL' },
        { pengajuanId: p3.id, tanggal: '2026-02-25', waktu: '09.00 - 11.00 WITA', tempat: 'Puskesmas Sendawar', tahap: 'PENILAIAN_LAPANGAN', keterangan: 'Penilaian lapangan praktik', status: 'TERJADWAL' },
      ],
    })
    pengajuanBaru.push('KR-2026-1003')
  }

  // ---- Template Daftar Kewenangan Klinis (standar Dinkes Kubar) ----
  const tpl = await seedKewenanganTemplate()
  if (tpl.baru > 0) console.log(`[seed] Template kewenangan: ${tpl.baru} item diisi (${tpl.total} total)`)

  // ---- Logbook demo (laporan bulanan kegiatan klinis) ----
  // Bergantung pada pengajuan demo KR-2025-1001 (SELESAI) yang memiliki
  // kewenangan disetujui. Bulan lalu: sudah diverifikasi pimpinan.
  // Bulan berjalan: menunggu verifikasi (muncul di antrean pimpinan).
  await seedLogbookDemo()

  // ---- Master data tempat kerja + koneksi asesi/pimpinan ----
  const tk = await migrasiTempatKerja()
  if (tk.terhubung > 0) console.log(`[seed] Tempat kerja: ${tk.dibuat} entri demo, ${tk.terhubung} akun/profil terhubung`)

  return { akun: USERS.length + 1, pengajuanBaru }
}

/**
 * Isi tabel KewenanganTemplate dari data standar Dinkes (RINCIAN KEWENANGAN
 * KLINIS REVISI BARU.xlsx): Dokter (9), Dokter Gigi (72), Perawat (681),
 * Bidan (122). Idempoten: hanya mengisi bila tabel masih kosong —
 * dipanggil oleh seedDemo() maupun bootstrap agar deployment lama
 * yang sudah punya akun tetap mendapat tabel template.
 */
export async function seedKewenanganTemplate(): Promise<{ baru: number; total: number }> {
  const jumlah = await db.kewenanganTemplate.count()
  if (jumlah > 0) return { baru: 0, total: jumlah }

  await db.kewenanganTemplate.createMany({
    data: TEMPLATE_KEWENANGAN.map((t, i) => ({ ...t, urutan: i + 1 })),
  })
  return { baru: TEMPLATE_KEWENANGAN.length, total: TEMPLATE_KEWENANGAN.length }
}

/**
 * Pastikan akun SUPERADMIN selalu tersedia, termasuk pada deployment lama
 * (Neon) yang databasenya sudah berisi akun sehingga seedDemo() penuh tidak
 * pernah dijalankan bootstrap.
 * - Belum ada  -> dibuat dengan sandi default kredens123.
 * - Sudah ada  -> hanya dipastikan role SUPERADMIN & aktif; sandi, nama,
 *   dan data milik pengguna TIDAK diubah.
 * Idempoten: aman dipanggil berulang.
 */
export async function seedSuperadmin(): Promise<{ dibuat: boolean }> {
  const sa = USERS.find((u) => u.role === 'SUPERADMIN')
  if (!sa) return { dibuat: false }

  const ada = await db.user.findUnique({
    where: { email: sa.email },
    select: { id: true, role: true, isActive: true },
  })
  if (ada) {
    if (ada.role !== 'SUPERADMIN' || !ada.isActive) {
      await db.user.update({
        where: { id: ada.id },
        data: { role: 'SUPERADMIN', isActive: true },
      })
    }
    return { dibuat: false }
  }

  await db.user.create({ data: { ...sa, passwordHash: hashPassword(PASS), sandiTersimpan: enkripsiSandi(PASS) } })
  return { dibuat: true }
}

/**
 * v1.3.0 — isi/perbaiki salinan sandi terenkripsi akun LAMA:
 * - Belum ber-salinan, atau salinannya tak terbaca (mis. NEXTAUTH_SECRET
 *   pernah diganti), DAN sandinya masih sandi demo bawaan (kredens123)
 *   → salinan diisi ulang dengan kunci sekarang.
 * - v1.3.1: akun ber-sandi POLOS (diketik manual di tabel database, mis.
 *   via konsol Neon) dapat dibaca langsung — salinannya diisi agar superadmin
 *   dapat melihatnya tanpa menunggu akun bersangkutan login. Hash aslinya
 *   TIDAK diubah di sini; upgrade ke hash scrypt terjadi otomatis saat login.
 * - Sandi non-demo ber-hash memang tidak dapat dipulihkan dari hash satu-arah;
 *   superadmin tinggal memakai fitur Reset Sandi untuk akun tersebut.
 */
export async function backfillSandiTersimpan(): Promise<{ diisi: number }> {
  const daftar = await db.user.findMany({
    select: { id: true, passwordHash: true, sandiTersimpan: true },
  })
  let diisi = 0
  for (const u of daftar) {
    // Salinan sudah ada dan terbaca dengan kunci sekarang — lewati.
    if (dekripsiSandi(u.sandiTersimpan)) continue
    // v1.3.1 — sandi polos hasil pengetikan manual di database: nilainya
    // dapat dibaca langsung, cukup salin terenkripsi.
    if (adalahSandiPolos(u.passwordHash)) {
      const polos = u.passwordHash.trim()
      if (!polos) continue
      await db.user.update({
        where: { id: u.id },
        data: { sandiTersimpan: enkripsiSandi(polos) },
      })
      diisi++
      continue
    }
    if (verifyPassword(PASS, u.passwordHash)) {
      await db.user.update({
        where: { id: u.id },
        data: { sandiTersimpan: enkripsiSandi(PASS) },
      })
      diisi++
    }
  }
  return { diisi }
}

/**
 * Deployment lama yang sudah punya pengajuan demo "KR-2026-1003"
 * (berstatus PENILAIAN_TIM) tidak memiliki penugasan asesor karena tabel
 * PenugasanAsesor baru ada setelah fitur ini. Agar aturan baru
 * ("hanya asesor yang ditugaskan yang dapat menilai") tidak membuat demo
 * mati, tetapkan asesor demo ke pengajuan tersebut bila belum ada
 * penugasan sama sekali. Idempoten: aman dipanggil berulang.
 */
export async function seedPenugasanDemo(): Promise<{ dibuat: boolean }> {
  const p = await db.pengajuan.findUnique({
    where: { kode: 'KR-2026-1003' },
    select: { id: true },
  })
  if (!p) return { dibuat: false }

  const jumlah = await db.penugasanAsesor.count({ where: { pengajuanId: p.id } })
  if (jumlah > 0) return { dibuat: false }

  const asesor = await db.user.findUnique({
    where: { email: 'asesor@kredens.go.id' },
    select: { id: true },
  })
  if (!asesor) return { dibuat: false }

  await db.penugasanAsesor.create({
    data: {
      pengajuanId: p.id,
      asesorId: asesor.id,
      ditetapkanOleh: 'Yudho Prasetyo, S.Kom',
    },
  })
  return { dibuat: true }
}

/**
 * Logbook demo untuk asesi demo (pengajuan KR-2025-1001, status SELESAI):
 * - Laporan bulan lalu: DIVERIFIKASI oleh pimpinan fasyankes.
 * - Laporan bulan berjalan: DIAJUKAN — muncul di antrean verifikasi
 *   pimpinan fasyankes. Idempoten: aman dipanggil berulang.
 */
export async function seedLogbookDemo(): Promise<{ dibuat: boolean }> {
  const p = await db.pengajuan.findUnique({
    where: { kode: 'KR-2025-1001' },
    include: { kewenangan: true },
  })
  if (!p) return { dibuat: false }

  const disetujui = p.kewenangan.filter(
    (k) => k.kodeRekomendasi === '1' || k.kodeRekomendasi === '2'
  )
  if (disetujui.length === 0) return { dibuat: false }

  const kini = new Date()
  const bulanKini = kini.getMonth() + 1
  const tahunKini = kini.getFullYear()
  const bulanLalu = bulanKini === 1 ? 12 : bulanKini - 1
  const tahunLalu = bulanKini === 1 ? tahunKini - 1 : tahunKini

  const buatEntri = (tahun: number, bulan: number) => {
    const data: {
      tanggal: string
      kewenanganId: string
      jumlahKasus: number
      catatan?: string
    }[] = []
    const hariBulan = [2, 5, 9, 12, 16, 19, 23, 26]
    const maxHari = new Date(tahun, bulan, 0).getDate()
    hariBulan
      .filter((h) => h <= maxHari)
      .forEach((h, idx) => {
        const tgl = `${tahun}-${String(bulan).padStart(2, '0')}-${String(h).padStart(2, '0')}`
        data.push({
          tanggal: tgl,
          kewenanganId: disetujui[idx % disetujui.length].id,
          jumlahKasus: 3 + (idx % 4),
          ...(idx === 0 ? { catatan: 'Ko-asistensi tindakan bersama dokter' } : {}),
        })
        if (idx % 2 === 0) {
          data.push({
            tanggal: tgl,
            kewenanganId: disetujui[(idx + 1) % disetujui.length].id,
            jumlahKasus: 1 + (idx % 3),
          })
        }
      })
    return data
  }

  // Bulan lalu — sudah diverifikasi
  await db.logbookBulanan.upsert({
    where: {
      pengajuanId_bulan_tahun: { pengajuanId: p.id, bulan: bulanLalu, tahun: tahunLalu },
    },
    update: {},
    create: {
      pengajuanId: p.id,
      bulan: bulanLalu,
      tahun: tahunLalu,
      status: 'DIVERIFIKASI',
      diverifikasiOleh: 'dr. Hasan Basri',
      diverifikasiPada: new Date(),
      submittedAt: new Date(),
      entri: { create: buatEntri(tahunLalu, bulanLalu) },
    },
  })

  // Bulan berjalan — menunggu verifikasi pimpinan
  await db.logbookBulanan.upsert({
    where: {
      pengajuanId_bulan_tahun: { pengajuanId: p.id, bulan: bulanKini, tahun: tahunKini },
    },
    update: {},
    create: {
      pengajuanId: p.id,
      bulan: bulanKini,
      tahun: tahunKini,
      status: 'DIAJUKAN',
      submittedAt: new Date(),
      entri: { create: buatEntri(tahunKini, bulanKini) },
    },
  })

  return { dibuat: true }
}

// ============ TEMPAT KERJA / FASYANKES ============
// Master data fasyankes demo + migrasi data lama: setiap nilai
// tempatBekerja (profil asesi) dan instansi (akun pimpinan fasyankes)
// yang belum terhubung dijadikan entri TempatKerja lalu dihubungkan via
// tempatKerjaId. Idempoten — aman dijalankan berulang.
export async function migrasiTempatKerja(): Promise<{ dibuat: number; terhubung: number }> {
  let dibuat = 0
  let terhubung = 0

  async function pastikanAda(nama: string): Promise<string | null> {
    const bersih = nama.trim()
    if (!bersih) return null
    const tk = await db.tempatKerja.upsert({
      where: { nama: bersih },
      update: {},
      create: { nama: bersih },
    })
    return tk.id
  }

  // 1) Master data demo bila masih kosong
  const jumlahTK = await db.tempatKerja.count()
  if (jumlahTK === 0) {
    const demo = [
      { nama: 'Puskesmas Sendawar', alamat: 'Jl. Panglima Batur No. 10, Sendawar' },
      { nama: 'Puskesmas Melak', alamat: 'Jl. Melak Raya No. 5, Sendawar' },
      { nama: 'Puskesmas Anggana', alamat: 'Jl. Raden Mataher No. 2, Anggana' },
      { nama: 'RSUD Kutai Barat', alamat: 'Jl. Cut Meutia No. 4, Sendawar' },
    ]
    for (const t of demo) {
      await db.tempatKerja.upsert({ where: { nama: t.nama }, update: {}, create: t })
      dibuat++
    }
  }

  // 2) Hubungkan profil asesi yang masih memakai teks bebas
  const profil = await db.asesiProfile.findMany({
    where: { tempatKerjaId: null, tempatBekerja: { not: null } },
    select: { id: true, tempatBekerja: true },
  })
  for (const pr of profil) {
    const id = await pastikanAda(pr.tempatBekerja as string)
    if (id) {
      await db.asesiProfile.update({ where: { id: pr.id }, data: { tempatKerjaId: id } })
      terhubung++
    }
  }

  // 3) Hubungkan akun pimpinan fasyankes yang belum terhubung
  const pimpinan = await db.user.findMany({
    where: { role: 'PIMPINAN_FASYANKES', tempatKerjaId: null, instansi: { not: null } },
    select: { id: true, instansi: true },
  })
  for (const p of pimpinan) {
    const id = await pastikanAda(p.instansi as string)
    if (id) {
      await db.user.update({ where: { id: p.id }, data: { tempatKerjaId: id } })
      terhubung++
    }
  }

  return { dibuat, terhubung }
}

/**
 * v2.1 — pelengkap deployment lama untuk fitur:
 *  1) fungsi tambahan akun (peranEkstra), 2) ketua tim per profesi,
 *  3) anggota tim (perwakilan penilai) hingga tiga nama.
 * Semua langkah hanya MENGISI yang masih kosong — tidak pernah menimpa
 * pengaturan yang sudah dibuat superadmin. Idempoten: aman berulang.
 */
export async function seedFungsiTimV21(): Promise<{ akunBaru: number; diperbarui: number }> {
  let akunBaru = 0
  let diperbarui = 0

  // 1) Ketua tim kredensial lama diberi profesi bila belum punya.
  const ketuaTanpaProfesi = await db.user.findMany({
    where: { role: 'KETUA_TIM_KREDENSIAL', profesi: null },
    select: { id: true, email: true },
  })
  for (const k of ketuaTanpaProfesi) {
    if (k.email === 'ketuatim@kredens.go.id') {
      await db.user.update({ where: { id: k.id }, data: { profesi: 'Dokter' } })
      diperbarui++
    }
  }

  // 2) Akun ketua tim profesi Perawat untuk demo pembagian profesi.
  const ketuaPerawat = await db.user.findUnique({
    where: { email: 'ketuatim.perawat@kredens.go.id' },
    select: { id: true },
  })
  if (!ketuaPerawat) {
    const sumber = USERS.find((u) => u.email === 'ketuatim.perawat@kredens.go.id')
    if (sumber) {
      await db.user.create({
        data: {
          ...sumber,
          passwordHash: hashPassword(PASS),
          sandiTersimpan: enkripsiSandi(PASS),
        },
      })
      akunBaru++
    }
  }

  // 3) Akun asesi demo diberi contoh fungsi tambahan bila belum punya.
  const asesiDemo = await db.user.findUnique({
    where: { email: 'asesi@kredens.go.id' },
    select: { id: true, peranEkstra: true },
  })
  if (asesiDemo && !asesiDemo.peranEkstra) {
    await db.user.update({
      where: { id: asesiDemo.id },
      data: { peranEkstra: 'ASESOR,PIMPINAN_FASYANKES' },
    })
    diperbarui++
  }

  // 4) Rekomendasi tim demo lama dilengkapi dua nama anggota lain bila kosong.
  const rtDemo = await db.pengajuan.findUnique({
    where: { kode: 'KR-2025-1001' },
    select: { rekomendasiTim: { select: { id: true, anggotaNama2: true, anggotaNama3: true } } },
  })
  if (rtDemo?.rekomendasiTim && (!rtDemo.rekomendasiTim.anggotaNama2 || !rtDemo.rekomendasiTim.anggotaNama3)) {
    await db.rekomendasiTim.update({
      where: { id: rtDemo.rekomendasiTim.id },
      data: {
        anggotaNama2: rtDemo.rekomendasiTim.anggotaNama2 ?? 'Ns. Budi Santoso, S.Kep',
        anggotaNama3: rtDemo.rekomendasiTim.anggotaNama3 ?? 'dr. Amelia Putri',
      },
    })
    diperbarui++
  }

  return { akunBaru, diperbarui }
}
