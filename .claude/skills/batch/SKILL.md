---
name: batch
description: Make the next N SPECIMIND videos end to end (research, test, script, music, review loop, posting copy), then render them on GitHub and publish one Release zip. Use when the human types /batch, optionally with a number and calendar rows.
argument-hint: "[N=3] [R### ...] [notes]"
disable-model-invocation: true
---

# /batch: make the next videos

Arguments: `$ARGUMENTS`
- The first plain number is **N**, how many videos to make (default 3 when none is given).
- Any `R###` tokens are calendar rows the human wants included; make those first, then fill up to N from the calendar.
- Anything else is a note from the human (e.g. "no research-only videos", "3D tools only"). Follow it unless it breaks the Specimen Code in CLAUDE.md.

Work autonomously. Ask the human only for something truly impossible without them (billing, a login). The human may close the tab; the session keeps going.

## 0. Load the context (every time, even in a fresh session)
1. `git pull origin main`. If the session names a feature branch, also keep it in sync (push to both).
2. `python3 scripts/channel_status.py`: what's made, next number, next post slot, recordings uploaded, rows waiting.
3. Read: `CLAUDE.md`, `prompts/voice.md`, `prompts/ops-notes.md`, the Playbooks R, I, V and P in `prompts/specimind-claude-code-prompts.md`, `data/series.md`, `data/score.md`, `data/env-check.md`, `video/src/series/README.md`.
4. `data/batch-state.json`: if `status` is `in_progress`, **resume that batch** (its `rows` and `episodes` say what's done and the step each one reached) instead of starting a new one, and say so.
5. Keep a todo list (one item per episode plus the release steps).

## 1. Pick N rows
In this order, until there are N:
1. The rows named in the arguments.
2. Recordings the human uploaded: `channel_status.py` lists them under "READY" (files in `captures/R###-*/raw/` beyond `input/`).
3. `python3 scripts/new_episode.py next 40` in calendar order. Skip rows marked "waiting for the human's recording".
A roundup (The Drawer) recaps the videos made **since the previous roundup** (the first one recapped all of them). Take a roundup row only when at least 3 such videos exist, counting this batch's; otherwise skip it (it stays Planned and comes up again). It is always made **last**.
Then start the state, before any other work: write `data/batch-state.json` as `{"batch": "pending", "status": "in_progress", "started": <today>, "requested": N, "rows": [<the picked rows>], "episodes": []}`, commit and push. Rows that turn into capture requests are replaced in `rows`, so a resumed session knows the plan.

## 2. Decide each row's mode before it gets a number
Numbers are given in release order and never left with gaps, so a row gets its number (`make`) only once it is certain to become a video. For each row, a quick pre-flight first (this week's pricing page and the demo page, nothing written in episodes/):
- **Tested by us, recorded by the human:** their uploads are in `captures/R###-*/raw/`.
- **Tested by us, recorded by you:** open-source with a public demo page or a free no-login API, and `data/env-check.md` says auto-capture works. Run the test now (Playbook I, AUTO-CAPTURE) with outputs in `captures/R###-<slug>/raw/auto/` (`make` moves them into the episode). Never log in, never make accounts, never bypass limits or captchas. If the demo is down or queued for more than 10 minutes, the row needs the human instead.
- **Research only (Field sketch):** no free plan, or the series is Field Sketch / Extinction Watch. At most 40% of a batch and never two in a row. A roundup (The Drawer) is built from our own tests, so it is not research-only.
- **Needs the human's recording:** anything else. `python3 scripts/new_episode.py capture R###` (no number used), add it to `data/needs-capture.md`, and take the next row so the batch still has N videos. Never fake a test and never turn it into research-only.

## 3. Make each episode (in the picked order; the roundup last)
1. `python3 scripts/new_episode.py make R###`: gives the next E### and code, moves the captures in, writes the calendar. Add `{"id", "row", "step": "made"}` to batch-state `episodes`; update `step` (research, test, script, review, meta, ready) as you go.
2. Playbook R (research.md, facts.json), Playbook I (ingest the captures, the flaw, the verdict, the SPECIMIND score by data/score.md).
3. Playbook V: script.json in the v3 voice (plain words, the story, chapter labels, 35–55 s, ≤ 2.5 words/s). `python3 scripts/plain_check.py E###` must PASS. Its `groove` must differ from the episode before it in number order (that is the one posted before it), and its hook pattern and first word from the two before it.
4. `scripts/render_previews.sh E###` in the background (one Remotion job at a time). Then the review loop: look at every still and `qa/contact-sheet.jpg`, check the Playbook V list, `python3 scripts/check_safe_zones.py episodes/E###-*/qa/stills/[0-9]*.png`, fix, re-render, until everything passes (max 4 rounds). Write `qa/report.md` (rounds, FAILs, fixes, final PASS table).
5. Playbook P: meta/youtube.md, instagram.md, x.md in the same plain words. `node scripts/catalog_sync.mjs E###` and `node site/build.mjs`.
6. Commit and push "E### ready" (main, plus the session branch if any). Update batch-state.

If an engine change was needed (anything in `video/src/`), run `scripts/render_series_test.sh <scratch> ig` and `check_safe_zones.py` on its stills before committing, so the other series still work.

## 4. The batch file, render and Release
1. `python3 scripts/make_batch_file.py E### E### ...` with the ids in number order (posting order = release order). It gives slots after `data/schedule.json`, moves `last_scheduled` itself (never edit schedule.json by hand), and checks neighbours, including the episode posted just before, for the same opening beat, first word and groove. Fix every FAIL in the episodes, never by weakening the check. Set batch-state `batch` to the new name.
2. `python3 scripts/build_posting.py data/batches/<batch>.json`.
3. Commit and push. The push starts **Render batch** on GitHub (about 4.5 minutes per video).
4. Watch it in the background: `gh api repos/specimindlab/specimindlab.github.io/actions/runs?per_page=5`. On failure read the annotations and logs (`prompts/ops-notes.md`), fix the cause, push or dispatch again. Stop after 3 failed runs and report.
5. When it succeeds:
   - Check the Release has **only** `specimind-<batch>.zip`.
   - Download the zip (REST asset download, see ops-notes) and look at one video: a frame grid (`ffmpeg -vf fps=1/4,scale=270:-1,tile=6x2`) and the audio waveform (`showwavespic`).
   - Check that Pages succeeded and each `https://specimindlab.github.io/<code>` returns 200.
6. `python3 scripts/new_episode.py status Rendered E### ...` (keeps the calendar's CRLF), mark the batch `complete` in batch-state with the release URL. Commit and push.

## 5. Quality pass before you report
Re-read the whole batch as a first-time viewer would: every caption and card is understandable without context; nothing claims a test we didn't run; every number matches facts.json; the music varies between neighbours. If anything fails, fix it and re-render the batch (dispatch; it replaces the zip). Add any new lesson to `prompts/ops-notes.md`.

## 6. Report (short)
A table: id · code · tool · what kind of video · verdict and score · length · suggested post time. Then the Release link, rows moved to captures/ (what the human must record, link to `data/needs-capture.md`), anything that failed or needs the human, and the suggested next command (`/captures`, `/posted`, `/scout`).
