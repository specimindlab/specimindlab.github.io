#!/usr/bin/env python3
"""Calendar rows are plans; episode numbers are given out in release order.

    python3 scripts/new_episode.py make R002 [--slug hunyuan3d]   # make an episode from a calendar row
    python3 scripts/new_episode.py capture R001 [R004 ...]         # a capture request: no number used
    python3 scripts/new_episode.py next 10                         # the next rows not made yet
    python3 scripts/new_episode.py status Rendered E005 E006       # set Status (rows or episode ids)

Why: viewers see the numbers (#001, #002 ...). If Tripo waits for a screen recording, the next video
must still be #001, not #002, or the numbers on screen have gaps. So:

- `data/calendar.csv` lists plans by Row (R001 ...). Its Episode and Code columns stay empty until
  the video is made.
- `make` gives the row the next free episode id (E001, E002 ... in the order videos are made) and the
  next catalog code for its kind (### for single tools, P## head-to-head, M## AI-or-real, D## workflow,
  W## roundup, X## shut down). It creates episodes/<E###>-<slug>/ with brief.json and README.md,
  moves any uploads waiting in captures/<R###>-*/raw/ into the episode's raw/, and writes the id and
  code back into the calendar row. Once given, a number is never changed or reused.
- `capture` creates captures/<R###>-<slug>/ with the capture checklist for the human (README.md) and
  raw/ for the uploads. It uses no episode number.
"""
import argparse
import csv
import io
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CAL = ROOT / "data" / "calendar.csv"
EPISODES = ROOT / "episodes"
CAPTURES = ROOT / "captures"
CATALOG = ROOT / "data" / "catalog.json"
REPO = "specimindlab/specimindlab.github.io"
HUB = "https://specimindlab.github.io"

