#!/usr/bin/env python3
"""Per-glyph metrics of the caption instance of Anybody (wdth 60, wght 850).

FitStack fits each caption line so its INK (not its advance box) spans the content width,
and stacks lines by real ascender/descender extents. Those need glyph bounds at the exact
variation the captions use, which the browser cannot report. Regenerate after changing the
font or the caption axes:

    pip install fonttools && python3 scripts/font_metrics.py
"""
import json
import pathlib
import sys

from fontTools.pens.boundsPen import BoundsPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
FONT = ROOT / "video/public/fonts/Anybody-VF.ttf"
OUT = ROOT / "video/src/system/caption-metrics.json"
AXES = {"wdth": 60, "wght": 850}
EXTRA = "‘’“”—–·…×→←₹€£$%&@#éèàçñüöäß°±"


def main() -> int:
    font = instantiateVariableFont(TTFont(FONT), AXES)
    upm = font["head"].unitsPerEm
    cmap = font.getBestCmap()
    gs = font.getGlyphSet()
    hmtx = font["hmtx"]
    os2 = font["OS/2"]
    glyphs = {}
    for ch in [chr(c) for c in range(32, 127)] + list(EXTRA):
        name = cmap.get(ord(ch))
        if name is None:
            continue
        adv, _ = hmtx[name]
        pen = BoundsPen(gs)
        gs[name].draw(pen)
        if pen.bounds is None:  # space
            glyphs[ch] = [round(adv / upm, 4), 0, 0, 0, 0]
            continue
        x0, y0, x1, y1 = pen.bounds
        # [advance, xMin (left bearing), xMax, yMin, yMax] in em
        glyphs[ch] = [round(v / upm, 4) for v in (adv, x0, x1, y0, y1)]
    data = {
        "axes": AXES,
        "capHeight": round(os2.sCapHeight / upm, 4),
        "xHeight": round(os2.sxHeight / upm, 4),
        "glyphs": glyphs,
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"{len(glyphs)} glyphs -> {OUT.relative_to(ROOT)} (capHeight {data['capHeight']})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
