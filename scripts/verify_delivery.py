#!/usr/bin/env python3
"""Verify one delivery MP4 against the SPECIMIND spec (YouTube Shorts, Instagram Reels, X).

    python3 scripts/verify_delivery.py file.mp4 [--annotate episodes/E001-x/script.json]

Prints one line per failed check. With --annotate, failures are printed as GitHub
annotations (::error file=...::reason) so they are readable through the REST API.
Exit code 0 = every check passed.
"""
import argparse
import json
import os
import re
import subprocess
import sys

SPEC = {
    "width": 1080,
    "height": 1920,
    "fps": "30/1",
    "codec": "h264",
    "profile": "High",
    "pix_fmt": "yuv420p",
    "color": "bt709",
    "acodec": "aac",
    "aprofile": "LC",
    "rate": 48000,
    "channels": 2,
    "min_s": 18.0,
    "max_s": 60.5,
    "max_mb": 100.0,
    "lufs": -14.0,
    "lufs_tol": 1.0,
    "max_tp": -1.0,
}


def probe(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-print_format", "json", "-show_format", "-show_streams", path],
        capture_output=True, text=True, check=True,
    ).stdout
    return json.loads(out)


def loudness(path):
    err = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-map", "0:a:0",
         "-af", "ebur128=peak=true", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    summary = err[err.rfind("Summary:"):]
    i = re.search(r"I:\s+(-?[\d.]+|-inf) LUFS", summary)
    tp = re.search(r"True peak:\s+Peak:\s+(-?[\d.]+|-inf) dBFS", summary)
    return (float(i.group(1)) if i else None, float(tp.group(1)) if tp else None)


def check(path):
    fails = []
    def want(ok, msg):
        if not ok:
            fails.append(msg)

    name = os.path.basename(path)
    try:
        info = probe(path)
    except subprocess.CalledProcessError as e:
        return [f"{name}: ffprobe failed: {e.stderr.strip()[:200]}"]
    v = next((s for s in info["streams"] if s["codec_type"] == "video"), None)
    a = next((s for s in info["streams"] if s["codec_type"] == "audio"), None)
    if v is None:
        return [f"{name}: no video stream"]
    want(a is not None, f"{name}: no audio stream")

    want(v.get("width") == SPEC["width"] and v.get("height") == SPEC["height"],
         f"{name}: size {v.get('width')}x{v.get('height')}, want 1080x1920")
    sar = v.get("sample_aspect_ratio", "1:1")
    want(sar in ("1:1",), f"{name}: sample aspect ratio {sar}, want 1:1 (square pixels)")
    rot = [sd.get("rotation") for sd in v.get("side_data_list", []) if "rotation" in sd]
    rot_tag = v.get("tags", {}).get("rotate")
    want(not any(rot) and rot_tag in (None, "0"), f"{name}: rotation metadata present ({rot or rot_tag})")
    want(v.get("r_frame_rate") == SPEC["fps"] and v.get("avg_frame_rate") == SPEC["fps"],
         f"{name}: frame rate r={v.get('r_frame_rate')} avg={v.get('avg_frame_rate')}, want constant 30/1")
    want(v.get("codec_name") == SPEC["codec"], f"{name}: video codec {v.get('codec_name')}, want h264")
    want(v.get("profile") == SPEC["profile"], f"{name}: H.264 profile {v.get('profile')}, want High")
    want(v.get("pix_fmt") == SPEC["pix_fmt"], f"{name}: pixel format {v.get('pix_fmt')}, want yuv420p")
    for key in ("color_space", "color_primaries", "color_transfer"):
        want(v.get(key) == SPEC["color"], f"{name}: {key} {v.get(key)}, want bt709")
    want(v.get("color_range") in ("tv", None), f"{name}: color range {v.get('color_range')}, want tv (limited)")

    if a is not None:
        want(a.get("codec_name") == SPEC["acodec"] and a.get("profile") == SPEC["aprofile"],
             f"{name}: audio {a.get('codec_name')}/{a.get('profile')}, want aac/LC")
        want(int(a.get("sample_rate", 0)) == SPEC["rate"], f"{name}: audio {a.get('sample_rate')} Hz, want 48000")
        want(a.get("channels") == SPEC["channels"], f"{name}: {a.get('channels')} audio channels, want 2")

    dur = float(info["format"].get("duration", 0))
    want(SPEC["min_s"] <= dur <= SPEC["max_s"], f"{name}: duration {dur:.2f} s, want 18-60 s")
    mb = os.path.getsize(path) / 1e6
    want(mb < SPEC["max_mb"], f"{name}: {mb:.1f} MB, want under 100 MB")

    with open(path, "rb") as f:
        head = f.read(1 << 16)
    moov, mdat = head.find(b"moov"), head.find(b"mdat")
    want(moov != -1 and (mdat == -1 or moov < mdat), f"{name}: moov atom is not at the start (+faststart missing)")

    if a is not None:
        i, tp = loudness(path)
        want(i is not None and abs(i - SPEC["lufs"]) <= SPEC["lufs_tol"],
             f"{name}: integrated loudness {i} LUFS, want -14 ±1")
        want(tp is not None and tp <= SPEC["max_tp"], f"{name}: true peak {tp} dBTP, want ≤ -1")
        print(f"ok-info {name}: {dur:.2f} s, {mb:.1f} MB, {i} LUFS, {tp} dBTP")
    return fails


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="+")
    ap.add_argument("--annotate", help="repo path used in ::error file=...:: annotations")
    a = ap.parse_args()
    bad = 0
    for path in a.files:
        for msg in check(path):
            bad += 1
            if a.annotate:
                print(f"::error file={a.annotate}::{msg}")
            else:
                print(f"FAIL {msg}")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
