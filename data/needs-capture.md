# Needs capture

Episodes a batch skipped because they need **you** to record the test (a commercial tool whose free tier needs your login). Never faked, never downgraded to a Field sketch. Prompt C turns this list into a capture session; tick an item when its files are in `episodes/<id>/raw/`.

## E001 · 001 · Tripo (Field Specimen, Live specimen)

Skipped by batch-2026-10-08: `episodes/E001-tripo/raw/` was empty, and Tripo's free tier needs a login (tripo3d.ai is also behind a Cloudflare bot check, so it cannot be auto-captured).

- [ ] Put the exact input in [raw/input/](https://github.com/specimindlab/specimindlab.github.io/tree/main/episodes/E001-tripo/raw/input): one phone photo of a real mug, handle visible, plain background. Upload it before the test so it can be repeated.
- [ ] Log in to Tripo on the **free plan** (no paid plan, no trial credits).
- [ ] OBS: Settings → Output → Output mode: Advanced → Recording: encoder x264, rate control CBR, bitrate 2500 Kbps; Settings → Video: 1920×1080 canvas, 30 fps (keeps 60 s under GitHub's 25 MB upload limit).
- [ ] Start recording **before** you click Generate. One attempt, default settings. Stop when the textured model is fully visible; rotate it once in the viewer.
- [ ] Download the model as GLB without editing it.
- [ ] Write `raw/notes.txt`: attempts, credits used and left, queue time, anything unusual.
- [ ] Upload to [episodes/E001-tripo/raw](https://github.com/specimindlab/specimindlab.github.io/upload/main/episodes/E001-tripo/raw): `E001-screen.mp4`, `E001-result.glb`, `notes.txt` (25 MB per file).
