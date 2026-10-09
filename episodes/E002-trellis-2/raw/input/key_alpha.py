#!/usr/bin/env python3
"""How dragon-concept-alpha.png was made from dragon-concept.jpg (colour key, no AI, dragon pixels untouched).

    python3 episodes/E002-trellis-2/raw/input/key_alpha.py
Removes the cream paper and the red halftone disc behind the dragon; keeps components over 2000 px;
fills only specks under 400 px (halftone dots), never the large red gaps between wing and body.
"""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as nd

here = Path(__file__).resolve().parent
im = np.asarray(Image.open(here / "dragon-concept.jpg").convert("RGB")).astype(float)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
red = (r > 150) & (r - g > 50) & (r - b > 50)
cream = (r > 225) & (g > 225) & (b > 200)
fg = nd.binary_opening(~nd.binary_closing(red | cream, iterations=2), iterations=2)
lab, n = nd.label(fg)
sizes = nd.sum(fg, lab, range(1, n + 1))
keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > 2000])
holes = nd.binary_fill_holes(keep) & ~keep
hl, hn = nd.label(holes)
hs = nd.sum(holes, hl, range(1, hn + 1))
keep |= np.isin(hl, [i + 1 for i, s in enumerate(hs) if s < 400])
alpha = nd.gaussian_filter(keep.astype(float), 0.8) * 255
Image.fromarray(np.dstack([im, alpha]).clip(0, 255).astype(np.uint8), "RGBA").save(here / "dragon-concept-alpha.png")
