#!/usr/bin/env python3
"""Stage the covers a Drawer episode recaps (render_previews.sh and render_batch.sh call this).

    python3 scripts/stage_drawer_covers.py <episode>/script.json <stage dir for that episode>

For a Drawer script, copies each code's cover (data/catalog.json `cover`) to
<stage>/covers/<code>.png, where the composition reads it. Other series: no-op. A code with no
cover fails loudly: the Drawer only recaps finished, published specimens.
"""
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
script = json.load(open(sys.argv[1]))
if script.get("composition") != "Drawer" or script.get("covers") is False:
    sys.exit(0)
stage = Path(sys.argv[2]) / "covers"
stage.mkdir(parents=True, exist_ok=True)
catalog = {e["code"]: e for e in json.load(open(ROOT / "data/catalog.json"))["specimens"]}
missing = []
for code in script.get("codes", []):
    cover = catalog.get(code, {}).get("cover")
    if not cover or not (ROOT / cover).is_file():
        missing.append(code)
        continue
    shutil.copy2(ROOT / cover, stage / f"{code}.png")
if missing:
    print(f"::error file={sys.argv[1]}::Drawer {script.get('code')}: no cover in data/catalog.json for {', '.join(missing)}")
    sys.exit(1)
