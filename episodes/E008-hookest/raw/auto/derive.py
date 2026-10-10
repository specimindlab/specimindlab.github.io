"""Derived stills for E008 from our own Hookest capture: crops only. Everything below the hook cards
(the page's 'similar hooks', other creators' videos) is never used."""
from pathlib import Path
from PIL import Image

im = Image.open("result.jpg")
out = Path("derived"); out.mkdir(exist_ok=True)
im.crop((40, 1010, 1160, 1270)).save(out / "topic.jpg", quality=90)            # what we typed
im.crop((0, 2200, 1200, 3190)).save(out / "hooks.jpg", quality=90)             # the 5 hooks
im.crop((0, 380, 1200, 960)).save(out / "header.jpg", quality=90)              # "Free ... Hook Generator", No signup
cards = {1: (2316, 2470), 2: (2492, 2644), 3: (2668, 2822), 4: (2844, 3000), 5: (3020, 3176)}
for k, (y0, y1) in cards.items():
    im.crop((40, y0 - 6, 1000, y1 + 6)).save(out / f"hook{k}.jpg", quality=92)
im.crop((40, 2306, 1000, 2832)).save(out / "hooks-top3.jpg", quality=92)   # hooks 1-3, for frame 0
print(sorted(p.name for p in out.iterdir()))
