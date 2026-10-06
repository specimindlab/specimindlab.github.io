#!/usr/bin/env bash
# Render, normalise, verify and publish one batch. Runs in .github/workflows/render.yml.
#
#   scripts/render_batch.sh <batch>            # data/batches/<batch>.json
#   scripts/render_batch.sh path/to/batch.json
#
# For each episode in the batch: renders <id>-yt.mp4, <id>-ig.mp4 and <id>-x.mp4 with one
# delivery spec (1080x1920, constant 30 fps, H.264 High, CRF 18, yuv420p, BT.709,
# AAC-LC 48 kHz stereo 192 kbps, +faststart). Only the CTA beat differs per platform.
# Then: scripts/loudness.sh (-14 LUFS, <= -1 dBTP), scripts/verify_delivery.py, posting/<batch>/,
# specimind-<batch>.zip and the GitHub Release <batch>.
#
# Environment:
#   EPISODES_DIR   where episode folders live (default: episodes; the smoke test uses fixtures)
#   NO_RELEASE=1   build posting/ and the zip but do not create a Release
#   ONLY_PLATFORMS space-separated subset of "yt ig x" (default: all three)
#   GH_TOKEN       required for the Release (GITHUB_TOKEN inside Actions)
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
EPISODES_DIR="${EPISODES_DIR:-episodes}"
PLATFORMS="${ONLY_PLATFORMS:-yt ig x}"
FAILED=0

annotate() { # annotate <repo-path> <message>
  echo "::error file=$1::$2"
  FAILED=1
}

arg="${1:?usage: render_batch.sh <batch-name|batch.json>}"
if [ -f "$arg" ]; then BATCH_FILE="$arg"; else BATCH_FILE="data/batches/${arg%.json}.json"; fi
[ -f "$BATCH_FILE" ] || { echo "::error file=$BATCH_FILE::batch file not found"; exit 1; }
BATCH="$(python3 -c "import json,sys,os;d=json.load(open(sys.argv[1]));print(d.get('batch') or os.path.basename(sys.argv[1])[:-5])" "$BATCH_FILE")" \
  || { echo "::error file=$BATCH_FILE::batch file is not valid JSON"; exit 1; }
IDS="$(python3 -c "import json,sys;print(' '.join(e['id'] for e in json.load(open(sys.argv[1]))['episodes']))" "$BATCH_FILE")" \
  || { echo "::error file=$BATCH_FILE::batch file has no episodes[].id"; exit 1; }
echo "Batch $BATCH: $IDS"

# ---- 1. Locate episodes and check their inputs ------------------------------------------
declare -A FOLDER
for id in $IDS; do
  matches=("$EPISODES_DIR"/"$id"-*/)
  dir="${matches[0]%/}"
  if [ ! -d "$dir" ]; then
    annotate "$BATCH_FILE" "$id: no folder $EPISODES_DIR/$id-*"
    continue
  fi
  FOLDER[$id]="$dir"
  for f in script.json cover.png "$id.srt"; do
    [ -f "$dir/$f" ] || annotate "$dir/script.json" "$id: missing $dir/$f"
  done
  if [ -f "$dir/script.json" ]; then
    python3 -c "import json,sys;json.load(open(sys.argv[1]))" "$dir/script.json" 2>/dev/null \
      || annotate "$dir/script.json" "$id: script.json is not valid JSON"
  fi
done
[ "$FAILED" = 0 ] || { echo "Inputs incomplete; nothing rendered."; exit 1; }

# ---- 2. Stage episode assets into the Remotion public dir, bundle once -------------------
STAGE="video/public/episodes"
rm -rf "$STAGE" && mkdir -p "$STAGE"
for id in $IDS; do
  dir="${FOLDER[$id]}"
  mkdir -p "$STAGE/$id"
  # Everything the composition may reference via staticFile("episodes/<id>/..."), minus review output.
  (cd "$dir" && find . -path ./qa -prune -o -path ./render -prune -o -path ./meta -prune -o -type f -print0) \
    | (cd "$dir" && xargs -0 -r cp --parents -t "$ROOT/$STAGE/$id")
