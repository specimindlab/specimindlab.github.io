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
4. `data/batch-state.json`: if `status` is not `complete`, **resume that batch** (skip finished episodes, continue at the recorded step) instead of starting a new one, and say so.
5. Keep a todo list (one item per episode plus the release steps).

## 1. Pick N rows
In this order, until there are N:
1. The rows named in the arguments.
2. Recordings the human uploaded: `channel_status.py` lists them under "READY" (files in `captures/R###-*/raw/` beyond `input/`).
3. `python3 scripts/new_episode.py next 40` in calendar order, skipping rows that already have a `captures/` folder without uploads.
A roundup (The Drawer) recaps every video made so far: take it only if at least 3 videos were made since the last roundup, and make it **last**.

## 2. Decide each row's mode (before giving it a number)
Do Playbook R's research first (this week's sources only), then:
- **Tested by us, recorded by the human:** uploads exist.
- **Tested by us, recorded by you:** open-source with a public demo page or a free no-login API, and `data/env-check.md` says auto-capture works (Playbook I, AUTO-CAPTURE). Never log in, never make accounts, never bypass limits or captchas.
- **Research only (Field sketch):** no free plan, or the series is Field Sketch / Extinction Watch / The Drawer. At most 40% of the batch.
- **Needs the human's recording:** anything else. `python3 scripts/new_episode.py capture R###` (no number used), add it to `data/needs-capture.md`, and take the next row so the batch still has N videos. Never fake a test and never turn it into research-only.

## 3. Make each episode (in order)
1. `python3 scripts/new_episode.py make R###`: gives the next E### and code, moves uploads in, writes the calendar. Record the episode in `data/batch-state.json` (`status: "in_progress"`, step per episode).
2. Playbook R (research.md, facts.json), Playbook I (ingest or auto-capture, the flaw, the verdict, the SPECIMIND score by data/score.md).
3. Playbook V: script.json in the v3 voice (plain words, the story, chapter labels, 35–55 s, ≤ 2.5 words/s). `python3 scripts/plain_check.py E###` must PASS. Pick a `groove` different from the previous upload's and a hook pattern and first word different from the previous two.
4. `scripts/render_previews.sh E###` in the background (one Remotion job at a time). Then the review loop: look at every still and `qa/contact-sheet.jpg`, check the Playbook V list, `python3 scripts/check_safe_zones.py episodes/E###-*/qa/stills/[0-9]*.png`, fix, re-render, until everything passes (max 4 rounds). Write `qa/report.md` (rounds, FAILs, fixes, final PASS table).
5. Playbook P: meta/youtube.md, instagram.md, x.md in the same plain words. `node scripts/catalog_sync.mjs E###` and `node site/build.mjs`.
6. Commit and push "E### ready" (main, plus the session branch if any). Update batch-state.

If an engine change was needed (anything in `video/src/`), run `scripts/render_series_test.sh <scratch> ig` and `check_safe_zones.py` on its stills before committing, so the other series still work.

## 4. The batch file, render and Release
1. `python3 scripts/make_batch_file.py E### E### ...` (posting order, slots after `data/schedule.json`, checks neighbours for the same opening beat, first word and groove). Fix every FAIL in the episodes, never by weakening the check.
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
