#!/usr/bin/env python3
"""Build posting/<batch>/ from a batch file and the rendered episodes.

    python3 scripts/build_posting.py data/batches/<batch>.json [--episodes-dir episodes] [--out posting/<batch>]

Run it locally before pushing the batch file (no MP4s yet): the text package is committed to the
repo under posting/<batch>/, so captions, descriptions and covers are on github.com the moment the
batch is ready. render.yml runs it again with the MP4s for the Release (MP4s are never committed).

Layout:
    posting/<batch>/POSTING.md            step-by-step posting guide (also the Release notes)
    posting/<batch>/posting-sheet.csv     one row per episode, for a scheduling spreadsheet
    posting/<batch>/<NN>-<id>-<slug>/     <id>-yt.mp4, <id>-ig.mp4, <id>-x.mp4, cover.png, <id>.srt,
                                          meta/ (youtube.md, instagram.md, x.md from Playbook P)

The batch file format is documented in data/batches/README.md.
"""
import argparse
import csv
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HUB = "https://specimindlab.github.io"


def g(d, *path, default=""):
    for p in path:
        if not isinstance(d, dict) or p not in d:
            return default
        d = d[p]
    return d if d is not None else default


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("batch_file")
    ap.add_argument("--episodes-dir", default="episodes")
    ap.add_argument("--out")
    a = ap.parse_args()

    batch_path = Path(a.batch_file)
    batch = json.loads(batch_path.read_text(encoding="utf-8"))
    name = batch.get("batch") or batch_path.stem
    out = Path(a.out or f"posting/{name}")
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    eps_dir = Path(a.episodes_dir)

    rows, sections, overview = [], [], []
    for n, ep in enumerate(batch["episodes"], 1):
        eid = ep["id"]
        src = next(iter(sorted(eps_dir.glob(f"{eid}-*"))), None)
        if src is None:
            sys.exit(f"{eid}: episode folder not found in {eps_dir}")
        script = json.loads((src / "script.json").read_text(encoding="utf-8"))
        code = script.get("code", "")
        tool = script.get("tool", "")
        series = script.get("series", "")
        dest = out / f"{n:02d}-{src.name}"
        dest.mkdir()
        # One master <id>.mp4 serves all three platforms (render_batch.sh default); per-platform
        # <id>-<p>.mp4 files win if a batch was rendered with ONLY_PLATFORMS="yt ig x".
        files = {}
        master = src / "render" / f"{eid}.mp4"
        if master.exists():
            shutil.copy2(master, dest / master.name)
        for p in ("yt", "ig", "x"):
            f = src / "render" / f"{eid}-{p}.mp4"
            if f.exists():
                shutil.copy2(f, dest / f.name)
                files[p] = f"{dest.name}/{f.name}"
            else:
                files[p] = f"{dest.name}/{eid}.mp4"
        vid = {p: files[p].split("/")[-1] for p in files}
        for f in ("cover.png", f"{eid}.srt"):
            if (src / f).exists():
                shutil.copy2(src / f, dest / f)
        if (src / "meta").is_dir():
            shutil.copytree(src / "meta", dest / "meta")

        when = g(ep, "post_at") or f"{g(ep, 'date')} {g(ep, 'time_ist')} IST".strip()
        yt, ig, x = ep.get("youtube", {}), ep.get("instagram", {}), ep.get("x", {})
        altered = "ON" if g(yt, "altered_content", default=False) else "OFF"
        hub = f"{HUB}/{code}"

        overview.append(f"| {n} | {when} | {eid} | {code} | {tool} | {series} | {script.get('mode', '')} | `{dest.name}/` |")
        rows.append({
            "order": n, "post_at_ist": when, "id": eid, "code": code, "tool": tool, "series": series,
            "mode": script.get("mode", ""), "disclosure": script.get("disclosure", ""),
            "folder": dest.name, "youtube_file": files.get("yt", ""), "instagram_file": files.get("ig", ""),
            "x_file": files.get("x", ""), "cover": f"{dest.name}/cover.png", "captions": f"{dest.name}/{eid}.srt",
            "youtube_title": g(yt, "title"), "youtube_altered_content": altered,
            "youtube_related_video": g(yt, "related_video"), "instagram_comment_code": g(ig, "comment_code"),
            "x_post": g(x, "post"), "hub_url": hub,
        })

        tags = " ".join(g(yt, "hashtags", default=[]) or [])
        sections.append("\n".join([
            f"## {n}. {eid} · {code} · {tool}",
            "",
            f"**Post:** {when} · **Series:** {series} · **Mode:** {script.get('mode', '')} · "
            f"**Disclosure:** {script.get('disclosure', '')} · **Folder:** `{dest.name}/` · **Hub:** {hub}",
            "",
            "### YouTube Shorts",
            f"- [ ] Upload `{vid['yt']}`; custom thumbnail `cover.png`; subtitles `{eid}.srt` (English)",
            f"- [ ] Title: {g(yt, 'title')}",
            f"- [ ] Hashtags: {tags}",
            *([f"- [ ] Tags: {', '.join(g(yt, 'tags', default=[]))}"] if g(yt, "tags", default=[]) else []),
            f"- [ ] \"Altered or synthetic content\" toggle: **{altered}**",
            f"- [ ] Related video: {g(yt, 'related_video') or 'none'}",
            f"- [ ] Paid promotion box: {'tick it' if script.get('disclosure') == 'Affiliate' else 'leave unticked'}",
            "",
            "<details><summary>Description</summary>",
            "",
            "```",
            g(yt, "description"),
            "```",
            "</details>",
            "",
            "### Instagram Reels",
            f"- [ ] Upload `{vid['ig']}`; cover `cover.png`",
            f"- [ ] Comment-automation keyword: **{g(ig, 'comment_code') or code}**",
            "",
            "<details><summary>Caption</summary>",
            "",
            "```",
            g(ig, "caption"),
            "```",
            "</details>",
            "",
            "<details><summary>Auto-DM text</summary>",
            "",
            "```",
            g(ig, "auto_dm"),
            "```",
            "</details>",
            "",
            "### X",
            f"- [ ] Upload `{vid['x']}` with the post below, then reply to it with the first reply.",
            "",
            "```",
            g(x, "post"),
            "```",
            "",
            "First reply:",
            "",
            "```",
            g(x, "first_reply"),
            "```",
            "",
        ]))

    head = [
        f"# SPECIMIND {name}: posting guide",
        "",
        f"{len(rows)} episode{'s' if len(rows) != 1 else ''}. Download `specimind-{name}.zip` from the Release `{name}` (or each MP4 on its own from the same Release) and unzip it; each folder holds one master "
        "video `<id>.mp4` (the same file goes to YouTube, Instagram and X), `cover.png`, the `.srt` captions and `meta/`. Every MP4 is 1080×1920, 30 fps, "
        "H.264, -14 LUFS, and was verified automatically before this Release was created.",
        "",
        "Schedule YouTube in YouTube Studio and Instagram in Meta Business Suite (both free). Post X by hand if scheduling is "
        "not offered on your account. Times are IST.",
        "",
        "| # | Post (IST) | Episode | Code | Tool | Series | Mode | Folder |",
        "| --- | --- | --- | --- | --- | --- | --- | --- |",
        *overview,
        "",
    ]
    (out / "POSTING.md").write_text("\n".join(head + sections), encoding="utf-8")
    with (out / "posting-sheet.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    print(f"built {out} ({len(rows)} episodes)")


if __name__ == "__main__":
    main()
