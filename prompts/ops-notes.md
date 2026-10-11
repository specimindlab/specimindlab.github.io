# Ops notes: lessons from real batches (read before /batch, /revise, /rerelease)

Every slash command in `.claude/skills/` relies on these. Add a line here whenever a batch teaches us something; never delete one without fixing its cause.

## Environment
- The SessionStart hook (`scripts/cloud_setup.sh`) installs node_modules, Python packages, ffmpeg and the Remotion browser; `scripts/channel_status.py --brief` prints where the channel stands. If either failed, read the warning before starting.
- Commands longer than 2 minutes run in the background (`run_in_background`); wait with an until-loop, never chained `sleep`.
- **Never run two Remotion jobs at once.** `render_previews.sh` and `render_series_test.sh` both rebuild `video/build/`; running them together breaks assets (404s on staged files). One render job at a time.
- Render the Drawer (roundup) episode **after** every episode it recaps: `stage_drawer_covers.py` copies their `cover.png` from the catalog, so the covers must be final and synced first.
- `node scripts/catalog_sync.mjs E###` before rendering a roundup that includes E###.

## GitHub from a Claude Code session
- REST only (`gh api repos/specimindlab/specimindlab.github.io/...`). GraphQL is blocked, so `gh release download` and `gh run view` fail. Download a release asset with `gh api -H "Accept: application/octet-stream" repos/.../releases/assets/<id> > file.zip`.
- **Creating, editing or deleting releases is not permitted for this session type** (HTTP 403). Releases are made by `render.yml` only. Old or superseded releases are for the human to delete; say so in the report.
- Re-run a render without changing the batch file: `gh api -X POST repos/specimindlab/specimindlab.github.io/actions/workflows/render.yml/dispatches -f ref=main -f inputs[batch]=<batch>`.
- Workflow failures: `gh api repos/.../actions/runs/<run>/jobs` → job id → `gh api repos/.../check-runs/<job>/annotations` and `gh api repos/.../actions/jobs/<job>/logs`.
- A render of 4 episodes × 3 platforms takes about 30 minutes on GitHub (about 4.5 minutes per 45 s video).

## Release rules
- A Release carries **one zip only**: `specimind-<batch>.zip` (every MP4, cover, .srt, meta/ and POSTING.md). `render_batch.sh` enforces this.
- Any push that adds or changes a `data/batches/*.json` file starts `render.yml` for that batch (about 30 minutes). Don't touch old batch files casually.
- Re-rendering an existing batch (dispatch, or a changed batch file) **replaces** its zip in the same Release. Use that while none of its videos are posted. If some are already posted, put only the changed episodes in a **new** batch (`batch-<date>-fix`), so the human never re-downloads or re-posts videos that are already out.
- `scripts/verify_delivery.py` checks every MP4 (H.264, AAC 48 kHz, 1080×1920, 30 fps, 18–60 s, -14 LUFS, ≤ 100 MB). When a rule in CLAUDE.md changes, change it there too (a 45 s video once failed because it still said 40 s).

## Numbering
- `python3 scripts/new_episode.py make R###` is the only way to give a number. Never hand-edit E### or codes; never renumber after a video has been released (the human may already have posted it).
- `captures/R###-*/raw/input/` holds the input we prepared; anything else in `raw/` is the human's upload. `channel_status.py` and `new_episode.py next` tell them apart.

## Quality traps seen so far
- Our own words leak: run `python3 scripts/plain_check.py E###` and read every still; the check doesn't see words drawn by components (e.g. "Flaw" in the roundup came from Drawer.tsx, not the script). Engine words live in `video/src/vocab.ts`.
- A roundup or hook must not claim we "tested" something we only researched.
- Old files survive renames: after renumbering or remaking, delete stale `<old-id>.srt`, covers and posting folders.
- Crop windows: `crop` needs `objectPosition` to pan; check that a cropped photo still shows the object.
- Layout changes in `video/src/series/common.tsx` (caption box, chapter label reserve) affect all nine series: run `scripts/render_series_test.sh <scratch> ig` and `check_safe_zones.py` on its stills before committing.
- Music: a new `groove` must differ from the previous upload's; `make_music.py` prints style, key and section times; check that the score lock and verdict land where the picture does.
- Give a row its number (`new_episode.py make`) only once it is sure to become a video: run the pre-flight and any auto-capture into `captures/R###-<slug>/raw/auto/` first, or a failed demo leaves a gap in the numbers.
- Posting order is number order. `make_batch_file.py` refuses ids out of order; a roundup is made last so it is posted last.
- `make_batch_file.py` moves `data/schedule.json` itself; editing it by hand as well moves the schedule twice.
- Two hooks in a row once both started "Free AI turned ..." (E001, E002) and nobody noticed until the neighbour check existed: always run `make_batch_file.py` (or `--check`) before a release.
- Capture scripts: write run.json (timing, result) the moment the result appears, before optional steps like switching tabs; a later failure must never cost the attempt's record. Click page tabs with `evaluate("e => e.click()")` when the Hugging Face Space header overlaps them.
- Image sources: Unsplash pages and downloads are bot-walled for scripts, but WebFetch on a photo page returns its `images.unsplash.com/photo-…` address, and that downloads with curl. Wikimedia's API rate-limits fast (429).
- Run `node site/build.mjs` and read its last line before every push that touches data/catalog.json: a research-only entry still needs `tested_on` (the research date), or Pages fails.
- Pushing from the session branch: `git push origin main` pushes the stale local `main` ref and is rejected; use `git push origin HEAD:main` (then `HEAD:<session branch>`).
- Plan the series mix before giving numbers: the neighbour check fails on two adjacent uploads with the same opening beat, so three tools of one series in a 7-video batch need others between them (batch-2026-10-21 moved Hookest from Rare Sighting to Free Range to fit).
- A public demo that hangs (queue stuck, no output after 30 min) is not a capture request: the human can't fix it either. Leave the row Planned with a dated note and pick the next row.
- Capture sessions: OBS "Automatic File Splitting" at 24 MB keeps long waits (queues, app builds, audio overviews) under GitHub's 25 MB web upload without breaking the timing; the human uploads `screen-1.mp4`, `screen-2.mp4` …; join them with ffmpeg concat before measuring.
- Free-plan licences (checked 2026-10-10): ElevenLabs (personal use, "elevenlabs.io" in the title), Kling (no commercial use, label output as Kling's), Photoroom and Tripo (non-commercial) restrict free output. Show it as a short credited review clip, add the attribution each asks for in titles/descriptions, and flag it in research.md.
- NotebookLM is now "Gemini Notebook" (notebook.google.com, renamed 2026-07-16). Its audio overview is the tool's output, not our narration: play a short labelled clip as the specimen, like a sound effect.
- Affiliate programs: `data/affiliate-programs.md` (checked 2026-10-11) lists each calendar tool's program, network, approval time and rules; `data/instagram-auto-dm.md` is the comment-to-DM setup. When `/scout` adds a tool, check it there and remind the human to apply **before** the video is made (the burned-in label can't change later).
