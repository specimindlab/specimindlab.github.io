# E002 · #002 · TRELLIS 2 · review loop (v4: plain words, new music, release-order number)

## Revision 2026-10-09: hook

- FAIL (found by `scripts/make_batch_file.py`): E001 and E002 are posted back to back and both hooks started "Free AI turned ...", the same first word and the same pattern (CLAUDE.md: no two consecutive uploads open with the same first word or hook pattern).
- Fix: hook and cover "One drawing became a 3D dragon / in 41 seconds." (a time-based outcome); YouTube title "TRELLIS 2: a drawing to a 3D dragon in 41 seconds"; Instagram first line to match. The roundup (E004) was re-rendered after the catalog sync because it shows this cover.
- Checks: plain_check PASS; safe zones 0 problems on all E002 and E004 stills; batch neighbour check PASS.

Was E003 before the renumbering. Same capture as before; new style only. Review record: `qa/contact-sheet.jpg`; stills are not committed. Preview platform: ig.

## v4 round 1: 1 FAIL
- FAIL: notes card title said "The facts" while the caption talked about price. Fix: card title "What it costs" when the beat has a second act.

## v4 round 2: all PASS

Little-known tool (RareSighting), 37.0 s, 7 beats. What a first-time viewer now gets:
- Hook: drawing → 3D dragon before/after under a "Little-known" sticker.
- "What it is" beat with the turning clay dragon; "The result" crops on the wings and horns; "How we tested": one drawing, one try, 41 seconds.
- Two-act notes: what it costs (free 1 try a day; $9 a month), then the catch with the side view circled ("From the side, / the tail is flat.").
- Score 72 "our best 3D tool so far"; Worth it; Not for: you need to download it.

| Check | Result |
| --- | --- |
| Plain words (no private or tech words), AI tells, reading speed <= 2.5 words/s | PASS: `scripts/plain_check.py` |
| Chapter label above every caption after the hook; pictures labelled where needed | PASS |
| Label, "Not sponsored" and mode words visible in every frame | PASS |
| Safe zones | PASS: `scripts/check_safe_zones.py` on every review still |
| Music: own track, brand tag on frame 0 and on the end card, no gags | PASS: electro pop in E major, groove 5 |

## Earlier rounds, old numbering: E003 · Specimen Nº003 · TRELLIS 2 — review loop (Rare Sighting, engine v3)

Review record: `qa/contact-sheet.jpg` (13 review stills at phone size, including `0430-flaw-act2`, the flaw's second act); the stills themselves are not committed. Preview platform: ig.

### Round 1 — 4 FAILs
- FAIL: frame 0 hid the result. The stamp patch covered most of a cropped clay view; nothing on frame 0 said "drawing became 3D". Fix (engine, `RareSighting.tsx`): `stamp-open` takes an optional `before`; frame 0 is now drawing → 3D result, with the RARE SIGHTING stamp shrunk to a sticker over the input's corner.
- FAIL: the flaw was text only, then a 240 px thumbnail (about 77 px on a phone). Fix (engine): the notes beat takes optional `flaw_media` + `flaw_region`; the beat plays in two acts (field notes with the price for 40 %, then the flaw view at full plate size with the ellipse drawing on, and the note under it).
- FAIL: the flaw was mislabelled "from behind". View 7 is a side view (the face is visible). Re-worded everywhere: "Tail flat as a paddle", caption "the side nobody drew."
- FAIL: the music ran a "build" under the flaw. `make_music.py` now gives a notes beat that carries a flaw (`flaw` or `flaw_row`) the flaw role: tape stop, scratch, the music dies with the joke (flaw1@11.0).

### Round 2 — 2 FAILs
- FAIL: the sticker's stamp overlapped "Launched Dec 2025". Fix: smaller stamp, taller patch, the date line lowered.
- FAIL: on the score beat, the 2-line caption ran into the ScoreCard (the card was placed for a 1-line caption). Fix (engine, `endcard.tsx` ScoreBeatView): the card scales down to fit the space above the caption. Applies to every series with a score beat.

### Round 3 — all PASS

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
