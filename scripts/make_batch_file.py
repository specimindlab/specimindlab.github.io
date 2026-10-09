#!/usr/bin/env python3
"""Write data/batches/<batch>.json from the episodes' meta/*.md, with posting slots and checks.

    python3 scripts/make_batch_file.py E005 E006 E007 [--batch NAME] [--note "..."] [--dry-run]
    python3 scripts/make_batch_file.py --check batch-2026-10-19      # check an existing batch, as posted
    python3 scripts/make_batch_file.py --refresh batch-2026-10-19    # re-read meta/ into an existing
                                                                     # batch file; slots and order stay
    python3 scripts/make_batch_file.py E002 --batch batch-2026-10-25-fix --no-schedule   # re-upload

- Order: posting order = episode number order (numbers follow release order, CLAUDE.md). Give the
  ids ascending; a roundup (The Drawer) is made last, so it is posted last.
- Slots: continue after data/schedule.json `last_scheduled` (06:30 and 18:30 IST), then move
  `last_scheduled` to this batch's last slot (not with --no-schedule or --dry-run).
- Name: batch-<first post date> unless --batch is given; refuses a name whose file already exists.
- Checks (exit 1 on a FAIL): every episode has script.json, cover.png, <id>.srt and meta/; YouTube
  title <= 60 characters; X post <= 200; Instagram comment code; and neighbours (including the
  episode posted just before this batch) don't share an opening beat type, a first caption word or
  a music groove. WARN for two research-only videos or two of the same series back to back.
Then run: python3 scripts/build_posting.py data/batches/<batch>.json
"""
import argparse
import json
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BATCHES = ROOT / "data/batches"


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


def posted_before(first_post_at, exclude):
    """The episode scheduled just before `first_post_at` in any batch file (its neighbour)."""
    best = None
    for p in BATCHES.glob("batch-*.json"):
        for e in json.loads(p.read_text(encoding="utf-8")).get("episodes", []):
            at = e.get("post_at", "")
            if e["id"] in exclude or not at or at >= first_post_at:
                continue
            if best is None or at > best[0]:
                best = (at, e["id"])
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


def check(eps):
    """eps: list of batch entries in posting order. Returns (fails, warns)."""
    fails, warns = [], []
    order = [e["id"] for e in eps]
    for eid in order:
        f = folder(eid)
        for need in ("script.json", "cover.png", f"{eid}.srt", "meta/youtube.md", "meta/instagram.md", "meta/x.md"):
            if not (f / need).exists():
                fails.append(f"{eid}: missing {need}")
    if fails:
        return fails, warns
    prev = posted_before(eps[0]["post_at"], set(order))
    chain = ([prev] if prev else []) + order
    for a_id, b_id in zip(chain, chain[1:]):
        sa, sb = script(a_id), script(b_id)
        oa, ob = opening(sa), opening(sb)
        if oa[0] == ob[0]:
            fails.append(f"{a_id} -> {b_id}: both open with a '{oa[0]}' beat")
        if oa[1] and oa[1] == ob[1]:
            fails.append(f"{a_id} -> {b_id}: both hooks start with '{oa[1]}'")
        if oa[2] is not None and oa[2] == ob[2]:
            fails.append(f"{a_id} -> {b_id}: same music groove {oa[2]}")
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
    return fails, warns


def report(eps, fails, warns, prev_note=""):
    for e in eps:
        print(f"{e['id']}  {e['post_at']}  {e['youtube']['title']}")
    if prev_note:
        print(prev_note)
    for w in warns:
        print("WARN " + w)
    for f in fails:
        print("FAIL " + f)


def batch_path(name):
    return BATCHES / f"{name.removesuffix('.json')}.json"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("ids", nargs="*")
    ap.add_argument("--batch")
    ap.add_argument("--note", default="")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--no-schedule", action="store_true", help="don't move data/schedule.json (re-uploads)")
    ap.add_argument("--check", metavar="BATCH", help="check an existing batch file in its own order and slots")
    ap.add_argument("--refresh", metavar="BATCH", help="update an existing batch file's copy from meta/")
    a = ap.parse_args()

    if a.check or a.refresh:
        bp = batch_path(a.check or a.refresh)
        b = json.loads(bp.read_text(encoding="utf-8"))
        eps = [entry(e["id"], e["post_at"]) for e in b["episodes"]]
        if a.refresh:
            b["episodes"] = eps
            bp.write_text(json.dumps(b, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        fails, warns = check(eps)
        prev = posted_before(eps[0]["post_at"], {e["id"] for e in eps})
        report(eps, fails, warns, f"(posted just before: {prev or 'nothing'})")
        if a.refresh:
            print(f"refreshed {bp.relative_to(ROOT)} (slots unchanged); now run build_posting.py on it")
        sys.exit(1 if fails else 0)

    if not a.ids:
        ap.error("give episode ids, or --check / --refresh <batch>")
    ids = [i.upper() for i in a.ids]
    nums = [int(i[1:]) for i in ids]
    if nums != sorted(nums):
        sys.exit(f"FAIL ids must be in number order (release order): {' '.join(sorted(ids))}")
    sched_p = ROOT / "data/schedule.json"
    schedule = json.loads(sched_p.read_text(encoding="utf-8"))
    sl = slots(schedule, len(ids))
    name = a.batch or f"batch-{sl[0][0]}"
    out_p = batch_path(name)
    if out_p.exists() and not a.dry_run:
        sys.exit(f"FAIL {out_p.relative_to(ROOT)} already exists: pick another --batch name")
    eps = [entry(eid, at) for eid, (_, _, at) in zip(ids, sl)]
    fails, warns = check(eps)
    prev = posted_before(eps[0]["post_at"], set(ids))
    report(eps, fails, warns, f"(posted just before: {prev or 'nothing'})")
    if fails:
        sys.exit(1)
    if a.dry_run:
        print(f"(dry run) would write {out_p.relative_to(ROOT)}")
        return
    note = a.note or f"{len(eps)} episodes: " + ", ".join(f"{e['id']} {script(e['id']).get('tool', '')}" for e in eps) + "."
    out_p.write_text(json.dumps({"batch": name, "created": datetime.now().strftime("%Y-%m-%d"), "note": note,
                                 "episodes": eps}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    msg = f"wrote {out_p.relative_to(ROOT)}"
    if not a.no_schedule:
        schedule["last_scheduled"] = {"date": sl[-1][0], "slot": sl[-1][1], "episode": ids[-1]}
        sched_p.write_text(json.dumps(schedule, indent=2) + "\n", encoding="utf-8")
        msg += f"; data/schedule.json last_scheduled = {sl[-1][0]} {sl[-1][1]} ({ids[-1]})"
    print(msg)


if __name__ == "__main__":
    main()
