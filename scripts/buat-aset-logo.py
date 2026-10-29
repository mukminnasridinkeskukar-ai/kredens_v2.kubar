# ============================================================
# KREDENS v2.kubar — Generator aset logo dari lambang resmi
# Kabupaten Kutai Barat (KV84 vector-logobase.net.svg)
# ============================================================
import io
import os
import re

import cairosvg
from PIL import Image, ImageDraw, ImageFont

BASE = '/home/z/my-project'
SRC_SVG = f'{BASE}/workspace/kubar_logo_extract/Kabupaten Kutai Barat-logobase.net.svg'
PUB = f'{BASE}/public'
APP = f'{BASE}/src/app'

HI_W, HI_H = 1259, 1540  # render res 1.5x dari viewBox 839.42 x 1026.53

# Warna resmi lambang Kutai Barat
HIJAU = '#009035'
HIJAU_TUA = '#0d3d22' if False else '#0b3d24'
KUNING = '#ffec00'
GELAP = '#1a2b20'
ABU = '#4a5a51'

os.makedirs(f'{BASE}/db', exist_ok=True)


def render_shield(width: int) -> Image.Image:
    """Render lambang resmi ke PNG RGBA (latar transparan)."""
    h = round(width * 1026.5267 / 839.4219)
    png = cairosvg.svg2png(url=SRC_SVG, output_width=width, output_height=h)
    return Image.open(io.BytesIO(png)).convert('RGBA')


def font(path: str, size: int):
    return ImageFont.truetype(path, size)


def cari_font(kandidat: list[str]) -> str:
    for p in kandidat:
        if os.path.exists(p):
            return p
    raise RuntimeError('Font tidak ditemukan: ' + ', '.join(kandidat))


F_BOLD = cari_font([
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
])
F_REG = cari_font([
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
])
F_SEMI = F_BOLD

shield_hi = render_shield(HI_W)

