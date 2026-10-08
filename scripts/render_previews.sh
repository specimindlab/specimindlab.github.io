#!/usr/bin/env bash
# Render the review stills for one or more episodes (Playbook V, step 3).
#   scripts/render_previews.sh E001 [E002 ...]
# Stills land in episodes/<id>-<slug>/qa/stills/<frame>-<label>.png: frame 0, every beat boundary + 1 s,
# 25/50/75 % and the last frame (loop check), each rendered with platform "ig" (the busiest CTA).
# Also writes qa/stills/contact-sheet.png at phone size, to look at the whole episode in one image,
# the episode cover (Cover composition -> <episode>/cover.png, plus qa/stills/cover-360.png at
# phone size) and the captions file (<episode>/<id>.srt, scripts/make_srt.mjs).
# Used locally and by .github/workflows/preview.yml. EPISODES_DIR overrides the episodes folder.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
EPISODES_DIR="${EPISODES_DIR:-episodes}"
PLATFORM="${PREVIEW_PLATFORM:-ig}"
[ $# -gt 0 ] || { echo "usage: render_previews.sh E001 [E002 ...]"; exit 2; }
FAILED=0
for id in "$@"; do
  [[ "$id" =~ ^E[0-9]{3}$ ]] || { echo "::error::'$id' is not an episode id like E001"; exit 2; }
done

STAGE="video/public/episodes"
rm -rf "$STAGE" && mkdir -p "$STAGE"
for id in "$@"; do
  dir=$(ls -d "$EPISODES_DIR/$id"-*/ 2>/dev/null | head -1); dir="${dir%/}"
  [ -n "$dir" ] || { echo "::error::$id: no folder in $EPISODES_DIR"; FAILED=1; continue; }
  mkdir -p "$STAGE/$id"
  (cd "$dir" && find . -path ./qa -prune -o -path ./render -prune -o -path ./meta -prune -o -type f -print0) \
    | (cd "$dir" && xargs -0 -r cp --parents -t "$ROOT/$STAGE/$id")
done
(cd video && npx --no-install remotion bundle src/index.ts --out-dir build --log=error) || exit 1

for id in "$@"; do
  dir=$(ls -d "$EPISODES_DIR/$id"-*/ 2>/dev/null | head -1); dir="${dir%/}"
  [ -n "$dir" ] && [ -f "$dir/script.json" ] || { echo "::error::$id: script.json missing"; FAILED=1; continue; }
  comp=$(node scripts/episode_frames.mjs "$dir/script.json" composition)
  stills="$dir/qa/stills"; rm -rf "$stills"; mkdir -p "$stills"
  props="$(mktemp --suffix=.json)"
  python3 -c "import json,sys;json.dump({'script':json.load(open(sys.argv[1])),'platform':sys.argv[2]},open(sys.argv[3],'w'))" \
    "$dir/script.json" "$PLATFORM" "$props"
  while read -r frame label; do
    f="$stills/$(printf %04d "$frame")-$label.png"
    (cd video && npx --no-install remotion still build "$comp" "$ROOT/$f" --frame="$frame" --props="$props" --log=error) \
      || { echo "::error file=$dir/script.json::$id: still at frame $frame failed"; FAILED=1; }
  done < <(node scripts/episode_frames.mjs "$dir/script.json" review)
  (cd video && npx --no-install remotion still build Cover "$ROOT/$dir/cover.png" --frame=0 --props="$props" --log=error) \
    || { echo "::error file=$dir/script.json::$id: cover failed"; FAILED=1; }
  node scripts/make_srt.mjs "$dir/script.json" yt || FAILED=1
  rm -f "$props"
  if command -v ffmpeg >/dev/null && [ -f "$dir/cover.png" ]; then
    ffmpeg -hide_banner -loglevel error -y -i "$dir/cover.png" -vf scale=360:-1 "$stills/cover-360.png" || true
  fi
  if command -v ffmpeg >/dev/null && ls "$stills"/*.png >/dev/null 2>&1; then
    n=$(ls "$stills"/[0-9]*.png | wc -l); cols=$(( n < 6 ? n : 6 )); rows=$(( (n + cols - 1) / cols ))
    ffmpeg -hide_banner -loglevel error -y -pattern_type glob -i "$stills/[0-9]*.png" \
      -vf "scale=360:-1,tile=${cols}x${rows}:padding=8:color=0x151612" -frames:v 1 "$stills/contact-sheet.png" \
      || echo "contact sheet failed (stills are still there)"
  fi
  echo "$id: $(ls "$stills" | wc -l) files in $stills"
done
exit $FAILED
