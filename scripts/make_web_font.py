#!/usr/bin/env python3
"""Web subset of the brand font for the catalog site (site/build.mjs serves it from /brand).

Keeps both variation axes (wdth 50-150, wght 100-900) and the Latin characters the site prints,
compressed as WOFF2: about a third of the 200 KB TTF, so the first paint is not held back.
Regenerate after replacing brand/reference/Anybody-VF.ttf:

    pip install -r requirements.txt && python3 scripts/make_web_font.py
"""
import pathlib
import sys

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "brand/reference/Anybody-VF.ttf"
OUT = ROOT / "brand/reference/Anybody-VF-latin.woff2"
# Basic Latin, Latin-1 (incl. º for Nº), Latin Extended-A, and the typographic punctuation the site uses.
UNICODES = "U+0020-007E,U+00A0-00FF,U+0100-017F,U+2010-2027,U+2030-203A,U+20AC,U+20B9,U+2116,U+2122"


def main() -> int:
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["kern", "liga", "calt", "tnum", "lnum", "case"]
    opts.name_IDs = ["*"]  # keep the copyright and OFL notice in the file
    opts.notdef_outline = True
    opts.hinting = False
    font = TTFont(SRC)
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=subset.parse_unicodes(UNICODES))
    sub.subset(font)
    font.flavor = "woff2"
    font.save(OUT)
    print(f"{OUT.relative_to(ROOT)}: {OUT.stat().st_size // 1024} KB ({SRC.stat().st_size // 1024} KB source)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