# ------------------------------------------------------------
# 1) logo-mark.png — 512x512, lambang terpusat (transparan)
# ------------------------------------------------------------
mark = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
sh = shield_hi.copy()
sh.thumbnail((472, 472), Image.LANCZOS)
mark.paste(sh, ((512 - sh.width) // 2, (512 - sh.height) // 2), sh)
mark.save(f'{PUB}/logo-mark.png')

# ------------------------------------------------------------
# 2) logo-full.png — lockup horizontal: lambang + wordmark
# ------------------------------------------------------------
S = 2  # superviewsampling lalu diperkecil agar teks mulus
sh2 = shield_hi.copy()
sh2.thumbnail((400 * S, 430 * S), Image.LANCZOS)

f1 = font(F_BOLD, 148 * S)
f2 = font(F_SEMI, 44 * S)
f3 = font(F_BOLD, 46 * S)
_dq = ImageDraw.Draw(Image.new('RGBA', (4, 4)))  # objek ukur saja
w1 = _dq.textlength('KREDENS', font=f1) + 30 * S + _dq.textlength('v2.kubar', font=f1)
w2 = _dq.textlength('Tata Kelola Kredensial Tenaga Medis & Tenaga Kesehatan', font=f2)
w3 = _dq.textlength('KABUPATEN KUTAI BARAT', font=f3)
tx = (6 * S + sh2.width + 56 * S)
LW = int(tx + max(w1, w2, w3) + 16 * S)
LH = 480 * S
full = Image.new('RGBA', (LW, LH), (0, 0, 0, 0))
d = ImageDraw.Draw(full)
full.paste(sh2, (6 * S, (LH - sh2.height) // 2), sh2)

# Baris 1: KREDENS (gelap) + v2.kubar (hijau)
d.text((tx, 66 * S), 'KREDENS', font=f1, fill=GELAP)
d.text((tx + d.textlength('KREDENS', font=f1) + 30 * S, 66 * S), 'v2.kubar', font=f1, fill=HIJAU)

# Garis pemisah tipis hijau
yline = 268 * S
d.rounded_rectangle([tx, yline, tx + max(w2, w3), yline + 8 * S], radius=4 * S, fill=HIJAU)

# Baris 2: subjudul
d.text((tx, 300 * S), 'Tata Kelola Kredensial Tenaga Medis & Tenaga Kesehatan', font=f2, fill=ABU)

# Baris 3: wilayah
d.text((tx, 372 * S), 'KABUPATEN KUTAI BARAT', font=f3, fill=HIJAU)

full = full.resize((LW // S, LH // S), Image.LANCZOS)
full.save(f'{PUB}/logo-full.png')

# ------------------------------------------------------------
# 3) Ikon aplikasi: kubah hijau rounded + lambang putih ring
#    icon.svg (512) + icon-192.png + icon-512.png + favicon
# ------------------------------------------------------------
svg_src = open(SRC_SVG, encoding='utf-8').read()
m = re.search(r'(<g\s+id="Layer1000">.*)</svg>', svg_src, re.S)
g_inner = m.group(1).rstrip()

NS = ('xmlns="http://www.w3.org/2000/svg" '
      'xmlns:xlink="http://www.w3.org/1999/xlink"')


def icon_svg(rx: int = 112, bg: str = '#ffffff', ring: str = HIJAU) -> str:
    # lambang 839.42x1026.53 -> skala 0.345 => 289x354, pusat (512)
    sc = 0.345
    w, h = 839.4219 * sc, 1026.5267 * sc
    tx, ty = (512 - w) / 2, (512 - h) / 2
    return f'''<svg {NS} version="1.1" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="{rx}" fill="{bg}"/>
  <rect x="10" y="10" width="492" height="492" rx="{max(rx - 8, 12)}" fill="none" stroke="{ring}" stroke-width="16"/>
  <g transform="translate({tx:.1f},{ty:.1f}) scale({sc})">
    {g_inner}
  </g>
</svg>'''


ikon = icon_svg()
open(f'{PUB}/icon.svg', 'w', encoding='utf-8').write(ikon)
open(f'{APP}/icon.svg', 'w', encoding='utf-8').write(ikon)
open(f'{PUB}/logo.svg', 'w', encoding='utf-8').write(ikon)
open(f'{PUB}/kubar-shield.svg', 'w', encoding='utf-8').write(
    f'<svg {NS} version="1.1" viewBox="0 0 839.4219 1026.5267">{g_inner}</svg>'
)

# PNG ikon PWA dari icon.svg
cairosvg.svg2png(url=f'{PUB}/icon.svg', write_to=f'{PUB}/icon-192.png', output_width=192, output_height=192)
cairosvg.svg2png(url=f'{PUB}/icon.svg', write_to=f'{PUB}/icon-512.png', output_width=512, output_height=512)

# favicon PNG (src/app/icon.png diganti ikon baru)
cairosvg.svg2png(url=f'{APP}/icon.svg', write_to=f'{APP}/icon.png', output_width=256, output_height=256)

# ------------------------------------------------------------
# 4) Pratinjau logo-full untuk pemeriksaan visual
# ------------------------------------------------------------
full.save(f'{BASE}/workspace/preview-logo-full.png')
mark.save(f'{BASE}/workspace/preview-logo-mark.png')
ikon_png = Image.open(f'{PUB}/icon-512.png')
ikon_png.save(f'{BASE}/workspace/preview-icon.png')

print('Aset logo KREDENS v2.kubar selesai dibuat:')
for f in ['logo-mark.png', 'logo-full.png', 'icon.svg', 'icon-192.png', 'icon-512.png', 'kubar-shield.svg', 'logo.svg']:
    p = f'{PUB}/{f}'
    print(f'  {p} ({os.path.getsize(p)} bytes)')
print(f'  {APP}/icon.svg ({os.path.getsize(f"{APP}/icon.svg")} bytes)')
print(f'  {APP}/icon.png ({os.path.getsize(f"{APP}/icon.png")} bytes)')
