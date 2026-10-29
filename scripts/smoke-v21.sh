#!/bin/bash
# Smoke test v2.1 — login tiap akun demo & cek halaman kunci
# Catatan: HTML RSC menyisipkan komentar <!-- --> antar text node, jadi
# pemeriksaan memakai Python yang menghapus komentar dulu.
BASE="http://localhost:3000"
JAR="/tmp/kredens-jar-$$.txt"

login() {
  local email="$1"; local pass="$2"
  rm -f "$JAR"
  local csrf
  csrf=$(curl -s -c "$JAR" "$BASE/api/auth/csrf" | python3 -c "import sys,json;print(json.load(sys.stdin)['csrfToken'])")
  curl -s -b "$JAR" -c "$JAR" -o /dev/null -X POST "$BASE/api/auth/callback/credentials" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data-urlencode "csrfToken=$csrf" \
    --data-urlencode "email=$email" \
    --data-urlencode "password=$pass" \
    --data-urlencode "redirect=false" \
    --data-urlencode "json=true"
}

cek() {
  local email="$1"; local pass="$2"; local path="$3"; local cek="$4"; local label="$5"
  login "$email" "$pass"
  curl -s -b "$JAR" "$BASE$path" > /tmp/kredens-last.html
  if python3 - "$cek" <<'PYEOF'
import sys, re
needle = sys.argv[1]
html = open('/tmp/kredens-last.html', encoding='utf-8', errors='replace').read()
html = re.sub(r'<!--.*?-->', '', html, flags=re.S)
sys.exit(0 if needle in html else 1)
PYEOF
  then
    echo "PASS [$label] $email $path — menemukan: '$cek'"
  else
    echo "FAIL [$label] $email $path — TIDAK menemukan: '$cek'"
  fi
}

echo "=== SMOKE TEST KREDENS v2.1 ==="
cek "superadmin@kredens.go.id" "kredens123" "/kelola-akun" "Profesi: Dokter" "Badge profesi ketua tim"
cek "superadmin@kredens.go.id" "kredens123" "/kelola-akun" "+ Asesor" "Badge fungsi tambahan asesi"
cek "asesi@kredens.go.id" "kredens123" "/dashboard" "Fungsi Tambahan Akun" "Dashboard multi-fungsi"
cek "asesi@kredens.go.id" "kredens123" "/dashboard" "+ Asesor" "Chip fungsi di sidebar"
cek "asesi@kredens.go.id" "kredens123" "/penilaian" "Penilaian Kewenangan Klinis" "Asesi→Asesor fungsi tambahan"
cek "asesi@kredens.go.id" "kredens123" "/pimpinan" "Surat Penugasan Klinis" "Asesi→Pimpinan fungsi tambahan"
cek "ketuatim.perawat@kredens.go.id" "kredens123" "/ketua-tim" "Tim kredensial profesi Perawat" "Ketua tim Perawat"
cek "ketuatim.perawat@kredens.go.id" "kredens123" "/ketua-tim" "KR-2026-1003" "Pengajuan profesi Perawat tampil"
cek "ketuatim@kredens.go.id" "kredens123" "/ketua-tim" "Tim kredensial profesi Dokter" "Ketua tim Dokter"

# Anggota tim 1-3 pada halaman read-only asesi (pilih pengajuan KR-2025-1001)
login "asesi@kredens.go.id" "kredens123"
curl -s -b "$JAR" "$BASE/kredensialing/rekomendasi-tim" > /tmp/kredens-last.html
PID_KR1001=$(python3 - <<'PYEOF'
import re
html = open('/tmp/kredens-last.html', encoding='utf-8', errors='replace').read()
# payload RSC menyimpan JSON dengan tanda kutri ter-escape: \"id\":\"...\",\"kode\":\"KR-2025-1001\"
m = re.search(r'\\"id\\":\\"([a-z0-9]{15,})\\",\\"kode\\":\\"KR-2025-1001\\"', html)
print(m.group(1) if m else '', end='')
PYEOF
)
if [ -n "$PID_KR1001" ]; then
  curl -s -b "$JAR" "$BASE/kredensialing/rekomendasi-tim?pengajuan=$PID_KR1001" > /tmp/kredens-last.html
  if grep -q "Perwakilan Penilai 2" /tmp/kredens-last.html && grep -q "Perwakilan Penilai 3" /tmp/kredens-last.html; then
    echo "PASS [Anggota tim 1-3] asesi /kredensialing/rekomendasi-tim — Perwakilan 1-3 tampil"
  else
    echo "FAIL [Anggota tim 1-3] asesi /kredensialing/rekomendasi-tim — Perwakilan 2/3 tidak tampil"
  fi
else
  echo "FAIL [Anggota tim 1-3] — id pengajuan KR-2025-1001 tidak ditemukan pada halaman"
fi
rm -f "$JAR"
echo "=== SELESAI ==="