SERIES = {
    "Field Specimen": ("FS", "FieldSpecimen", ""),
    "Free Range": ("FR", "FreeRange", ""),
    "Rare Sighting": ("RS", "RareSighting", ""),
    "Plate": ("PL", "Plate", "P"),
    "Field Sketch": ("SK", "FieldSketch", ""),
    "Mimicry": ("MI", "Mimicry", "M"),
    "Dissection": ("DS", "Dissection", "D"),
    "The Drawer": ("DR", "Drawer", "W"),
    "Extinction Watch": ("EX", "ExtinctionWatch", "X"),
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
    return m


# ---- calendar (CRLF, as exported from the xlsx) -------------------------------------------------

def load_calendar():
    raw = CAL.read_bytes().decode("utf-8")
    rows = list(csv.DictReader(io.StringIO(raw, newline="")))
    return rows, list(rows[0].keys()) if rows else []


def save_calendar(rows, fields):
    buf = io.StringIO(newline="")
    w = csv.DictWriter(buf, fieldnames=fields, lineterminator="\r\n")
    w.writeheader()
    w.writerows(rows)
    CAL.write_bytes(buf.getvalue().encode("utf-8"))


# ---- numbering ----------------------------------------------------------------------------------

def made_briefs():
    out = []
    for d in sorted(EPISODES.glob("E[0-9][0-9][0-9]-*")):
        p = d / "brief.json"
        if p.exists():
            out.append((d, json.loads(p.read_text(encoding="utf-8"))))
    return out


def next_episode_id():
    nums = [int(d.name[1:4]) for d in EPISODES.glob("E[0-9][0-9][0-9]-*")]
    return f"E{(max(nums) + 1) if nums else 1:03d}"


def next_code(prefix):
    used = set()
    if CATALOG.exists():
        cat = json.loads(CATALOG.read_text(encoding="utf-8"))
        used |= {e.get("code", "") for e in cat.get("specimens", []) + cat.get("groups", [])}
    used |= {b.get("code", "") for _, b in made_briefs()}
    if prefix:
        nums = [int(c[1:]) for c in used if re.fullmatch(rf"{prefix}\d\d", c or "")]
        return f"{prefix}{(max(nums) + 1) if nums else 1:02d}"
    nums = [int(c) for c in used if re.fullmatch(r"\d{3}", c or "")]
    return f"{(max(nums) + 1) if nums else 1:03d}"


def brief(row, eid, code, slug):
    series_code, composition, _ = SERIES.get(row["Series"], ("??", "Unknown", ""))
    return {
        "id": eid,
        "row": row["Row"],
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
        "draft_hook": row["Draft hook (rewrite after test)"],
        "the_test": row["The test"],
        "free_path": row["Free path"],
        "free_path_note": "From the calendar; re-verify in research.md before filming.",
        "affiliate_status": row["Affiliate status"],
        "on_screen_label": row["On-screen label"],
        "disclosure": disclosure(row["On-screen label"]),
        "hashtags": row["Hashtags"].split(),
        "hub_url": f"{HUB}/{code}" if code else None,
        "capture": "not needed" if row["Series"] in NO_CAPTURE_SERIES else "pending",
    }


def capture_readme(row, folder):
    rel = folder.relative_to(ROOT).as_posix()
    upload = f"https://github.com/{REPO}/upload/main/{rel}/raw"
    inputs = f"https://github.com/{REPO}/tree/main/{rel}/raw/input"
    tools = ", ".join(split_tools(row["Tool(s)"])) or row["Tool(s)"]
    return "\n".join([
        f"# Capture request {row['Row']} · {tools}",
        "",
        f"**Planned as:** {row['Series']} · {row['Pillar']} · **The test:** {row['The test']}",
        "",
        f"**Free plan to use (from the calendar, check on the day):** {row['Free path']}",
        "",
        "This folder holds no episode number. When your files are here, the next batch makes the video and",
        "gives it the next free number, so episodes are always numbered in the order they come out.",
        "",
        "## Capture checklist (one attempt only)",
        "",
        f"- [ ] Put the exact input in [raw/input/]({inputs}) first (the photo, sketch or prompt text), so the test can be repeated.",
        f"- [ ] Open {tools} on the free plan. No paid plan, no trial credits.",
        "- [ ] OBS: Settings → Output → Output mode: Advanced → Recording: encoder x264, rate control CBR, bitrate 2500 Kbps; "
        "Settings → Video: 1920×1080 canvas, 30 fps (keeps 60 s under GitHub's 25 MB upload limit).",
        "- [ ] Start recording **before** you click Generate. One attempt, default settings; note any setting you change.",
        "- [ ] Stop when the finished result is fully visible (for 3D, rotate it once in the viewer).",
        "- [ ] Download the result in its own format (MP4 / PNG / GLB / WAV) without editing it.",
        "- [ ] Write `raw/notes.txt`: attempts, credits used and left, queue time, anything unusual.",
        "",
        "### Files to upload",
        "",
        f"Drag them onto **[{rel}/raw]({upload})** and click *Commit changes* (25 MB per file):",
        "`screen.mp4` (the OBS recording), `result.<ext>` (the download; several tools: `result-<tool>.<ext>`), `notes.txt`.",
        "",
    ])


def episode_readme(b, folder):
    tools = ", ".join(b["tools"]) or b["tools_raw"]
    return "\n".join([
        f"# {b['id']} · #{b['code']} · {tools}",
        "",
        f"**From calendar row:** {b['row']} · **Series:** {b['series']} · **Mode:** {b['mode']} · **Pillar:** {b['pillar']}",
        "",
        f"**The test:** {b['the_test']}",
        "",
        "Files: `brief.json` (calendar row + the number given at release) · `research.md` + `facts.json` (Playbook R) · "
        f"`script.json`, `cover.png`, `{b['id']}.srt`, `qa/` (Playbook V) · `meta/` (Playbook P) · `raw/` (captures).",
        "",
    ])


def write(path, text, force=False):
    if path.exists() and not force:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    return True


def find_row(rows, rid):
    rid = rid.upper()
    for r in rows:
        if r["Row"] == rid:
            return r
    sys.exit(f"{rid} is not a Row in data/calendar.csv")


def capture(rows, rid, slug=None):
    row = find_row(rows, rid)
    hits = sorted(CAPTURES.glob(f"{row['Row']}-*"))
    folder = hits[0] if hits else CAPTURES / f"{row['Row']}-{slug or default_slug(row)}"
    made = []
    if write(folder / "README.md", capture_readme(row, folder)):
        made.append("README.md")
    for keep in ("raw/.gitkeep", "raw/input/.gitkeep"):
        if write(folder / keep, ""):
            made.append(keep)
    print(f"{folder.relative_to(ROOT)}: {'created ' + ', '.join(made) if made else 'already there'}")
    return folder


def make(rows, fields, rid, slug=None):
    row = find_row(rows, rid)
    if row.get("Episode"):
        d = sorted(EPISODES.glob(f"{row['Episode']}-*"))
        print(f"{rid} is already {row['Episode']} ({d[0].relative_to(ROOT) if d else 'folder missing'})")
        return d[0] if d else None
    eid = next_episode_id()
    prefix = SERIES.get(row["Series"], ("", "", ""))[2]
    code = next_code(prefix)
    slug = slug or default_slug(row)
    folder = EPISODES / f"{eid}-{slug}"
    b = brief(row, eid, code, slug)
    write(folder / "brief.json", json.dumps(b, indent=2, ensure_ascii=False) + "\n", True)
    write(folder / "README.md", episode_readme(b, folder), True)
    (folder / "raw" / "input").mkdir(parents=True, exist_ok=True)
    moved = 0
    for cap in sorted(CAPTURES.glob(f"{row['Row']}-*")):
        src = cap / "raw"
        if src.is_dir():
            for f in src.rglob("*"):
                if f.is_file() and f.name != ".gitkeep":
                    dest = folder / "raw" / f.relative_to(src)
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(f), dest)
                    moved += 1
        shutil.rmtree(cap)
    row["Episode"], row["Code"] = eid, code
    save_calendar(rows, fields)
    print(f"{rid} -> {eid} #{code}: {folder.relative_to(ROOT)}" + (f" ({moved} uploaded files moved in)" if moved else ""))
    return folder


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    m = sub.add_parser("make")
    m.add_argument("rows", nargs="+")
    m.add_argument("--slug")
    c = sub.add_parser("capture")
    c.add_argument("rows", nargs="+")
    c.add_argument("--slug")
    n = sub.add_parser("next")
    n.add_argument("count", type=int)
    st = sub.add_parser("status")
    st.add_argument("value", choices=["Planned", "Rendered", "Posted"])
    st.add_argument("ids", nargs="+", help="R### rows, E### episode ids or codes (005, #005, W01)")
    a = ap.parse_args()
    rows, fields = load_calendar()
    if a.cmd == "status":
        for i in (x.upper().lstrip("#") for x in a.ids):
            hit = [r for r in rows if i in (r["Row"], r.get("Episode") or "-", r.get("Code") or "-")]
            if not hit:
                sys.exit(f"{i}: no calendar row with that Row or Episode")
            for r in hit:
                r["Status"] = a.value
                print(f"{r['Row']} ({r.get('Episode') or 'not made'}): Status = {a.value}")
        save_calendar(rows, fields)
        return
    if a.cmd == "next":
        todo = [r for r in rows if not r.get("Episode") and r["Status"] not in ("Rendered", "Posted")][: a.count]
        for r in todo:
            cap = sorted(CAPTURES.glob(f"{r['Row']}-*"))
            raw = cap[0] / "raw" if cap else None
            has = raw and any(f.is_file() and f.name != ".gitkeep" and f.relative_to(raw).parts[0] != "input" for f in raw.rglob("*"))
            note = "uploads waiting: make it first" if has else ("waiting for the human's recording: skip" if cap else "")
            print(f"{r['Row']}  {r['Series']:<16} {r['Tool(s)'][:40]:<40} {note}")
        return
    if getattr(a, "slug", None) and len(a.rows) != 1:
        sys.exit("--slug needs exactly one row")
    for rid in a.rows:
        if a.cmd == "make":
            make(rows, fields, rid, slugify(a.slug) if a.slug else None)
        else:
            capture(rows, rid, slugify(a.slug) if getattr(a, "slug", None) else None)


if __name__ == "__main__":
    main()
