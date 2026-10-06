#!/usr/bin/env bash
# Level check for the generated sound (scripts/make_sfx.py). Run it in the background.
#   scripts/render_sound_test.sh [out-dir]
#
# 1. SoundTest: a dense 10 s composition with every sound (pin, card, ink, stamp + drawer, clicks,
#    end card with the motif), rendered once per bed as a real MP4 and sent through
#    scripts/loudness.sh exactly as render.yml does. A stress case: ~11 cues in 10 s.
# 2. Episodes: the audio of every series fixture (28-40 s, real cue density), each over a
#    different bed, wrapped in a still video and sent through loudness.sh too.
# Prints EBU R128 numbers (ffmpeg ebur128) before and after: integrated LUFS, loudness range,
# true peak and the loudest 400 ms (momentary max).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/video/out/sound}"
mkdir -p "$OUT"
cd "$ROOT/video"
npx --no-install remotion bundle src/index.ts --out-dir build --log=error

r128() { # r128 <file> -> "I LUFS | LRA | true peak | momentary max"
  ffmpeg -hide_banner -nostats -v verbose -i "$1" -map 0:a:0 -af "ebur128=peak=true:framelog=verbose" -f null - 2>&1 | python3 -c '
import re, sys
log = sys.stdin.read()
cut = log.rfind("Summary:")
m = [float(x) for x in re.findall(r"\bM:\s*(-?[\d.]+)", log[:cut])]
s = log[cut:]
g = lambda p: float(re.search(p, s).group(1))
print("%6.1f LUFS  LRA %4.1f  TP %5.1f dBTP  Mmax %6.1f" % (g(r"I:\s+(-?[\d.]+) LUFS"), g(r"LRA:\s+(-?[\d.]+) LU"),
      g(r"Peak:\s+(-?[\d.]+) dBFS"), max(m) if m else float("nan")))'
}
row() { # row <label> <raw> <norm> <loudness.sh output>
  printf '%-22s %-48s %s\n' "$1" "$(r128 "$2")" "$(r128 "$3")"
  echo "$4" | grep -q WARNING && echo "$4" | grep WARNING | sed 's/^/                       /'
  echo "$4" | sed -n 's/.*normalised (raw [^,]*, \(gain .*\))$/                       \1/p'
}

printf '%-22s %-48s %s\n' "" "raw render" "after loudness.sh"
for b in 1 2 3 4 5 6; do
  raw="$OUT/sound-test-bed-$b.mp4"; norm="$OUT/sound-test-bed-$b-norm.mp4"
  npx --no-install remotion render build SoundTest "$raw" --props="{\"bed\":\"sfx/bed-$b.wav\"}" \
    --codec=h264 --crf=18 --pixel-format=yuv420p --color-space=bt709 \
    --audio-codec=aac --audio-bitrate=192k --sample-rate=48000 --log=error
  row "SoundTest bed-$b" "$raw" "$norm" "$(bash "$ROOT/scripts/loudness.sh" "$raw" "$norm" 2>&1)"
done

i=0
for s in FieldSpecimen FreeRange RareSighting Plate FieldSketch Mimicry Dissection Drawer ExtinctionWatch; do
  b=$((i % 6 + 1)); i=$((i + 1))
  props="$OUT/$s-props.json"
  node -e '
    const fs=require("fs");const [fx,bed,out,cat]=process.argv.slice(1);
    const script=JSON.parse(fs.readFileSync(fx,"utf8"));script.bed=bed;const props={script,platform:"yt"};
    if(script.composition==="Drawer")props.catalog=JSON.parse(fs.readFileSync(cat,"utf8"));
    fs.writeFileSync(out,JSON.stringify(props));' "src/series/fixtures/$s.json" "sfx/bed-$b.wav" "$props" src/series/fixtures/catalog.fixture.json
  wav="$OUT/$s.wav"; raw="$OUT/$s.mp4"; norm="$OUT/$s-norm.mp4"
  npx --no-install remotion render build "$s" "$wav" --props="$props" --codec=wav --sample-rate=48000 --log=error
  ffmpeg -hide_banner -loglevel error -y -f lavfi -i "color=c=0xD8DCCD:s=1080x1920:r=30" -i "$wav" -shortest \
    -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 "$raw"
  row "$s bed-$b" "$raw" "$norm" "$(bash "$ROOT/scripts/loudness.sh" "$raw" "$norm" 2>&1)"
done
