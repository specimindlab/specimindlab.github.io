"""Derived stills for E005 from our own Goblin Tools capture (crops and scroll windows only; no edits)."""
from pathlib import Path
from PIL import Image

out = Path("derived"); out.mkdir(exist_ok=True)
X0, X1, WIN = 100, 1000, 380  # the list's text column only, so words stay readable

def scroll(src, name, frames, hold_top=3, hold_end=8):
    im = Image.open(src)
    H = im.height
    y0, y1 = 560, max(560, H - 800 - WIN)
    paths = []
    for k in range(hold_top + frames + hold_end):
        t = min(1.0, max(0.0, (k - hold_top) / max(1, frames - 1)))
        t = t * t * (3 - 2 * t)  # ease in-out
        y = round(y0 + (y1 - y0) * t)
        p = out / f"{name}-{k:02d}.jpg"
        im.crop((X0, y, X1, y + WIN)).save(p, quality=88)
        paths.append(str(p))
    return paths

seqs = {
    "s1": scroll("spice1-result.jpg", "s1", 12),
    "s3": scroll("spice3-result.jpg", "s3", 16),
    "s5": scroll("spice5-result.jpg", "s5", 22),
}
# hook: before (one line on the list) and after (the top of the 33-step list)
row = Image.open("spice1-result.jpg").crop((50, 590, 420, 650))  # the one task, as typed (before breaking it down)
card = Image.new("RGB", (600, 600), "white")
row = row.resize((560, round(60 * 560 / 370)), Image.LANCZOS)
card.paste(row, (20, (600 - row.height) // 2))
card.save(out / "before.jpg", quality=90)
Image.open("spice5-result.jpg").crop((60, 560, 1000, 1300)).save(out / "after.jpg", quality=90)
Image.open("spice3-result.jpg").crop((0, 120, 1080, 1620)).save(out / "intro.jpg", quality=90)
# the drift at level 5: inspect, repair, paint, door, lubricate
Image.open("spice5-result.jpg").crop((80, 2960, 1000, 3600)).save(out / "flaw.jpg", quality=90)
# the spice control at each level, on a portrait card so a cover crop keeps all of it
for s in (1, 3, 5):
    pep = Image.open(f"spice{s}-result.jpg").crop((830, 345, 1045, 460))
    card = Image.new("RGB", (600, 620), "white")
    pep = pep.resize((560, round(pep.height * 560 / pep.width)), Image.LANCZOS)
    card.paste(pep, (20, (620 - pep.height) // 2))
    card.save(out / f"spice{s}-control.jpg", quality=90)
import json
json.dump({k: [p for p in v] for k, v in seqs.items()}, open(out / "sequences.json", "w"), indent=1)
print({k: len(v) for k, v in seqs.items()})
