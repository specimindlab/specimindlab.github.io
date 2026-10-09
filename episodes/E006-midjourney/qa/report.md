# E006 · Specimen Nº006 · Midjourney — review loop (Field sketch, engine v3)

Review record: `qa/contact-sheet.jpg` (every review still at phone size); the stills themselves are not committed. Preview platform: ig (the busiest CTA); yt and x differ only in the end-card lines.

## Round 1 — 3 FAILs
- FAIL: frame 0 showed an empty plate. FieldSketch drew the diagram from frame 4, so the opening still was a blank box under the hook (CLAUDE.md: frame 0 must already show the redrawn diagram). Fix (engine, `video/src/series/FieldSketch.tsx`): the first beat's diagram is complete on frame 0; the beat's motion is a red ink loop around the tool box, drawn on from frame 15. New export `sketchLayout()` in `video/src/system/Sketch.tsx` gives callers the box geometry.
- FAIL: the cover was an empty plate (no media in a Field sketch). Fix (engine, `video/src/series/Cover.tsx`): with no media and a `sketch` beat, the cover draws our redrawn diagram in the plate.
- FAIL: the red ellipse on the "Documented limitation" row ran through "Pu…" and "…$60" (the loop was sized to the text box, not to clear its corners, and tilted 4° over 500 px). Fix (engine, `video/src/system/InkMark.tsx`): for wide, short targets (w/h > 3) the radii clear the box corners and the tilt is flattened. Taller targets (plate regions, as in E002) keep the old geometry.
- Also: hook cut from 3 lines to 2 ("$10 to start. / $60 to go private.", 7 words) so the diagram gets a taller plate; "No free tier" stays on the notes card.

## Round 2 — all PASS

| Check | Result |
| --- | --- |
| Frame 0 shows the redrawn diagram, not a title card | PASS: diagram complete, label pinned, both hook lines on screen |
| Frame 0 stops a scroll: sound-off readable, a number | PASS: "$10 to start. / $60 to go private." (number-shock; E002 opened disaster-first with "This") |
| Label, disclosure ("Unpaid"), mode ("Field sketch – not hands-on", enlarged) in every still | PASS |
| Safe zones | PASS: check_safe_zones.py, 10 stills, 0 problems |
| Caption lines edge to edge, ≤ 3 lines, no descender collisions | PASS |
| Flaw on screen and circled; source shown | PASS: "Public unless you pay $60", circled, source docs.midjourney.com |
| Price and free tier on screen | PASS: notes card (Free tier: none on web or Discord; Paid from $10 a month) + price math (200 GPU minutes, ~1 min and 4 images a prompt, about 1.3 cents an image) |
| No score (not hands-on) | PASS: Field sketches get no score (data/score.md) |
| Verdict stamp legible | PASS: WATCH over the faded sketch, CTA "Comment 006 / for the price map." + hub URL |
| Colours only brand tokens; no gradients, glow | PASS |
| Phone size (360 px) | PASS: contact sheet read at 360 px; card keys are small but values and captions read |
| Music | PASS: groove 5 (synth-pop; E003 before it is groove 3); hook1@0.0, build1@4.0 (notes), build2@8.5 (price math), flaw1@13.0 = flaw beat, drop1@17.5 = verdict |
| Duration and grid | PASS: 22.0 s; beats 4 / 4.5 / 4.5 / 4.5 / 4.5 s |
| Loop | PASS: the last frame is the same diagram (faded, stamped) as frame 0 |
| Not structurally identical to the previous upload | PASS: sketch · notes · price-math · flaw · verdict vs E003's stamp-open · output · observation · notes · score · verdict |
| Every number from research.md / facts.json | PASS |
