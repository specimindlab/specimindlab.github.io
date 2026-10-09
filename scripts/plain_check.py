#!/usr/bin/env python3
"""Is this episode plain, readable and human? (prompts/voice.md v3)

    python3 scripts/plain_check.py E001 [E002 ...]       # exit 1 if anything FAILs

Checks every word a viewer reads in script.json (captions, chapter labels, card rows, notes, the
decision, the call to action, the pinned label) and the posting copy in meta/*.md:
  FAIL  our private jargon or tech words on screen (see voice.md "Words we use")
  FAIL  AI-writing tells (em dashes in captions, "not just X but Y", banned hype words, emoji)
  FAIL  reading speed: more than 2.5 words per second in a beat (caption + its card rows)
  FAIL  hook longer than 12 words, or a caption line over 7 words
  WARN  total length outside 35-55 s (18-60 s is enforced by the compositions)
  WARN  the same first word on three or more captions in a row (machine rhythm)
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

JARGON = [
    r"specimen", r"captured", r"\breleased\b", r"habitat", r"feeds on", r"field notes", r"field sketch",
    r"live specimen", r"free range", r"rare sighting", r"chrome", r"\bmesh(es)?\b", r"\bglb\b", r"\bgpu\b",
    r"zerogpu", r"\bquota\b", r"logged[- ]out", r"\bhf pro\b", r"octree", r"inference", r"\blatent", r"checkpoint",
    r"\bnº", r"collection conditions", r"field verdict", r"honest flaw", r"\bunpaid\b", r"desk study",
    r"hands-on", r"\bspace\b", r"\bapi\b", r"\bsota\b", r"\bllm\b", r"\btoken", r"\bseed\b",
]
TELLS = [
    r"\bdelve", r"\bunleash", r"\bunlock", r"\belevate", r"revolutioni[sz]e", r"game[- ]changer", r"\bseamless",
    r"cutting[- ]edge", r"\binsane", r"\bcrazy\b", r"mind[- ]blowing", r"unbelievable", r"\bsecret\b", r"\bhack\b",
    r"not just .{1,40} but", r"in a world where", r"let'?s dive", r"here'?s the thing", r"\btestament\b",
    r"\blandscape\b", r"\brealm\b", r"\bgame[- ]changing", r"\bnext[- ]level",
]
EMOJI = re.compile("[\U0001F300-\U0001FAFF☀-➿]")
WPS = 2.5


def words(s):
    return len(re.findall(r"[A-Za-z0-9$#%'’.,/+-]+", s))


def screen_text(script):
    """(where, text, counts_for_reading) for every on-screen string."""
    out = [("label", script.get("tool", ""), False), ("label", script.get("genus", ""), False)]
    for p, t in (script.get("cta") or {}).items():
        out.append((f"cta.{p}", t.replace("\n", " "), False))
    for i, b in enumerate(script.get("beats", [])):
        where = f"beat {i + 1} ({b['type']})"
        for ln in b.get("lines", []) + b.get("lines2", []):
            out.append((where, ln, True))
        if b.get("kicker"):
            out.append((where, b["kicker"], False))
        for r in b.get("rows", []) + ([b["result"]] if isinstance(b.get("result"), dict) and "key" in b["result"] else []):
            out.append((where, f"{r['key']} {r['value']}", True))
        for k in ("note", "flaw", "text", "use_for", "skip_if", "launched", "spotted", "process"):
            if isinstance(b.get(k), str):
                out.append((where, b[k].replace("|", " "), k in ("use_for", "skip_if")))
        for k in ("inputs", "outputs"):
            for t in b.get(k, []) or []:
                out.append((where, t, False))
        for it in b.get("items", []) or []:
            out.append((where, it.get("label", ""), False))
    for ln in (script.get("cover") or {}).get("lines", []):
        out.append(("cover", ln, False))
    return out


def check(eid):
    folder = next(iter(sorted((ROOT / "episodes").glob(f"{eid}-*"))), None)
    if not folder:
        return [f"FAIL {eid}: no episode folder"], []
    script = json.loads((folder / "script.json").read_text())
    fails, warns = [], []
    for where, text, _ in screen_text(script):
        low = text.lower()
        for pat in JARGON:
            if re.search(pat, low):
                fails.append(f"jargon '{re.search(pat, low).group(0)}' in {where}: \"{text}\"")
        for pat in TELLS:
            if re.search(pat, low):
                fails.append(f"AI tell '{re.search(pat, low).group(0)}' in {where}: \"{text}\"")
        if EMOJI.search(text):
            fails.append(f"emoji in {where}: \"{text}\"")
        if "—" in text and where.startswith("beat"):
            fails.append(f"em dash in {where}: \"{text}\"")
    total = 0.0
    firsts = []
    for i, b in enumerate(script.get("beats", [])):
        sec = float(b["seconds"])
        total += sec
        lines = b.get("lines", [])
        n = sum(words(l) for l in lines + b.get("lines2", []))
        n += sum(words(f"{r['key']} {r['value']}") for r in b.get("rows", []))
        if isinstance(b.get("result"), dict) and "key" in b["result"]:
            n += words(f"{b['result']['key']} {b['result']['value']}")
        n += sum(words(b.get(k, "") or "") for k in ("use_for", "skip_if"))
        if b["type"] in ("verdict", "cta"):
            n += 6   # the CTA lines
        if n > WPS * sec + 0.5:
            fails.append(f"beat {i + 1} ({b['type']}): {n} words in {sec:g} s (max {WPS * sec:g}); split it or cut words")
        for l in lines:
            if words(l) > 7:
                fails.append(f"beat {i + 1}: caption line over 7 words: \"{l}\"")
        if i == 0 and sum(words(l) for l in lines) > 12:
            fails.append(f"hook has {sum(words(l) for l in lines)} words (max 12)")
        if lines:
            firsts.append(lines[0].split()[0].lower())
    if not 35 <= total <= 55:
        warns.append(f"total {total:g} s (target 35-55 s)")
    for k in range(len(firsts) - 2):
        if firsts[k] == firsts[k + 1] == firsts[k + 2]:
            warns.append(f"three captions in a row start with \"{firsts[k]}\"")
    for md in sorted((folder / "meta").glob("*.md")):
        body = md.read_text()
        for pat in TELLS:
            m = re.search(pat, body.lower())
            if m:
                fails.append(f"AI tell '{m.group(0)}' in meta/{md.name}")
        for pat in JARGON[:12] + [r"field sketch", r"live specimen", r"honest flaw", r"desk study"]:
            m = re.search(pat, body.lower())
            if m:
                fails.append(f"jargon '{m.group(0)}' in meta/{md.name}")
        if EMOJI.search(body):
            fails.append(f"emoji in meta/{md.name}")
    return fails, warns


def main():
    ids = [a.upper() for a in sys.argv[1:]] or [p.name[:4] for p in sorted((ROOT / "episodes").glob("E[0-9][0-9][0-9]-*"))]
    bad = 0
    for eid in ids:
        fails, warns = check(eid)
        print(f"{eid}: {'PASS' if not fails else 'FAIL'} ({len(fails)} fail, {len(warns)} warn)")
        for f in fails:
            print(f"  FAIL {f}")
        for w in warns:
            print(f"  WARN {w}")
        bad += bool(fails)
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
