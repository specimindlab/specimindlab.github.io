# E002 · Specimen Nº002 · Hunyuan3D — review loop

Stills: `qa/stills/` (frame 0, every beat boundary + 1 s, 25/50/75 %, last frame; platform `ig`), contact sheet `qa/stills/contact-sheet.png`, phone size `qa/phone-360.png`, cover `cover.png` (+ `qa/stills/cover-360.png`). Ingest clay renders: `qa/ingest/`.

## Round 1 (2026-10-08) — 2 FAILs
- FAIL: results unreadable. Free Range pinned three equal plates in a row (270 px wide); the meshes, in light storyboard clay on archival white, were specks on a phone. Proof: first contact sheet (overwritten).
- FAIL: the pin-steel framing wasted the plate: turntables framed the bounding sphere, so a wide flat mesh filled ~30 % of its plate.

Fixes (engine, all series benefit): `video/src/series/FreeRange.tsx` now shows the current result in a large hero plate with earlier results as 136 px thumbnails in the right column (x 870–1006, no text); the flaw beat puts the weakest result in the hero plate. `video/src/system/Turntable.tsx`: lit clay in pin steel, and framing by horizontal radius and height instead of the bounding sphere.

## Round 2 — 1 FAIL
- FAIL: `check_safe_zones.py`: thumbnail border strokes reached x 1011 (4 stills). Fixed: thumbnails 136 px wide.
- Contact sheet had an empty row (the new cover thumbnail was counted). Fixed in `scripts/render_previews.sh`.

## Round 3 — all PASS

| Check | Result | Proof |
| --- | --- | --- |
| First frame shows the output (or diagram) | PASS by series design: Free Range opens on the counter (data/series.md, "the counter IS the structure"); the hook states our number ("Three lamps cost 55 free seconds."). Output appears from 3.5 s. | 0000-first.png, 0030-beat01-counter.png |
| Label, disclosure word ("Unpaid") and mode ("Live specimen") in every still | PASS | all stills |
| No text in bottom 480 px or right 150 px; nothing clipped | PASS: `check_safe_zones.py`: 12 stills, 0 problems (cover follows the cover template instead: content to y 1640) | qa/stills/[0-9]*.png |
| Every caption line spans the content width; ≤ 3 lines; no descender collisions | PASS | contact-sheet.png |
| Flaw on screen and circled; price and free tier on screen | PASS: ellipse on the shattered chrome lamp + "6 loose pieces"; price math card: 120 GPU s a day logged out, $9 a month (HF PRO) | 0945-beat06-flaw.png, 0705-beat05-price-math.png |
| Brand colours only; no gradients, glow | PASS (3D shading is lighting on pin steel) | all |
| Verdict stamp legible; ends on the frozen counter (Free Range ending) | PASS: CAPTURED, counter frozen at 65 left | 1065-beat07-verdict.png |
| Readable at phone size (360 px) | PASS | qa/phone-360.png |
| Audio plan | PASS: bed `sfx/bed-2.wav` (no previous upload), effects from the components, motif on the end card; -14 LUFS is enforced in render.yml | script.json |
| Duration 28–40 s; loop | PASS: 38.5 s. Last frame (counter card) returns to the first beat's counter card | 1154-last.png, 0000-first.png |
| Not structurally identical to the previous episode | PASS: no previous upload; Free Range structure (counter → 3 observations → price math → flaw → verdict) | script.json |
| Every number from facts.json | PASS: 120 GPU s (ZeroGPU docs), 19/37/55 used (Space timer), 21/18/22 s (measured), $9 (HF pricing), 6 pieces (glb_inspect.mjs components) | facts.json |

Known limits (not fixed here, reported): inputs are Unsplash photos, not our own (no upload in raw/input); the observation beat shows results only, not the Space's interface, because Free Range's observation has no input/recording slot.
