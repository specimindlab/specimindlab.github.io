# E003 · Specimen Nº003 · TRELLIS 2 — review loop (Rare Sighting, engine v3)

Review record: `qa/contact-sheet.jpg` (13 review stills at phone size, including `0430-flaw-act2`, the flaw's second act); the stills themselves are not committed. Preview platform: ig.

## Round 1 — 4 FAILs
- FAIL: frame 0 hid the result. The stamp patch covered most of a cropped clay view; nothing on frame 0 said "drawing became 3D". Fix (engine, `RareSighting.tsx`): `stamp-open` takes an optional `before`; frame 0 is now drawing → 3D result, with the RARE SIGHTING stamp shrunk to a sticker over the input's corner.
- FAIL: the flaw was text only, then a 240 px thumbnail (about 77 px on a phone). Fix (engine): the notes beat takes optional `flaw_media` + `flaw_region`; the beat plays in two acts (field notes with the price for 40 %, then the flaw view at full plate size with the ellipse drawing on, and the note under it).
- FAIL: the flaw was mislabelled "from behind". View 7 is a side view (the face is visible). Re-worded everywhere: "Tail flat as a paddle", caption "the side nobody drew."
- FAIL: the music ran a "build" under the flaw. `make_music.py` now gives a notes beat that carries a flaw (`flaw` or `flaw_row`) the flaw role: tape stop, scratch, the music dies with the joke (flaw1@11.0).

## Round 2 — 2 FAILs
- FAIL: the sticker's stamp overlapped "Launched Dec 2025". Fix: smaller stamp, taller patch, the date line lowered.
- FAIL: on the score beat, the 2-line caption ran into the ScoreCard (the card was placed for a 1-line caption). Fix (engine, `endcard.tsx` ScoreBeatView): the card scales down to fit the space above the caption. Applies to every series with a score beat.

## Round 3 — all PASS

| Check | Result |
| --- | --- |
| Frame 0 shows the output | PASS: the drawing → the Space's clay render of the 3D dragon, label pinned, both hook lines on screen |
| Frame 0 stops a scroll: sound-off readable, a number | PASS: "One drawing, 41 seconds: / a 3D dragon." (outcome pattern; E002 before it opened disaster-first with "This", E006 after it opens number-shock with "$10") |
| Label, disclosure ("Unpaid"), mode ("Live specimen") in every still | PASS |
| Safe zones | PASS: check_safe_zones.py, 13 stills, 0 problems |
| Captions edge to edge, ≤ 3 lines, no collisions | PASS (score-beat collision fixed in round 2) |
| Flaw on screen and circled | PASS: side view, the paddle tail circled, "Flat paddle tail · side view" |
| Price and free tier on screen | PASS: notes card "1 run a day, no download" + "$9 a month (HF PRO)" |
| Score | PASS: 72/100 by data/score.md (35 + 12 + 15 + 10), counts up and locks on the crash (roll1@15.5) |
| Verdict stamp legible; decision | PASS: CAPTURED + 72, "Use it for: Concept art to a 3D draft / Skip it if: You need the file, logged out", CTA "Comment 003 / for the 3D ranking." + hub URL |
| Real capture, one attempt | PASS: one Generate on the official Space, logged out; 23 earlier quota refusals produced no output (raw/auto/refusals.json); conditions say so |
| Colours | PASS: brand tokens; the black squares are the Space's own render background |
| Music | PASS: groove 3 (French-house filter; E002 groove 1, E006 groove 5); hook1@0.0 hook2@2.5 verse1@5.5 flaw1@11.0 roll1@15.5 drop1@18.5 |
| Duration and grid | PASS: 23.0 s; 2.5 / 3 / 5.5 / 4.5 / 3 / 4.5 s |
| Something moves every beat | PASS: sticker stamp, 8-view stepped turntable (one view per beat), scale bar + clay views, card → flaw swap + ink, score count, stamp |
| Not structurally identical to the previous upload | PASS: stamp-open · output · observation · notes · score · verdict vs E002's counter · observation · flaw · observation ×2 · price-math · score · verdict |
| Every number from facts.json | PASS (41 s, 72, $9, 1 run a day) |

Not claimed: the Space's shaded preview shows the blue body near-black; it looks like a colour-space quirk of the preview, and without the GLB we cannot check the texture, so the video never calls it a flaw (research.md).
