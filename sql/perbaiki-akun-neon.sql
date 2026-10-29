-- ============================================================
-- KREDENS — Perbaikan & Penataan Akun Pengguna (Neon PostgreSQL)
-- ============================================================
-- KAPAN SKRIP INI DIPAKAI?
--   Bila login selalu gagal ("Email atau kata sandi tidak sesuai")
--   padahal akun sudah ada di database Neon. Penyebab paling umum:
--   kolom "passwordHash" berisi teks biasa / hash format lain,
--   email memakai huruf besar, atau nilai "role" tidak sesuai.
--
-- CARA PAKAI:
--   1. Buka Neon Console -> project Anda -> tab "SQL Editor".
--   2. Tempel SELURUH isi file ini -> tombol Run.
--   3. Skrip akan: (a) menampilkan daftar akun + status hash,
--      (b) merapikan email menjadi huruf kecil, (c) menormalkan
--      8 akun resmi KREDENS (role, status aktif, dan kata sandi
--      di-reset menjadi: kredens123), (d) menampilkan hasil akhir.
--   4. Login kembali, mis. superadmin@kredens.go.id / kredens123.
--      Setelah berhasil, segera ganti kata sandi lewat menu
--      "Profil dan Keamanan" (Akun Saya).
--
-- CATATAN:
-- - Skrip idempoten: aman dijalankan berulang.
-- - Akun selain 8 email resmi di bawah TIDAK disentuh (data Anda aman),
--   kecuali perapian email huruf besar/kecil.
-- - Bila muncul error "relation "User" does not exist": berarti
--   tabel belum dibuat. Kosongkan database atau cukup buka
--   https://<alamat-aplikasi-anda>/api/setup sekali, lalu jalankan
--   skrip ini lagi.
-- - Format hash aplikasi: scrypt:<salt hex>:<hash hex>
--   (scrypt 64 byte, salt 16 byte hex) — identik dengan hashPassword()
--   di src/lib/password.ts.
-- ============================================================

-- ------------------------------------------------------------
-- 1) DIAGNOSTIK — daftar akun beserta kesehatan hash sandinya
--    (hash_valid = 'TIDAK' hampir pasti menjadi penyebab gagal login)
-- ------------------------------------------------------------
SELECT "email", "nama", "role", "isActive",
       CASE
         WHEN "passwordHash" LIKE 'scrypt:%'
              AND length("passwordHash") - length(replace("passwordHash", ':', '')) = 2
              AND length(split_part("passwordHash", ':', 2)) = 32
              AND length(split_part("passwordHash", ':', 3)) = 128
         THEN 'YA' ELSE 'TIDAK'
       END AS "hash_valid"
FROM "User"
ORDER BY "role", "email";

-- ------------------------------------------------------------
-- 2) RAPIKAN EMAIL — semua email dijadikan huruf kecil tanpa spasi
--    (login mencocokkan email dalam huruf kecil)
-- ------------------------------------------------------------
UPDATE "User" u
SET "email" = lower(btrim(u."email"))
WHERE u."email" <> lower(btrim(u."email"))
  AND NOT EXISTS (
    SELECT 1 FROM "User" x
    WHERE x."email" = lower(btrim(u."email")) AND x."id" <> u."id"
  );

