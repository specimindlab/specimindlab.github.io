#!/usr/bin/env bash
# Two-pass EBU R128 loudness normalisation for a rendered MP4.
#   scripts/loudness.sh in.mp4 [out.mp4]      (in place when out is omitted)
# Target: -14 LUFS integrated, true peak -1 dBTP (aims at -1.5 for headroom, AAC adds a little), LRA 11.
#
# Chain: gain to -14 LUFS -> 4x-oversampled peak limiter (-2 dBTP, lower if the encode needs it)
#        -> loudnorm two-pass, linear -> AAC, then the encoded true peak is checked.
# The mix is a -24 LUFS bed with effects ~8 dB above it (scripts/make_sfx.py), so reaching -14 LUFS
# takes ~+8 to +9 dB and the tips of the transient effects would land above -1 dBTP. Without the
# limiter, loudnorm would fall back to its dynamic mode and ride the bed. The limiter only shaves
# those tips (the bed peaks below it by design); loudnorm then applies a single linear gain.
#
# Audio is re-encoded as AAC-LC 48 kHz stereo 192 kbps. The video stream is copied untouched,
# with only its bitstream header tagged: square pixels and BT.709 primaries/transfer/matrix
# (limited range), so no platform reinterprets the herbarium colour. Output keeps +faststart.
set -euo pipefail
IN="$1"; OUT="${2:-$1}"
I=-14; TP=-1.5; LRA=11
TP_CEILING=-1.2   # what the encoded file must meet (spec -1 dBTP, verify_delivery.py checks it)

loudnorm_json() { # loudnorm_json <filter-prefix> : first-pass measurement of IN through the prefix
  ffmpeg -hide_banner -nostats -i "$IN" -map 0:a:0 \
    -af "${1}loudnorm=I=$I:TP=$TP:LRA=$LRA:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p'
}
get() { echo "$1" | python3 -c "import sys,json;print(json.load(sys.stdin)['$2'])"; }

# Pass 0: how loud is the raw render?
raw=$(loudnorm_json "")
ri=$(get "$raw" input_i); rtp=$(get "$raw" input_tp)
if [ "$ri" = "-inf" ]; then
  echo "loudness.sh: $IN has a silent audio track; cannot normalise" >&2
  exit 3
fi
gain=$(python3 -c "print(f'{$I - $ri:.2f}')")

encode() { # encode <limit dBTP> -> writes $tmp, sets $mode
  local limit pre measure mi mtp mlra mth off summary
  limit=$(python3 -c "print(f'{10 ** ($1 / 20):.5f}')")
  pre="volume=${gain}dB,aresample=192000,alimiter=limit=$limit:attack=1:release=80:level=0:latency=1,aresample=48000,"
  # Pass 1: measure what the limiter hands to loudnorm.
  measure=$(loudnorm_json "$pre")
  mi=$(get "$measure" input_i); mtp=$(get "$measure" input_tp); mlra=$(get "$measure" input_lra)
  mth=$(get "$measure" input_thresh); off=$(get "$measure" target_offset)
  # Pass 2: linear loudnorm on the limited signal.
  if ! summary=$(ffmpeg -hide_banner -nostats -y -i "$IN" -map 0:v:0 -map 0:a:0 \
    -c:v copy \
    -bsf:v "h264_metadata=sample_aspect_ratio=1/1:colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0" \
    -af "${pre}loudnorm=I=$I:TP=$TP:LRA=$LRA:measured_I=$mi:measured_TP=$mtp:measured_LRA=$mlra:measured_thresh=$mth:offset=$off:linear=true:print_format=summary,aresample=48000" \
    -c:a aac -profile:a aac_low -b:a 192k -ar 48000 -ac 2 \
    -map_metadata -1 -metadata:s:v:0 rotate=0 \
    -movflags +faststart "$tmp" 2>&1); then
    echo "$summary" | tail -n 20 >&2
    rm -f "$tmp"
    exit 1
  fi
  mode=$(echo "$summary" | sed -n 's/^Normalization Type: *//p')
}
out_tp() { # true peak of the encoded AAC, as verify_delivery.py measures it
  ffmpeg -hide_banner -nostats -i "$tmp" -map 0:a:0 -af ebur128=peak=true -f null - 2>&1 \
    | sed -n '/Summary:/,$p' | sed -n 's/^ *Peak: *\(-\{0,1\}[0-9.inf]*\) dBFS.*/\1/p' | tail -n 1
}

# The AAC encoder can push a limited transient back up by 1-1.5 dB, so check the encoded file and
# tighten the limiter until the delivery really sits at or under the ceiling.
tmp="$(dirname "$OUT")/.loudnorm-$$.mp4"
for LIMIT_DB in -2.0 -2.75 -3.5 -4.5; do
  encode "$LIMIT_DB"
  tp=$(out_tp)
  python3 -c "import sys; sys.exit(0 if float('$tp') <= $TP_CEILING else 1)" && break
done
mv -f "$tmp" "$OUT"
shaved=$(python3 -c "print(f'{max(0.0, $rtp + $gain - $LIMIT_DB):.1f}')")
echo "loudness.sh: $OUT normalised (raw $ri LUFS / $rtp dBTP, gain ${gain} dB, limiter at ${LIMIT_DB} dBTP <= ${shaved} dB on peaks, loudnorm ${mode:-unknown}, out $tp dBTP)"
if [ "$mode" != "Linear" ]; then
  echo "loudness.sh: WARNING: loudnorm used ${mode:-unknown} mode (expected Linear); check the mix levels" >&2
fi
if ! python3 -c "import sys; sys.exit(0 if float('$tp') <= $TP_CEILING else 1)"; then
  echo "loudness.sh: WARNING: true peak $tp dBTP is over $TP_CEILING even with the limiter at $LIMIT_DB dBTP" >&2
fi
