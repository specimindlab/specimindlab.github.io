# E001 · #001 · Hunyuan3D · review loop (v4: plain words, new music, release-order number)

Was E002 before the renumbering. Same capture as before; new style only. Review record: `qa/contact-sheet.jpg`; stills are not committed. Preview platform: ig.

## v4 round 1: 2 FAILs
- FAIL: the grey lamp was cropped out of its own photo in the test row. Fix: per-item crop in `intro` items.
- FAIL: the dark clay models were hard to read on paper. Fix: lighter clay colour in Turntable.

## v4 round 2: all PASS

Free plan test (FreeRange), 45.0 s, 10 beats. What a first-time viewer now gets:
- Hook still: shiny lamp photo next to its 6 broken pieces, "Free AI turned this lamp / into 6 broken pieces." plus the free-plan counter (6 free tries a day, no account).
- Two "What it is" beats: the orange lamp before/after, then all 3 test photos labelled, so a first-time viewer knows what the tool does before the test.
- Every result shows the photo we gave it as a labelled inset; the catch is circled and explained ("shiny or metal confuses it").
- Price in plain words (Free: grey shapes; colours need an account; paid $9 a month); score 71 said like a person ("Good, not great."); Worth it + Good for / Not for.

| Check | Result |
| --- | --- |
| Plain words (no private or tech words), AI tells, reading speed <= 2.5 words/s | PASS: `scripts/plain_check.py` |
| Chapter label above every caption after the hook; pictures labelled where needed | PASS |
| Label, "Not sponsored" and mode words visible in every frame | PASS |
| Safe zones | PASS: `scripts/check_safe_zones.py` on every review still |
| Music: own track, brand tag on frame 0 and on the end card, no gags | PASS: melodic house in B major, groove 2 |

## Earlier rounds, old numbering: E002 · Specimen Nº002 · Hunyuan3D — review loop (v2, engine v2)

v1 (38.5 s, ambient bed, three platform files) was published in Release batch-2026-10-08 and judged too slow and bland. v2 is the same test, re-cut on engine v2 (prompts/voice.md, data/score.md, scripts/make_music.py). Review record: `qa/contact-sheet.jpg` (every review still at phone size) and `qa/phone-360.png`; the stills themselves are not committed.

### v2 round 1 — 2 FAILs
- FAIL: hook frame weak. A sparse wreck in a short plate under three caption lines doesn't stop a thumb. Fix: before → after (the chrome-lamp photo next to the six-piece mesh), punchline biggest ("This lamp / shattered."). New engine part: `BeforeAfter` (hook and cover).
- FAIL: caption rule blocked one-word punchlines ("Show-off."). Fix: 1–6 words per line (CLAUDE.md updated).

### v2 round 2 — all PASS

| Check | Result |
| --- | --- |
| Frame 0 stops a scroll: complete, sound-off readable, concrete outcome | PASS: before → after + "This lamp / shattered. / Free 3D AI, no login." with the 120 GPU-second counter |
| Pacing | PASS: 24.0 s, 8 beats of 2–4.5 s on the 0.5 s grid; something moves in every beat (counter ticks, turntables, ink, score count, stamp) |
| Voice: humour tied to the result, then useful | PASS: "Confidence: high." → "Six pieces. Zero lamp." → "Kept the table too." → "Total show-off."; lesson + "Use it for / Skip it if" on the end card |
| Music aligned to the edit | PASS: groove 1 (nu-disco, 120 bpm); hook hit at 0.0 s, tape stop + scratch into the flaw at 5.0 s, reading breakdown at 13.0 s, snare roll 16.5 s → crash at 18.0 s = score lock (frame 540, verified in a low-res render), drop 19.5 s |
| Score | PASS: 71/100 by data/score.md, parts add up (28 + 15 + 18 + 10) |
| Label, disclosure ("Unpaid"), mode in every frame | PASS |
| Safe zones | PASS (check_safe_zones.py) |
| Honest flaw on screen and circled | PASS: ellipse + "Chrome confused it" |
| Price and free tier on screen | PASS: price-math card |
| Per-platform end card (superseded in v3) | v2 had one master file with a platform-neutral CTA |
| Every number from facts.json | PASS |

### v3 round (2026-10-09): music v3 + one video per platform

Feedback: the music repeated the same beat through the middle; it must loop seamlessly; each platform needs its own call to action on the end card.

| Check | Result |
| --- | --- |
| Music arranged, not looped | PASS: `hook1@0.0 verse1@2.0 flaw1@5.0 verse2@8.0 verse3@10.5 build1@13.0 roll1@16.5 drop1@19.5`; every section has its own drums, bass, chords and melody, verses climb +2 semitones, fills before every cut; 0 near-identical adjacent bars (v2: 1) |
| Loop seam | PASS: tail folded into the first 2.5 s; level at the end -19.3 dB vs -18.8 dB at the start; no fade on the soundtrack |
| Score lock on the crash | PASS: crash at 18.0 s = ScoreCard lock (frame 540) |
| End card, one video per platform | PASS: yt "Tap our name / for the 3D ranking.", ig "Comment 002 / for the 3D ranking.", x "3D ranking in / the first reply.", hub URL in small print under each; stamp + 71 + Use it for / Skip it if above |
| Captions and posts match the CTA | PASS: YouTube description points to the channel profile link; IG caption + auto-DM on "002"; X first reply carries the link |
| Safe zones (13 stills) | PASS (check_safe_zones.py, 0 problems); the hub URL line was lifted 8 px so its descenders clear y 1440 |