-- ------------------------------------------------------------
-- 3) NORMALKAN 8 AKUN RESMI — sandi di-reset ke kredens123
-- ------------------------------------------------------------
-- ASESI
INSERT INTO "User" ("id","email","passwordHash","nama","role","nip","jabatan","instansi","isActive","createdAt","updatedAt")
VALUES (
  'std-asesi-1432f8b39c3b',
  'asesi@kredens.go.id',
  'scrypt:ee288a7698cd404882c326480d7674cd:81121d1542a2a50fcbbc0c9e91aa196332273f91aaf97f32e3bb7a26c98871a34734b07bc2a5552653fcc488627ae05e89d17a4a92bcdd73bf51bac686ed6d2b',
  'Ns. Ratna Kurniawati, S.Kep',
  'ASESI',
  '198705122010012004',
  'Perawat Ahli Pertama',
  'Puskesmas Sendawar',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO UPDATE SET
  "role"         = 'ASESI',
  "isActive"     = true,
  "passwordHash" = EXCLUDED."passwordHash",
  "nama"         = EXCLUDED."nama",
  "nip"          = EXCLUDED."nip",
  "jabatan"      = EXCLUDED."jabatan",
  "instansi"     = EXCLUDED."instansi",
  "updatedAt"    = CURRENT_TIMESTAMP;

-- ASESOR
INSERT INTO "User" ("id","email","passwordHash","nama","role","nip","jabatan","instansi","isActive","createdAt","updatedAt")
VALUES (
  'std-asesor-f997ea424258',
  'asesor@kredens.go.id',
  'scrypt:9a9bbdb8188aeddc712f73b7144f89e9:a5a9952a3b94eccf0b16b05780bbf1b416304b3b04c8881ddb49fad7b801d31d117d384156d59dad4d39eea53be45cd14961ba2804605c1b533681f46ec22aed',
  'drg. Siti Aminah, M.Kes',
  'ASESOR',
  '198003152005012003',
  'Asesor Kredensial',
  'Dinas Kesehatan Kubar',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO UPDATE SET
  "role"         = 'ASESOR',
  "isActive"     = true,
  "passwordHash" = EXCLUDED."passwordHash",
  "nama"         = EXCLUDED."nama",
  "nip"          = EXCLUDED."nip",
  "jabatan"      = EXCLUDED."jabatan",
  "instansi"     = EXCLUDED."instansi",
  "updatedAt"    = CURRENT_TIMESTAMP;

-- OPERATOR_KREDENSIAL
INSERT INTO "User" ("id","email","passwordHash","nama","role","nip","jabatan","instansi","isActive","createdAt","updatedAt")
VALUES (
  'std-operator-2981207323c8',
  'operator@kredens.go.id',
  'scrypt:da0b7221c0c33947997c17dddc7325d3:dd1e853d9988001d3fc0c4dd7ee7fcfb7db48daea220d77a9f701cf4770ebbfe4eeaa8c0aade91aea7225d0c4634cf8320c13997b567513d6f0affee286731b1',
  'Yudho Prasetyo, S.Kom',
  'OPERATOR_KREDENSIAL',
  '199102232015031001',
  'Operator Kredensial',
  'Dinas Kesehatan Kubar',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO UPDATE SET
  "role"         = 'OPERATOR_KREDENSIAL',
  "isActive"     = true,
  "passwordHash" = EXCLUDED."passwordHash",
  "nama"         = EXCLUDED."nama",
  "nip"          = EXCLUDED."nip",
  "jabatan"      = EXCLUDED."jabatan",
  "instansi"     = EXCLUDED."instansi",
  "updatedAt"    = CURRENT_TIMESTAMP;

-- KETUA_TIM_KREDENSIAL
INSERT INTO "User" ("id","email","passwordHash","nama","role","nip","jabatan","instansi","isActive","createdAt","updatedAt")
VALUES (
  'std-ketuatim-40b6d4659c76',
  'ketuatim@kredens.go.id',
  'scrypt:a7280b24de91b1169153367180fec04c:693c57901be3e59b93c81c1b7b9c6d04e60d2f84827c0215af23b02ff381c9f8bf6e71bbfbd657c5dec6dd536eafb872d184d2f0915eeb6053a3bdcc89065b58',
  'dr. H. Muhajir, Sp.PD',
  'KETUA_TIM_KREDENSIAL',
  '197504102003121002',
  'Ketua Tim Kredensial',
  'Dinas Kesehatan Kubar',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO UPDATE SET
  "role"         = 'KETUA_TIM_KREDENSIAL',
  "isActive"     = true,
  "passwordHash" = EXCLUDED."passwordHash",
  "nama"         = EXCLUDED."nama",
  "nip"          = EXCLUDED."nip",
  "jabatan"      = EXCLUDED."jabatan",
  "instansi"     = EXCLUDED."instansi",
  "updatedAt"    = CURRENT_TIMESTAMP;

-- MITRA_BESTARI
INSERT INTO "User" ("id","email","passwordHash","nama","role","nip","jabatan","instansi","isActive","createdAt","updatedAt")
VALUES (
  'std-mitra-451f889fa58a',
  'mitra@kredens.go.id',
  'scrypt:8e348a28b852c277f1efb4fb02a1ca03:d0af3995e46da7e62983147edecd0f9c075485ba9788a5b46cdf34b9869ff64e49804df541b326b2f03513f666c38917d2082988a94a36829ae64d1f951f2415',
  'dr. Amelia Putri',
  'MITRA_BESTARI',
  '199204182018012005',
  'Mitra Bestari',
  'RSUD Kutai Barat',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO UPDATE SET
  "role"         = 'MITRA_BESTARI',
  "isActive"     = true,
  "passwordHash" = EXCLUDED."passwordHash",
  "nama"         = EXCLUDED."nama",
  "nip"          = EXCLUDED."nip",
  "jabatan"      = EXCLUDED."jabatan",
  "instansi"     = EXCLUDED."instansi",
  "updatedAt"    = CURRENT_TIMESTAMP;

-- PIMPINAN_FASYANKES
INSERT INTO "User" ("id","email","passwordHash","nama","role","nip","jabatan","instansi","isActive","createdAt","updatedAt")
VALUES (
  'std-pimpinan-2f262df9afc4',
  'pimpinan@kredens.go.id',
  'scrypt:b4d1cacc312823a880ace1a6d6f4eef6:c51c4dd5c5a8d8581f0d7c60acdd14873dfca185109fa46d2cea236eb7f200a69550404e90b6187f5232582031b48b84a857ad38a797166d57c75ee9d533ed79',
  'dr. Hasan Basri',
  'PIMPINAN_FASYANKES',
  '197809202006041003',
  'Kepala Puskesmas',
  'Puskesmas Sendawar',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO UPDATE SET
  "role"         = 'PIMPINAN_FASYANKES',
  "isActive"     = true,
  "passwordHash" = EXCLUDED."passwordHash",
  "nama"         = EXCLUDED."nama",
  "nip"          = EXCLUDED."nip",
  "jabatan"      = EXCLUDED."jabatan",
  "instansi"     = EXCLUDED."instansi",
  "updatedAt"    = CURRENT_TIMESTAMP;

-- KEPALA_DINAS_KESEHATAN
INSERT INTO "User" ("id","email","passwordHash","nama","role","nip","jabatan","instansi","isActive","createdAt","updatedAt")
VALUES (
  'std-kadis-bb6059e7ef9e',
  'kadis@kredens.go.id',
  'scrypt:65466883cdafa0c8ac8599a9cc340f1c:35be605ed1da438cf966af18a0f49adce681d462a5e06a87a5eb128ec07470ee82d83d1ab62587dcfdfabb57b6c29be5768824216ef2a0acdcfe02ebd8a2dc5d',
  'H. Dr. Hamdani, M.Kes',
  'KEPALA_DINAS_KESEHATAN',
  '197002051995121001',
  'Kepala Dinas Kesehatan',
  'Dinas Kesehatan Kubar',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO UPDATE SET
  "role"         = 'KEPALA_DINAS_KESEHATAN',
  "isActive"     = true,
  "passwordHash" = EXCLUDED."passwordHash",
  "nama"         = EXCLUDED."nama",
  "nip"          = EXCLUDED."nip",
  "jabatan"      = EXCLUDED."jabatan",
  "instansi"     = EXCLUDED."instansi",
  "updatedAt"    = CURRENT_TIMESTAMP;

-- SUPERADMIN
INSERT INTO "User" ("id","email","passwordHash","nama","role","nip","jabatan","instansi","isActive","createdAt","updatedAt")
VALUES (
  'std-superadmin-909eeed36856',
  'superadmin@kredens.go.id',
  'scrypt:dfe636d7c308e270bafa5d9bf115c0ab:86aad2a5f230eaf9cb61133b7eaa48c6aa2f6436f156d7e5caea4fd44b62e7ca7194372788ab1511a8a98eab53f3eaaf2e8eebfff0962fcc64138b64a80bcade',
  'Super Administrator',
  'SUPERADMIN',
  NULL,
  'Administrator Sistem',
  'Dinas Kesehatan Kubar',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO UPDATE SET
  "role"         = 'SUPERADMIN',
  "isActive"     = true,
  "passwordHash" = EXCLUDED."passwordHash",
  "nama"         = EXCLUDED."nama",
  "nip"          = EXCLUDED."nip",
  "jabatan"      = EXCLUDED."jabatan",
  "instansi"     = EXCLUDED."instansi",
  "updatedAt"    = CURRENT_TIMESTAMP;

-- ------------------------------------------------------------
-- 4) HASIL AKHIR — 8 akun resmi harus aktif dan ber-hash valid
-- ------------------------------------------------------------
SELECT "email", "nama", "role", "isActive",
       CASE WHEN "passwordHash" LIKE 'scrypt:%' THEN 'YA' ELSE 'TIDAK' END AS "hash_valid"
FROM "User"
WHERE "email" IN (
  'asesi@kredens.go.id','asesor@kredens.go.id','operator@kredens.go.id',
  'ketuatim@kredens.go.id','mitra@kredens.go.id','pimpinan@kredens.go.id',
  'kadis@kredens.go.id','superadmin@kredens.go.id'
)
ORDER BY "role", "email";

-- ============================================================
-- OPSIONAL: aktifkan satu akun tertentu (mis. pendaftar mandiri
-- yang menunggu verifikasi operator). Hapus tanda -- di bawah
-- dan ganti emailnya:
--
-- UPDATE "User" SET "isActive" = true, "updatedAt" = CURRENT_TIMESTAMP
-- WHERE "email" = 'ganti.email@kutakartanegara.go.id';
-- ============================================================
