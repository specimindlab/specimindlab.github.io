#!/usr/bin/env python3
"""Write data/batches/<batch>.json from the episodes' meta/*.md, with posting slots and order checks.

    python3 scripts/make_batch_file.py E005 E006 E007 [--batch batch-2026-10-21] [--note "..."] [--dry-run]
    python3 scripts/make_batch_file.py --refresh batch-2026-10-19     # re-read meta/ into an existing
                                                                      # batch file; slots and order stay

- Order: the order given, adjusted so no two research-only videos (Field sketch) and no two of the
  same series sit back to back where a swap fixes it; roundups (The Drawer) always go last, because
  they recap the others.
- Slots: continue after data/schedule.json `last_scheduled` (06:30 and 18:30 IST), then move
  `last_scheduled` to this batch's last slot.
- Name: batch-<first post date> unless --batch is given; refuses a name whose file already exists.
- Checks (printed; exit 1 on a FAIL): every episode has script.json, cover.png, <id>.srt and meta/;
  titles under 60 characters (YouTube), X post under 200; neighbours (including the previous batch's
  last episode) don't share an opening beat type, a first caption word or a music groove.
Then run: python3 scripts/build_posting.py data/batches/<batch>.json
"""
import argparse
import json
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HUB = "https://specimindlab.github.io"


def folder(eid):
    hits = sorted((ROOT / "episodes").glob(f"{eid}-*"))
    if not hits:
        sys.exit(f"FAIL {eid}: no episode folder")
    return hits[0]


def sections(p):
    out, cur = {}, None
    for ln in p.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^## (.+?)(?: \(.*\))?\s*$", ln)
        if m:
            cur = m.group(1).strip()
            out[cur] = []
            continue
        if cur:
            out[cur].append(ln)
    return {k: "\n".join(v).strip() for k, v in out.items()}


def script(eid):
    return json.loads((folder(eid) / "script.json").read_text(encoding="utf-8"))


def opening(s):
    b = (s.get("beats") or [{}])[0]
    first = ((b.get("lines") or [""])[0].split() or [""])[0].lower().strip(".,:;!?")
    return b.get("type", ""), first, s.get("groove")


def reorder(ids):
    scripts = {e: script(e) for e in ids}
    roundups = [e for e in ids if scripts[e].get("composition") == "Drawer"]
    rest = [e for e in ids if e not in roundups]

    def clash(a, b):
        sa, sb = scripts[a], scripts[b]
        both_sketch = sa.get("mode") == sb.get("mode") == "Field sketch"
        return both_sketch or sa.get("series") == sb.get("series")

    out = []
    pool = list(rest)
    while pool:
        pick = next((e for e in pool if not out or not clash(out[-1], e)), pool[0])
        out.append(pick)
        pool.remove(pick)
    return out + roundups


def slots(schedule, n):
    last = schedule.get("last_scheduled") or {}
    sl = schedule.get("slots", {"A": "06:30", "B": "18:30"})
    d = datetime.strptime(last.get("date") or schedule["calendar_start"], "%Y-%m-%d").date()
    slot = last.get("slot") if last.get("date") else None
    out = []
    for _ in range(n):
        if slot == "A":
            slot = "B"
        else:
            if slot == "B":
                d += timedelta(days=1)
            slot = "A"
        out.append((str(d), slot, f"{d} {sl[slot]} IST"))
    return out


def previous_episode(exclude):
    """The last episode of the most recent other batch (its neighbour for the 'no repeat' checks)."""
    best = None
    for p in (ROOT / "data/batches").glob("batch-*.json"):
        b = json.loads(p.read_text(encoding="utf-8"))
        for e in b.get("episodes", []):
            if e["id"] in exclude:
                continue
            if best is None or e.get("post_at", "") > best[0]:
                best = (e.get("post_at", ""), e["id"])
    return best[1] if best else None


