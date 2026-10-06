#!/usr/bin/env python3
"""Create episode folders from data/calendar.csv.

    python3 scripts/new_episode.py E001            # one episode
    python3 scripts/new_episode.py E001 E002 E005  # several
    python3 scripts/new_episode.py --next 10       # next 10 rows whose Status is not Rendered/Posted
    python3 scripts/new_episode.py E059 --slug lumafield --force   # rename-safe re-scaffold

Creates episodes/<id>-<slug>/ with:
    brief.json      the calendar row, normalised (never overwritten without --force)
    README.md       capture checklist for the human, built from 'The test' and 'Free path'
    raw/.gitkeep    the human's uploads land here (via github.com)
    raw/input/      the exact input for the test (photo, sketch, prompt text)

Idempotent: an existing folder for the id is reused (found by episodes/<id>-*), and
existing files are left alone unless --force is given.
"""
import argparse
import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CAL = ROOT / "data" / "calendar.csv"
EPISODES = ROOT / "episodes"
REPO = "specimindlab/specimindlab.github.io"
HUB = "https://specimindlab.github.io"

SERIES = {
    "Field Specimen": ("FS", "FieldSpecimen"),
    "Free Range": ("FR", "FreeRange"),
    "Rare Sighting": ("RS", "RareSighting"),
    "Plate": ("PL", "Plate"),
    "Field Sketch": ("SK", "FieldSketch"),
    "Mimicry": ("MI", "Mimicry"),
    "Dissection": ("DS", "Dissection"),
    "The Drawer": ("DR", "Drawer"),
    "Extinction Watch": ("EX", "ExtinctionWatch"),
}
NO_CAPTURE_SERIES = {"Field Sketch", "The Drawer", "Extinction Watch"}


def slugify(text, limit=40):
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s[:limit].rstrip("-") or "episode"


def default_slug(row):
    tools = row["Tool(s)"]
    if tools.lower().startswith(("pick from", "see test", "this week")):
        return slugify(row["Series"])
    return slugify(tools)


def split_tools(tools):
    if tools.lower().startswith(("pick from", "see test", "this week")):
        return []
    return [t.strip() for t in re.split(r"\s+vs\.?\s+|,|\s\+\s|\s→\s", tools) if t.strip()]


def disclosure(label):
    """'Affiliate' / 'Unpaid' are final; anything conditional stays pending until research decides."""
    l = label.strip().lower()
    if l == "affiliate":
        return "Affiliate"
    if l.startswith("unpaid"):
        return "Unpaid"
    return "pending"


def mode(row):
    m = row["Mode"].strip()
    if m.lower().startswith("field sketch"):
        return "Field sketch"
    if m.lower().startswith("live"):
        return "Live specimen"
    return m  # e.g. "Built from the week's renders"


def load_calendar():
    with CAL.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def find_folder(eid):
    hits = sorted(EPISODES.glob(f"{eid}-*"))
    return hits[0] if hits else None


def brief(row, slug):
    series_code, composition = SERIES.get(row["Series"], ("??", "Unknown"))
    code = row["Code"]
    return {
        "id": row["Episode"],
        "slug": slug,
        "code": code,
        "series": row["Series"],
        "series_code": series_code,
        "composition": composition,
        "mode": mode(row),
        "tools": split_tools(row["Tool(s)"]),
        "tools_raw": row["Tool(s)"],
        "pillar": row["Pillar"],
        "phase": row["Phase"],
        "day": int(row["Day"]) if row["Day"].isdigit() else row["Day"],
        "date": row["Date"],
        "weekday": row["Weekday"],
        "slot": row["Slot"],
        "post_time_ist": row["Post time (IST)"],
        "draft_hook": row["Draft hook (rewrite after test)"],
        "the_test": row["The test"],
        "free_path": row["Free path"],
        "free_path_note": "From the calendar; re-verify in research.md before filming.",
        "affiliate_status": row["Affiliate status"],
        "on_screen_label": row["On-screen label"],
        "disclosure": disclosure(row["On-screen label"]),
        "youtube_title_draft": row["YouTube title (draft)"],
        "hashtags": row["Hashtags"].split(),
        "hub_url": f"{HUB}/{code}" if code != "TBD" else None,
        "capture": "not needed" if row["Series"] in NO_CAPTURE_SERIES else "pending",
    }