done

echo "Bundling Remotion project"
(cd video && npx --no-install remotion bundle src/index.ts --out-dir build --log=error) \
  || { echo "::error file=video/src/index.ts::remotion bundle failed"; exit 1; }

# ---- 3. Render, normalise, verify --------------------------------------------------------
for id in $IDS; do
  dir="${FOLDER[$id]}"
  script="$dir/script.json"
  comp="$(node scripts/episode_frames.mjs "$script" composition)"
  out="$dir/render"
  mkdir -p "$out"
  for p in $PLATFORMS; do
    props="$out/props-$p.json"
    python3 -c "import json,sys;json.dump({'script':json.load(open(sys.argv[1])),'platform':sys.argv[2]},open(sys.argv[3],'w'))" \
      "$script" "$p" "$props"
    file="$out/$id-$p.mp4"
    echo "Rendering $file ($comp, $p)"
    if ! (cd video && npx --no-install remotion render build "$comp" "$ROOT/$file" \
          --props="$ROOT/$props" \
          --codec=h264 --crf=18 --pixel-format=yuv420p --color-space=bt709 \
          --audio-codec=aac --audio-bitrate=192k --sample-rate=48000 --enforce-audio-track \
          --log=error); then
      annotate "$script" "$id-$p: remotion render failed (composition $comp)"
      continue
    fi
    if ! bash scripts/loudness.sh "$file"; then
      annotate "$script" "$id-$p: loudness normalisation failed (is the audio track silent?)"
      continue
    fi
    python3 scripts/verify_delivery.py "$file" --annotate "$script" || FAILED=1
    rm -f "$props"
  done
done
[ "$FAILED" = 0 ] || { echo "Render or verification failed; see the ::error annotations above."; exit 1; }

# ---- 4. Posting package -------------------------------------------------------------------
python3 scripts/build_posting.py "$BATCH_FILE" --episodes-dir "$EPISODES_DIR" --out "posting/$BATCH" \
  || { echo "::error file=$BATCH_FILE::building posting/$BATCH failed"; exit 1; }
ZIP="specimind-$BATCH.zip"
rm -f "$ZIP"
(cd posting && zip -q -r -0 "../$ZIP" "$BATCH")   # MP4s are already compressed; store only
ls -lh "$ZIP"

# ---- 5. Release ---------------------------------------------------------------------------
if [ "${NO_RELEASE:-0}" = "1" ]; then
  echo "NO_RELEASE=1: skipping the GitHub Release. Package: $ZIP"
  exit 0
fi
assets=("$ZIP")
size=$(stat -c %s "$ZIP")
if [ "$size" -gt 1900000000 ]; then   # Release assets max out at 2 GiB each
  echo "Zip is over 1.9 GB; attaching one zip per episode instead"
  assets=()
  for d in posting/"$BATCH"/*/; do
    n="specimind-$BATCH-$(basename "$d").zip"
    (cd "posting/$BATCH" && zip -q -r -0 "../../$n" "$(basename "$d")" POSTING.md posting-sheet.csv)
    assets+=("$n")
  done
fi
notes="posting/$BATCH/POSTING.md"
if gh release view "$BATCH" >/dev/null 2>&1; then
  echo "Release $BATCH exists; replacing its assets and notes"
  gh release upload "$BATCH" "${assets[@]}" --clobber && gh release edit "$BATCH" --notes-file "$notes" \
    || { echo "::error file=$BATCH_FILE::updating Release $BATCH failed"; exit 1; }
else
  gh release create "$BATCH" "${assets[@]}" --title "SPECIMIND $BATCH" --notes-file "$notes" \
    --target "${GITHUB_SHA:-$(git rev-parse HEAD)}" \
    || { echo "::error file=$BATCH_FILE::gh release create failed"; exit 1; }
fi
echo "Release $BATCH published"
