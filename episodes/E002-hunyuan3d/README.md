# E002 · 002 · Hunyuan3D

**Series:** Free Range (FR) · **Mode:** Live specimen · **Pillar:** 3D · **Planned post:** 2026-10-19 18:30 IST (slot B)

**The test:** Photo of a desk lamp to mesh; inspect the thin arm

**Free path (from the calendar, unverified):** Free: ~20 generations/day, open weights

**Draft hook (rewrite after the test):** Tencent's free 3D generator vs my desk lamp.

## Capture checklist (one attempt only)

- [ ] Download the exact input from [raw/input/](https://github.com/specimindlab/specimindlab.github.io/tree/main/episodes/E002-hunyuan3d/raw/input). If it is empty, prepare the input the test describes ("Photo of a desk lamp to mesh; inspect the thin arm") and upload it to raw/input/ first, so the test can be repeated.
- [ ] Open Hunyuan3D on the free plan described here: Free: ~20 generations/day, open weights. Do not use a paid plan or trial credits unless the brief says so.
- [ ] OBS: Settings → Output → Output mode: Advanced → Recording: encoder x264, rate control CBR, bitrate 2500 Kbps; Settings → Video: 1920×1080 canvas, 30 fps. This keeps a 60 s recording under GitHub's 25 MB upload limit.
- [ ] Start recording **before** you click Generate. Do not cut anything; we measure seconds to result from the recording.
- [ ] Use the tool's default settings unless the test says otherwise. Note any setting you changed.
- [ ] Stop recording when the finished result is fully visible (for 3D, rotate it once in the viewer).
- [ ] Download the result in its native format (MP4 / PNG / GLB / WAV) without editing it.
- [ ] If you needed more than one attempt, write how many in raw/notes.txt (the Conditions card must say so).
- [ ] Write in raw/notes.txt anything a viewer cannot see: queue time, credits used, credits left, any error.

### Files to upload

Drag them onto **[episodes/E002-hunyuan3d/raw](https://github.com/specimindlab/specimindlab.github.io/upload/main/episodes/E002-hunyuan3d/raw)** and click *Commit changes* (25 MB per file):

- `E002-screen.mp4`: the OBS recording
- `E002-result.<ext>`: the downloaded result (several tools: `E002-result-<tool>.<ext>`)
- `notes.txt`: attempts, credits used / left, anything unusual

## Files in this folder (created by the playbooks)

`brief.json` (calendar row) · `research.md` + `facts.json` (Playbook R) · `script.json`, `cover.png`, `E002.srt`, `qa/` (Playbook V) · `meta/` (Playbook P) · `raw/` (your uploads).

## Capture status (2026-10-08)

Auto-captured by prompt B on the official Hugging Face Space `tencent/Hunyuan3D-2.1`, logged out, no token: three lamp photos (`raw/input/`, Unsplash License, see SOURCES.md) → three untextured GLBs in `raw/auto/` with a run log each (`*.run.json`: wall time, queue time, the Space's own GPU timer, seed). One textured attempt was refused for lack of GPU quota (`raw/auto/textured/`). Script: `scripts/auto_capture_hf.py`; clay renders and mesh stats: `scripts/glb_inspect.mjs` → `qa/ingest/`. Nothing for the human to record.
