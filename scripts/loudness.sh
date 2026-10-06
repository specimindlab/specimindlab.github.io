#!/usr/bin/env bash
# Two-pass EBU R128 loudness normalisation for a rendered MP4.
#   scripts/loudness.sh in.mp4 [out.mp4]      (in place when out is omitted)
# Target: -14 LUFS integrated, true peak -1 dBTP (aims at -1.5 for headroom), LRA 11.
# Audio is re-encoded as AAC-LC 48 kHz stereo 192 kbps. The video stream is copied untouched,
# with only its bitstream header tagged: square pixels and BT.709 primaries/transfer/matrix
# (limited range), so no platform reinterprets the herbarium colour. Output keeps +faststart.
set -euo pipefail
IN="$1"; OUT="${2:-$1}"
I=-14; TP=-1.5; LRA=11

measure=$(ffmpeg -hide_banner -nostats -i "$IN" -map 0:a:0 \
  -af "loudnorm=I=$I:TP=$TP:LRA=$LRA:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { echo "$measure" | python3 -c "import sys,json;print(json.load(sys.stdin)['$1'])"; }
mi=$(get input_i); mtp=$(get input_tp); mlra=$(get input_lra); mth=$(get input_thresh); off=$(get target_offset)

if [ "$mi" = "-inf" ]; then
  echo "loudness.sh: $IN has a silent audio track; cannot normalise" >&2
  exit 3
fi

tmp="$(dirname "$OUT")/.loudnorm-$$.mp4"
ffmpeg -hide_banner -loglevel error -y -i "$IN" -map 0:v:0 -map 0:a:0 \
  -c:v copy \
  -bsf:v "h264_metadata=sample_aspect_ratio=1/1:colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0" \
  -af "loudnorm=I=$I:TP=$TP:LRA=$LRA:measured_I=$mi:measured_TP=$mtp:measured_LRA=$mlra:measured_thresh=$mth:offset=$off:linear=true:print_format=summary,aresample=48000" \
  -c:a aac -profile:a aac_low -b:a 192k -ar 48000 -ac 2 \
  -map_metadata -1 -metadata:s:v:0 rotate=0 \
  -movflags +faststart "$tmp"
mv -f "$tmp" "$OUT"
echo "loudness.sh: $OUT normalised (measured $mi LUFS, $mtp dBTP)"
