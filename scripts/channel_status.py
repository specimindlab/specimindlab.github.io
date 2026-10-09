#!/usr/bin/env python3
"""Where the channel stands, from the repo alone (no network). Used by /channel, /batch and the
SessionStart hook, so every new session starts with the production context.

    python3 scripts/channel_status.py            # full dashboard (markdown)
    python3 scripts/channel_status.py --brief    # 10-15 lines for the session start
    python3 scripts/channel_status.py --json     # machine-readable

Sources: episodes/*/ (brief, facts, script), data/batches/*.json, data/batch-state.json,
data/schedule.json, data/calendar.csv, captures/*/raw/, data/catalog.json (links, affiliate_url).
"""
import csv
import io
import json
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPO = "specimindlab/specimindlab.github.io"
SAYS = {"Captured": "Worth it", "Released": "Skip it", "Watch": "Not tested"}


def load(p, default=None):
    try:
        return json.loads(Path(p).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return default


def calendar():
    p = ROOT / "data/calendar.csv"
    if not p.exists():
        return []
    return list(csv.DictReader(io.StringIO(p.read_bytes().decode("utf-8"), newline="")))


def uploads(raw: Path):
    """The human's files in a raw/ folder: anything except .gitkeep and the input/ we prepared."""
    if not raw.is_dir():
        return []
    return [f for f in raw.rglob("*") if f.is_file() and f.name != ".gitkeep" and "input" not in f.relative_to(raw).parts[:1]]


def episodes():
    out = []
    for d in sorted((ROOT / "episodes").glob("E[0-9][0-9][0-9]-*")):
        b = load(d / "brief.json", {}) or {}
        f = load(d / "facts.json", {}) or {}
        s = load(d / "script.json", {}) or {}
        score = (f.get("score") or {}).get("total")
        out.append({
            "id": d.name[:4], "folder": str(d.relative_to(ROOT)), "row": b.get("row", ""),
            "code": b.get("code") or s.get("code", ""), "tool": s.get("tool") or b.get("tool") or f.get("tool", ""),
            "series": s.get("series") or b.get("series", ""), "mode": s.get("mode") or f.get("mode") or b.get("mode", ""),
            "verdict": f.get("verdict", ""), "score": score, "groove": s.get("groove"),
            "seconds": sum(float(x.get("seconds", 0)) for x in s.get("beats", [])) if s else None,
            "ready": bool(s) and (d / "cover.png").exists() and (d / "meta").is_dir(),
        })
    return out


def batches():
    out = []
    for p in sorted((ROOT / "data/batches").glob("batch-*.json")):
        b = load(p, {}) or {}
        out.append({"batch": b.get("batch", p.stem), "created": b.get("created", ""),
                    "episodes": [(e.get("id"), e.get("post_at", "")) for e in b.get("episodes", [])]})
    return out


def captures():
    out = []
    for d in sorted((ROOT / "captures").glob("R[0-9][0-9][0-9]-*")):
        up = uploads(d / "raw")
        out.append({"row": d.name[:4], "folder": str(d.relative_to(ROOT)), "uploads": [str(f.relative_to(d / "raw")) for f in up]})
    return out


def next_slot(schedule):
    last = (schedule or {}).get("last_scheduled") or {}
    slots = (schedule or {}).get("slots", {"A": "06:30", "B": "18:30"})
    try:
        d = datetime.strptime(last["date"], "%Y-%m-%d").date()
    except (KeyError, ValueError):
        d = datetime.strptime((schedule or {}).get("calendar_start", str(date.today())), "%Y-%m-%d").date()
        return f"{d} {slots.get('A')} IST"
    if last.get("slot") == "A":
        return f"{d} {slots.get('B')} IST"
    return f"{d + timedelta(days=1)} {slots.get('A')} IST"


def status():
    cal = calendar()
    eps = episodes()
    caps = captures()
    cap_rows = {c["row"] for c in caps}
    state = load(ROOT / "data/batch-state.json", {}) or {}
    sched = load(ROOT / "data/schedule.json", {}) or {}
    cat = load(ROOT / "data/catalog.json", {}) or {}
    entries = {e.get("code"): e for e in cat.get("specimens", []) + cat.get("groups", [])}
    in_batch = {eid: b["batch"] for b in batches() for eid, _ in b["episodes"]}
    post_at = {eid: at for b in batches() for eid, at in b["episodes"]}
    for e in eps:
        c = entries.get(e["code"], {})
        e["batch"] = in_batch.get(e["id"], "")
        e["post_at"] = post_at.get(e["id"], "")
        e["posted"] = any((c.get("links") or {}).values())
        e["affiliate"] = bool(c.get("affiliate_url"))
        e["status"] = next((r["Status"] for r in cal if r.get("Episode") == e["id"]), "")
    planned = [r for r in cal if not r.get("Episode") and r.get("Status") not in ("Rendered", "Posted")]
    ready_caps = [c for c in caps if c["uploads"]]
    makeable = [r for r in planned if r["Row"] not in cap_rows]
    unfinished = state.get("status") not in (None, "", "complete")
    nums = [int(e["id"][1:]) for e in eps]
    return {
        "today": str(date.today()),
        "episodes": eps,
        "next_episode_id": f"E{(max(nums) + 1) if nums else 1:03d}",
        "last_batch": state.get("batch", ""), "last_batch_status": state.get("status", ""),
        "last_release": state.get("release", ""),
        "unfinished_batch": unfinished,
        "next_post_slot": next_slot(sched),
        "captures_waiting": [c for c in caps if not c["uploads"]],
        "captures_ready": ready_caps,
        "calendar_left": len(planned),
        "next_rows": [{"row": r["Row"], "series": r["Series"], "tool": r["Tool(s)"], "mode": r["Mode"]} for r in makeable[:10]],
        "makeable_without_you": len(makeable),
        "not_posted": [e["id"] for e in eps if e["ready"] and not e["posted"]],
    }


def advice(s):
    tips = []
    if s["unfinished_batch"]:
        tips.append(f"`/batch` resumes the unfinished {s['last_batch']} first.")
    if s["captures_ready"]:
        tips.append(f"{len(s['captures_ready'])} recording(s) uploaded ({', '.join(c['row'] for c in s['captures_ready'])}): `/batch` makes them first.")
    if s["calendar_left"] < 14:
        tips.append(f"Only {s['calendar_left']} planned rows left: run `/scout 14` to plan the next two weeks.")
    if s["captures_waiting"]:
        tips.append(f"{len(s['captures_waiting'])} test(s) wait for your recording: `/captures` gives the checklist.")
    if s["not_posted"]:
        tips.append(f"Made but not marked posted: {', '.join(s['not_posted'])}. After posting, `/posted <id> <urls>` puts the links on the hub.")
    return tips


def brief(s):
    eps = s["episodes"]
    lines = [f"SPECIMIND status ({s['today']}; from the repo, run `/channel` for detail):",
             f"- Made: {len(eps)} episode(s), last {eps[-1]['id']} {eps[-1]['tool']}; next number {s['next_episode_id']}." if eps else "- Made: none yet; next number E001.",
             f"- Last batch: {s['last_batch'] or 'none'} ({s['last_batch_status'] or 'n/a'}){' ' + s['last_release'] if s['last_release'] else ''}.",
             f"- Next post slot: {s['next_post_slot']}. Calendar rows left: {s['calendar_left']} ({len(s['captures_waiting']) + len(s['captures_ready'])} of them in captures/).",
             f"- Captures: {len(s['captures_ready'])} uploaded and ready, {len(s['captures_waiting'])} waiting for the human."]
    lines += [f"- {t}" for t in advice(s)]
    lines.append("- Commands: /batch N · /channel · /captures · /scout N · /posted · /revise · /rerelease · /affiliate · /weekly (see .claude/skills/).")
    return "\n".join(lines)


def full(s):
    out = [f"# SPECIMIND channel status ({s['today']})", ""]
    out += ["## Made", "", "| Id | Code | Tool | Kind | Verdict | Score | Length | Batch | Suggested post | Posted |", "|---|---|---|---|---|---|---|---|---|---|"]
    for e in s["episodes"]:
        out.append(f"| {e['id']} | {e['code']} | {e['tool']} | {e['series']} | {SAYS.get(e['verdict'], e['verdict'] or '-')} | "
                   f"{e['score'] if e['score'] is not None else '-'} | {e['seconds']:g} s | {e['batch'] or '-'} | {e['post_at'] or '-'} | "
                   f"{'yes' if e['posted'] else 'no'}{' · affiliate' if e['affiliate'] else ''} |" if e["seconds"] is not None else
                   f"| {e['id']} | {e['code']} | {e['tool']} | {e['series']} | - | - | - | - | - | - |")
    out += ["", f"Next episode number: **{s['next_episode_id']}** · next post slot: **{s['next_post_slot']}**",
            f"Last batch: **{s['last_batch'] or 'none'}** ({s['last_batch_status'] or 'n/a'}) {s['last_release']}", ""]
    out += ["## Recordings", ""]
    for c in s["captures_ready"]:
        out.append(f"- READY {c['row']} ({c['folder']}): {', '.join(c['uploads'])}")
    for c in s["captures_waiting"]:
        out.append(f"- waiting {c['row']} ({c['folder']}): checklist in its README.md")
    if not (s["captures_ready"] or s["captures_waiting"]):
        out.append("- none")
    out += ["", f"## Next calendar rows for /batch ({s['makeable_without_you']} planned rows outside captures/; research decides if one needs your recording)", ""]
    for r in s["next_rows"]:
        out.append(f"- {r['row']} · {r['series']} · {r['tool']} · {r['mode']}")
    tips = advice(s)
    if tips:
        out += ["", "## Suggested next step", ""] + [f"- {t}" for t in tips]
    return "\n".join(out)


if __name__ == "__main__":
    s = status()
    if "--json" in sys.argv:
        print(json.dumps(s, indent=2))
    elif "--brief" in sys.argv:
        print(brief(s))
    else:
        print(full(s))