def entry(eid, post_at):
    f = folder(eid)
    yt, ig, x = (sections(f / "meta" / n) for n in ("youtube.md", "instagram.md", "x.md"))
    tags = [t.strip() for t in yt.get("Tags", "").split(",") if t.strip()]
    return {
        "id": eid, "post_at": post_at,
        "youtube": {"title": yt.get("Title", ""), "description": yt.get("Description", ""),
                    "hashtags": yt.get("Hashtags", "").split(), "tags": tags,
                    "related_video": yt.get("Related video", ""),
                    "altered_content": yt.get("Altered or synthetic content toggle", "").upper().startswith("ON"),
                    "pinned_comment": yt.get("Pinned comment", ""), "playlists": yt.get("Playlists", "")},
        "instagram": {"caption": ig.get("Caption", ""), "comment_code": ig.get("Comment code", ""),
                      "auto_dm": ig.get("Auto-DM text", ""), "alt_text": ig.get("Alt text", ""),
                      "trial_reel_hook": ig.get("Trial Reel alternative hook", "")},
        "x": {"post": x.get("Post", ""), "first_reply": x.get("First reply", "")},
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("ids", nargs="*")
    ap.add_argument("--refresh", metavar="BATCH", help="update an existing batch file's copy from meta/")
    ap.add_argument("--batch")
    ap.add_argument("--note", default="")
    ap.add_argument("--keep-order", action="store_true", help="post in exactly the order given")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    if a.refresh:
        bp = ROOT / "data/batches" / f"{a.refresh.removesuffix('.json')}.json"
        b = json.loads(bp.read_text(encoding="utf-8"))
        b["episodes"] = [entry(e["id"], e["post_at"]) for e in b["episodes"]]
        bp.write_text(json.dumps(b, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        for e in b["episodes"]:
            print(f"{e['id']}  {e['post_at']}  {e['youtube']['title']}")
        print(f"refreshed {bp.relative_to(ROOT)} (slots unchanged); now run build_posting.py on it")
        return
    if not a.ids:
        ap.error("give episode ids, or --refresh <batch>")
    ids = [i.upper() for i in a.ids]
    fails, warns = [], []
    for eid in ids:
        f = folder(eid)
        for need in ("script.json", "cover.png", f"{eid}.srt", "meta/youtube.md", "meta/instagram.md", "meta/x.md"):
            if not (f / need).exists():
                fails.append(f"{eid}: missing {need}")
    if fails:
        print("\n".join("FAIL " + x for x in fails))
        sys.exit(1)
    order = ids if a.keep_order else reorder(ids)
    sched_p = ROOT / "data/schedule.json"
    schedule = json.loads(sched_p.read_text(encoding="utf-8"))
    sl = slots(schedule, len(order))
    name = a.batch or f"batch-{sl[0][0]}"
    out_p = ROOT / "data/batches" / f"{name}.json"
    if out_p.exists() and not a.dry_run:
        sys.exit(f"FAIL {out_p.relative_to(ROOT)} already exists: pick another --batch name")
    eps = [entry(eid, at) for eid, (_, _, at) in zip(order, sl)]
    # checks
    prev = previous_episode(set(order))
    chain = ([prev] if prev else []) + order
    for a_id, b_id in zip(chain, chain[1:]):
        oa, ob = opening(script(a_id)), opening(script(b_id))
        if oa[0] == ob[0]:
            fails.append(f"{a_id} -> {b_id}: both open with a '{oa[0]}' beat")
        if oa[1] and oa[1] == ob[1]:
            fails.append(f"{a_id} -> {b_id}: both hooks start with '{oa[1]}'")
        if oa[2] is not None and oa[2] == ob[2]:
            fails.append(f"{a_id} -> {b_id}: same music groove {oa[2]}")
        sa, sb = script(a_id), script(b_id)
        if sa.get("mode") == sb.get("mode") == "Field sketch":
            warns.append(f"{a_id} -> {b_id}: two research-only videos back to back")
        if sa.get("series") == sb.get("series"):
            warns.append(f"{a_id} -> {b_id}: same series back to back ({sa.get('series')})")
    for e in eps:
        t = e["youtube"]["title"]
        if not t or len(t) > 60:
            fails.append(f"{e['id']}: YouTube title missing or over 60 characters ({len(t)})")
        if not e["x"]["post"] or len(e["x"]["post"]) > 200:
            fails.append(f"{e['id']}: X post missing or over 200 characters ({len(e['x']['post'])})")
        if not e["instagram"]["comment_code"]:
            fails.append(f"{e['id']}: Instagram comment code missing")
    for e in eps:
        print(f"{e['id']}  {e['post_at']}  {e['youtube']['title']}")
    for w in warns:
        print("WARN " + w)
    for f_ in fails:
        print("FAIL " + f_)
    if fails:
        sys.exit(1)
    if a.dry_run:
        print(f"(dry run) would write {out_p.relative_to(ROOT)}")
        return
    note = a.note or f"{len(eps)} episodes: " + ", ".join(f"{e['id']} {script(e['id']).get('tool', '')}" for e in eps) + "."
    out_p.write_text(json.dumps({"batch": name, "created": datetime.now().strftime("%Y-%m-%d"), "note": note,
                                 "episodes": eps}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    schedule["last_scheduled"] = {"date": sl[-1][0], "slot": sl[-1][1], "episode": order[-1]}
    sched_p.write_text(json.dumps(schedule, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {out_p.relative_to(ROOT)}; data/schedule.json last_scheduled = {sl[-1][0]} {sl[-1][1]} ({order[-1]})")


if __name__ == "__main__":
    main()
