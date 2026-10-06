#!/usr/bin/env bash
# End-to-end check of the delivery pipeline with the E000 fixture (no Release is created).
#   scripts/smoke_test.sh            # all three platforms
#   ONLY_PLATFORMS=yt scripts/smoke_test.sh
# Proves: bundle, render flags, loudness.sh, verify_delivery.py, build_posting.py, zip, preview stills.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
FX=scripts/fixtures/episodes/E000-pipeline-check
mkdir -p video/public/_smoke
# A quiet two-note bed (A3 + E4) with a soft swell, so the loudness pass has something to measure.
ffmpeg -hide_banner -loglevel error -y \
  -f lavfi -i "sine=frequency=220:sample_rate=48000:duration=40" \
  -f lavfi -i "sine=frequency=329.63:sample_rate=48000:duration=40" \
  -filter_complex "[0][1]amix=inputs=2,volume='0.25+0.1*sin(2*PI*t/5)':eval=frame,aformat=channel_layouts=stereo" \
  video/public/_smoke/bed.wav
# The fixture's cover is its first frame.
props="$(mktemp --suffix=.json)"
python3 -c "import json,sys;json.dump({'script':json.load(open(sys.argv[1])),'platform':'yt'},open(sys.argv[2],'w'))" "$FX/script.json" "$props"
(cd video && npx --no-install remotion still src/index.ts PipelineCheck "$ROOT/$FX/cover.png" --frame=0 \
  --props="$props" --log=error)
rm -f "$props"
EPISODES_DIR=scripts/fixtures/episodes NO_RELEASE=1 bash scripts/render_batch.sh scripts/fixtures/batches/batch-smoke.json
EPISODES_DIR=scripts/fixtures/episodes bash scripts/render_previews.sh E000
echo "SMOKE TEST PASSED"
