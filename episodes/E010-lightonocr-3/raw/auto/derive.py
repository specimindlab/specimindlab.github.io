"""Derived stills for E010 from our own LightOnOCR-3 capture and our input photo (crops only)."""
from pathlib import Path
from PIL import Image

out = Path("derived"); out.mkdir(exist_ok=True)
doc = Image.open("result-document.jpg")      # 2560x2000 screenshot, Document view
blocks = Image.open("result-blocks.jpg")     # Blocks view: photo with the box it found
note = Image.open("../input/handwritten-note.jpg")  # 2400x3200, the photo we gave it
doc.crop((1645, 320, 2470, 690)).save(out / "read-text.jpg", quality=92)          # what it read
blocks.crop((660, 300, 2500, 1460)).save(out / "blocks.jpg", quality=90)          # photo + box + text card
blocks.crop((40, 60, 620, 1180)).save(out / "sidebar.jpg", quality=90)            # LightOn OCR-3 panel
note.crop((400, 620, 2180, 1900)).save(out / "note.jpg", quality=92)              # the written part of the card
note.crop((400, 1300, 2000, 1900)).save(out / "note-end.jpg", quality=92)         # "He was a very pretty / Ginger Tom."
print(sorted(p.name for p in out.iterdir()))
