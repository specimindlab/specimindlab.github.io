#!/usr/bin/env python3
"""Fail if anything but paper is drawn in the zones that belong to platform UI.

    python3 scripts/check_safe_zones.py <still.png | dir> [...]

Zones (1080x1920, CLAUDE.md): bottom 480 px (y >= 1440) for every element, and x >= 1010 for
every element (output plates may reach 1010, text stops at 930; text in 930..1010 needs eyes).
A pixel counts as paper when every channel is within TOL of herbarium #D8DCCD (the grain is 5 %).
"""
import pathlib
import subprocess
import sys

import numpy as np

W, H = 1080, 1920
PAPER = np.array([0xD8, 0xDC, 0xCD], dtype=np.int16)
TOL = 40  # grain specks stay under ~30; ink, red and steel are 60-200 away


def load(path: pathlib.Path) -> np.ndarray | None:
    raw = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-i", str(path), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        check=True, capture_output=True).stdout
    arr = np.frombuffer(raw, np.uint8)
    if arr.size != W * H * 3:
        return None
    return arr.reshape(H, W, 3).astype(np.int16)


def check(path: pathlib.Path) -> list[str]:
    img = load(path)
    if img is None:
        return []  # not a full frame (crops, contact sheets)
    off = np.abs(img - PAPER).max(axis=2) > TOL
    problems = []
    for name, zone in (("bottom 480 px", off[1440:, :]), ("right of x 1010", off[:, 1010:])):
        n = int(zone.sum())
        if n > 20:  # a few anti-aliased pixels are not an element
            ys, xs = np.nonzero(zone)
            y0 = ys.min() + (1440 if name.startswith("bottom") else 0)
            x0 = xs.min() + (0 if name.startswith("bottom") else 1010)
            problems.append(f"{path.name}: {n} px drawn in {name} (first at x={x0}, y={y0})")
    return problems


def main(args: list[str]) -> int:
    files = []
    for a in args:
        p = pathlib.Path(a)
        files += sorted(p.rglob("*.png")) if p.is_dir() else [p]
    files = [f for f in files if "sheet" not in f.name]
    problems = [m for f in files for m in check(f)]
    for m in problems:
        print(m)
    print(f"{len(files)} stills checked, {len(problems)} problems")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