def readme(b, folder):
    rel = folder.relative_to(ROOT).as_posix()
    upload = f"https://github.com/{REPO}/upload/main/{rel}/raw"
    inputs = f"https://github.com/{REPO}/tree/main/{rel}/raw/input"
    tools = ", ".join(b["tools"]) or b["tools_raw"]
    lines = [
        f"# {b['id']} · {b['code']} · {tools}",
        "",
        f"**Series:** {b['series']} ({b['series_code']}) · **Mode:** {b['mode']} · **Pillar:** {b['pillar']} · "
        f"**Planned post:** {b['date']} {b['post_time_ist']} IST (slot {b['slot']})",
        "",
        f"**The test:** {b['the_test']}",
        "",
        f"**Free path (from the calendar, unverified):** {b['free_path']}",
        "",
        f"**Draft hook (rewrite after the test):** {b['draft_hook']}",
        "",
    ]
    if b["capture"] == "not needed":
        lines += [
            "## Capture",
            "",
            f"No hands-on capture is needed: {b['series']} is built from research and the catalog. "
            "Never show generated output as if we made it.",
            "",
        ]
    else:
        lines += [
            "## Capture checklist (one attempt only)",
            "",
            f"- [ ] Download the exact input from [raw/input/]({inputs}). If it is empty, prepare the input the test describes "
            f"(\"{b['the_test']}\") and upload it to raw/input/ first, so the test can be repeated.",
            f"- [ ] Open {tools} on the free plan described here: {b['free_path']}. Do not use a paid plan or trial credits "
            "unless the brief says so.",
            "- [ ] OBS: Settings → Output → Output mode: Advanced → Recording: encoder x264, rate control CBR, bitrate 2500 Kbps; "
            "Settings → Video: 1920×1080 canvas, 30 fps. This keeps a 60 s recording under GitHub's 25 MB upload limit.",
            "- [ ] Start recording **before** you click Generate. Do not cut anything; we measure seconds to result from the recording.",
            "- [ ] Use the tool's default settings unless the test says otherwise. Note any setting you changed.",
            "- [ ] Stop recording when the finished result is fully visible (for 3D, rotate it once in the viewer).",
            "- [ ] Download the result in its native format (MP4 / PNG / GLB / WAV) without editing it.",
            "- [ ] If you needed more than one attempt, write how many in raw/notes.txt (the Conditions card must say so).",
            "- [ ] Write in raw/notes.txt anything a viewer cannot see: queue time, credits used, credits left, any error.",
            "",
            "### Files to upload",
            "",
            f"Drag them onto **[{rel}/raw]({upload})** and click *Commit changes* (25 MB per file):",
            "",
            f"- `{b['id']}-screen.mp4`: the OBS recording",
            f"- `{b['id']}-result.<ext>`: the downloaded result (several tools: `{b['id']}-result-<tool>.<ext>`)",
            "- `notes.txt`: attempts, credits used / left, anything unusual",
            "",
        ]
    lines += [
        "## Files in this folder (created by the playbooks)",
        "",
        "`brief.json` (calendar row) · `research.md` + `facts.json` (Playbook R) · `script.json`, `cover.png`, "
        f"`{b['id']}.srt`, `qa/` (Playbook V) · `meta/` (Playbook P) · `raw/` (your uploads).",
        "",
    ]
    return "\n".join(lines)


def write(path, text, force):
    if path.exists() and not force:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    return True


def scaffold(row, slug=None, force=False):
    eid = row["Episode"]
    folder = find_folder(eid)
    if folder is None:
        folder = EPISODES / f"{eid}-{slug or default_slug(row)}"
    elif slug and folder.name != f"{eid}-{slug}":
        new = EPISODES / f"{eid}-{slug}"
        folder.rename(new)
        folder = new
    slug = folder.name[len(eid) + 1:]
    b = brief(row, slug)
    made = []
    if write(folder / "brief.json", json.dumps(b, indent=2, ensure_ascii=False) + "\n", force):
        made.append("brief.json")
    if write(folder / "README.md", readme(b, folder), force):
        made.append("README.md")
    for keep in ("raw/.gitkeep", "raw/input/.gitkeep"):
        if write(folder / keep, "", False):
            made.append(keep)
    print(f"{folder.relative_to(ROOT)}: {'created ' + ', '.join(made) if made else 'already complete'}")
    return folder


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("ids", nargs="*", help="episode ids such as E001")
    ap.add_argument("--next", type=int, help="scaffold the next N rows whose Status is not Rendered or Posted")
    ap.add_argument("--slug", help="folder slug (only with a single id)")
    ap.add_argument("--force", action="store_true", help="overwrite brief.json and README.md")
    a = ap.parse_args()
    rows = load_calendar()
    by_id = {r["Episode"]: r for r in rows}
    if a.slug and len(a.ids) != 1:
        sys.exit("--slug needs exactly one episode id")
    targets = []
    for eid in a.ids:
        eid = eid.upper()
        if eid not in by_id:
            sys.exit(f"{eid} is not in data/calendar.csv")
        targets.append(by_id[eid])
    if a.next:
        targets += [r for r in rows if r["Status"] not in ("Rendered", "Posted")][: a.next]
    if not targets:
        ap.print_help()
        sys.exit(1)
    for r in targets:
        scaffold(r, slugify(a.slug) if a.slug else None, a.force)


if __name__ == "__main__":
    main()
