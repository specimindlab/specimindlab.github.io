#!/usr/bin/env bash
# Visual QA for the series compositions: for every fixture in video/src/series/fixtures, render one
# still per beat (2 s after the beat starts, or its last frame if shorter) plus the final frame,
# then a contact sheet per series.
#   scripts/render_series_test.sh [out-dir] [platform] [Series ...]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/video/out/series}"
PLATFORM="${2:-ig}"
shift 2 2>/dev/null || true
cd "$ROOT/video"
npx --no-install remotion bundle src/index.ts --out-dir build --log=error
SERIES=("$@")
[ ${#SERIES[@]} -gt 0 ] || SERIES=(FieldSpecimen FreeRange RareSighting Plate FieldSketch Mimicry Dissection Drawer ExtinctionWatch)
for s in "${SERIES[@]}"; do
  fx="src/series/fixtures/$s.json"
  dir="$OUT/$s"; rm -rf "$dir"; mkdir -p "$dir"
  props="$dir/props.json"
  node -e '
    const fs=require("fs");const [fx,p,out,cat]=process.argv.slice(1);
    const script=JSON.parse(fs.readFileSync(fx,"utf8"));const props={script,platform:p};
    if(script.composition==="Drawer")props.catalog=JSON.parse(fs.readFileSync(cat,"utf8"));
    fs.writeFileSync(out,JSON.stringify(props));' "$fx" "$PLATFORM" "$props" src/series/fixtures/catalog.fixture.json
  node -e '
    const s=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));let f=0;const out=[];
    s.beats.forEach((b,i)=>{const d=Math.round(b.seconds*30);out.push([f+Math.min(d-1,60),`${String(i+1).padStart(2,"0")}-${b.type}`]);f+=d;});
    out.push([f-1,"zz-last"]);out.forEach(([fr,l])=>console.log(fr,l));' "$fx" |
  while read -r frame label; do
    npx --no-install remotion still build "$s" "$dir/$label.png" --frame="$frame" --props="$props" --gl=swangle --log=error
  done
  n=$(ls "$dir"/*.png | wc -l)
  ffmpeg -hide_banner -loglevel error -y -pattern_type glob -i "$dir/[0-9z]*.png" \
    -vf "scale=360:-1,tile=${n}x1:padding=8:color=0x151612" -frames:v 1 "$OUT/$s-sheet.png"
  echo "$s: $n stills"
done
