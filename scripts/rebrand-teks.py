# ============================================================
# KREDENS v2.kubar — Rebrand massal teks
# Kutai Kartanegara/Kukar -> Kutai Barat/Kubar
# ============================================================
import os
import re

BASE = '/home/z/my-project'
TARGETS = []
for root, dirs, files in os.walk(f'{BASE}/src'):
    for f in files:
        if f.endswith(('.ts', '.tsx')):
            TARGETS.append(os.path.join(root, f))
for extra in [
    f'{BASE}/prisma/schema.prisma',
    f'{BASE}/prisma/schema.postgres.prisma',
    f'{BASE}/README.md',
    f'{BASE}/CARA-DEPLOY.md',
]:
    if os.path.exists(extra):
        TARGETS.append(extra)

# Urutan penting
PASANGAN = [
    # nama wilayah
    ('Kutai Kartanegara', 'Kutai Barat'),
    ('kutakartanegara.go.id', 'kutaibarat.go.id'),
    ('KUTAI KARTANEGARA', 'KUTAI BARAT'),
    # sebutan singkat dinas
    ('Dinkes Kukar', 'Dinkes Kubar'),
    ('dinkes Kukar', 'dinkes Kubar'),
    ('Dinas Kesehatan Kukar', 'Dinas Kesehatan Kubar'),
    ('Dinkes KUKAR', 'Dinkes KUBAR'),
    ('Dinkes Kukar', 'Dinkes Kubar'),
    ('Kukar', 'Kubar'),  # sisa umum (mis. komentar)
    # ibu kota kabupaten pada data demo
    ('Tenggarong, Kutai Barat', 'Sendawar, Kutai Barat'),
]

KATA_KUNCI_V2 = [
    ("export const APP_NAME = 'KREDENS'", "export const APP_NAME = 'KREDENS v2.kubar'"),
    ('KREDENS — Kredensial', 'KREDENS v2.kubar — Kredensial'),
    ('# KREDENS\n', '# KREDENS v2.kubar\n'),
]

diedit = {}
for path in TARGETS:
    try:
        teks = open(path, encoding='utf-8').read()
    except UnicodeDecodeError:
        continue
    asli = teks
    for a, b in PASANGAN:
        teks = teks.replace(a, b)
    for a, b in KATA_KUNCI_V2:
        teks = teks.replace(a, b)
    if teks != asli:
        open(path, 'w', encoding='utf-8').write(teks)
        diedit[path.replace(BASE + '/', '')] = sum(
            1 for a, b in PASANGAN if a in asli
        )

print(f'{len(diedit)} file diedit:')
for p in sorted(diedit):
    print(' -', p)

# Verifikasi: tidak ada sisa
sisa = []
for path in TARGETS:
    try:
        teks = open(path, encoding='utf-8').read()
    except UnicodeDecodeError:
        continue
    for pola in ['Kartanegara', 'KARTANEGARA', 'Kukar', 'KUKAR', 'Tenggarong']:
        if pola in teks:
            sisa.append((path.replace(BASE + '/', ''), pola))
print('\nSisa (harus kosong):', sisa if sisa else 'BERSIH')
