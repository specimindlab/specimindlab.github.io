---
name: rerelease
description: Render a SPECIMIND batch again on GitHub and replace its Release zip (after an engine or music change, or when a render failed). Use when the human types /rerelease.
argument-hint: "<batch name, default: the latest batch>"
disable-model-invocation: true
---

# /rerelease: render a batch again

Arguments: `$ARGUMENTS` (a batch name such as `batch-2026-10-19`; default: the newest file in `data/batches/`).

1. `git pull origin main`; read `prompts/ops-notes.md`. Check `data/batches/<batch>.json` exists and every episode in it has script.json, cover.png, `<id>.srt` and meta/ (`python3 scripts/make_batch_file.py <ids> --keep-order --dry-run` lists anything missing).
2. If any episode in the batch is already posted (`python3 scripts/channel_status.py`), say so: the new zip will contain videos that are already out, and the human should not upload those again.
3. `python3 scripts/build_posting.py data/batches/<batch>.json`; commit and push if the package changed.
4. If step 3 changed `data/batches/<batch>.json` itself, that push already started the render: watch that run instead of dispatching a second one. Otherwise dispatch: `gh api -X POST repos/specimindlab/specimindlab.github.io/actions/workflows/render.yml/dispatches -f ref=main -f inputs[batch]=<batch>`. Find the run (`actions/runs?per_page=3`) and watch it in the background until it finishes. On failure read the annotations and job log, fix the cause, push, dispatch again. Stop after 3 failed runs.
5. Confirm the Release `<batch>` holds exactly one asset, `specimind-<batch>.zip`. Download it (REST asset download) and spot-check one video (frame grid + waveform) and the file list.
6. Reply with the Release link, the run time, and anything that failed.
