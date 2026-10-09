---
name: revise
description: Change an already-made SPECIMIND video or its copy (a caption, a fact, the music, the title, the hub text), run the full checks again and re-release it. Use when the human types /revise or asks to fix something in a made episode.
argument-hint: "E### <what to change>"
disable-model-invocation: true
---

# /revise: fix a made episode

Arguments: `$ARGUMENTS` (first token: the episode id or code; the rest: what the human wants changed).

1. `git pull origin main`; `python3 scripts/channel_status.py`; read `CLAUDE.md`, `prompts/voice.md`, `prompts/ops-notes.md`, Playbook V and P, and the episode's brief, research, facts, script, meta and `qa/report.md`.
2. Decide what the change touches and say it in one line before you start:
   - **Copy only** (meta/*.md, the hub text): no render needed.
   - **The video** (script.json, facts that show on screen, music groove/key): re-render.
   - **The engine** (`video/src/`): every series is affected; run the series test too.
   Never change a verdict, score or catch to please anyone. A factual correction is fine with a source, and the hub gets a dated entry in the episode's `corrections` (catalog.json) when a published fact changes.
   Never change an episode's number or code.
3. Make the change. Keep the v3 voice; `python3 scripts/plain_check.py E###` must PASS. If the hook changes, check it still differs (first word, pattern) from the uploads around it: `python3 scripts/make_batch_file.py <its batch's ids> --keep-order --dry-run` shows FAILs for neighbours.
4. For a video change: `scripts/render_previews.sh E###` (background; one Remotion job at a time), look at every still and the contact sheet, `check_safe_zones.py` on the stills, loop until clean. If a roundup (The Drawer) recaps this episode and its cover changed, re-render that roundup too, **after** `node scripts/catalog_sync.mjs E###`.
5. `node scripts/catalog_sync.mjs E###` and `node site/build.mjs`. Add a dated "Revision" section at the top of `qa/report.md` (what changed and why, checks run).
6. Commit and push. Then the Release:
   - The episode's batch not posted yet (`/channel` shows "posted no"): run `python3 scripts/make_batch_file.py --refresh <batch>` (re-reads meta/ into the batch file), then `python3 scripts/build_posting.py data/batches/<batch>.json`, commit and push. A changed batch file starts the re-render by itself; otherwise dispatch one (`prompts/ops-notes.md`). Either way it replaces the zip; never start two runs for one change.
   - Already posted: say what changed and that platforms can't swap a posted video. Make a new batch only if the human asked for a re-upload (`make_batch_file.py E### --batch batch-<date>-fix`).
   - Copy only: rebuild the posting package and dispatch the re-render only if the zip's meta/ must change; otherwise just push.
7. Watch the render to the end (max 3 failed runs), confirm the Release holds one zip, and spot-check the changed video from the zip (frame grid + waveform). Reply with what changed, the checks, and the Release link.
