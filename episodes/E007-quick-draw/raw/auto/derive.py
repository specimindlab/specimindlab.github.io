"""Derived frames for E007 from our own Quick Draw capture: the canvas with the game's status line,
plus the model's top guess underneath (crops of the same screenshot, stacked; nothing redrawn)."""
from pathlib import Path
from PIL import Image, ImageDraw

src = sorted(Path("frames").glob("*.jpg"))
out = Path("derived"); out.mkdir(exist_ok=True)
for p in src:
    im = Image.open(p)
    canvas = im.crop((56, 128, 844, 960))
    guess = im.crop((56, 1222, 844, 1303))
    c = Image.new("RGB", (788, 832 + 81), "white")
    c.paste(canvas, (0, 0)); c.paste(guess, (0, 832))
    c.save(out / p.name, quality=88)
print(len(src))
