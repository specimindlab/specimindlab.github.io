#!/usr/bin/env bash
# Render one settled still per design-system scene (video/src/test/SystemTest.tsx) plus a
# contact sheet, for visual QA of the component library.
#   scripts/render_system_test.sh [out-dir] [guides:true|false]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/video/out/system}"
GUIDES="${2:-false}"
mkdir -p "$OUT"
cd "$ROOT/video"
npx --no-install remotion bundle src/index.ts --out-dir build --log=error
SCENES=$(grep -oP 'SCENE_COUNT = \K\d+' src/test/SystemTest.tsx)
SCENE=$(grep -oP 'export const SCENE = \K\d+' src/test/SystemTest.tsx)
SETTLE=$(grep -oP 'export const SETTLE = \K\d+' src/test/SystemTest.tsx)
for i in $(seq 0 $((SCENES - 1))); do
  f=$((i * SCENE + SETTLE))
  npx --no-install remotion still build SystemTest "$OUT/scene-$(printf %02d "$i").png" --frame="$f" \
    --props="{\"guides\":$GUIDES}" --gl=swangle --log=error
done
ffmpeg -hide_banner -loglevel error -y -pattern_type glob -i "$OUT/scene-*.png" \
  -vf "scale=360:-1,tile=8x2:padding=8:color=0x151612" -frames:v 1 "$OUT/contact-sheet.png"
echo "stills in $OUT"
