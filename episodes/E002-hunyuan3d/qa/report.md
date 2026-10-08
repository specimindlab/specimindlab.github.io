# E002 · Specimen Nº002 · Hunyuan3D — review loop (v2, engine v2)

v1 (38.5 s, ambient bed, three platform files) was published in Release batch-2026-10-08 and judged too slow and bland. v2 is the same test, re-cut on engine v2 (prompts/voice.md, data/score.md, scripts/make_music.py). Review record: `qa/contact-sheet.jpg` (every review still at phone size) and `qa/phone-360.png`; the stills themselves are not committed.

## v2 round 1 — 2 FAILs
- FAIL: hook frame weak. A sparse wreck in a short plate under three caption lines doesn't stop a thumb. Fix: before → after (the chrome-lamp photo next to the six-piece mesh), punchline biggest ("This lamp / shattered."). New engine part: `BeforeAfter` (hook and cover).
- FAIL: caption rule blocked one-word punchlines ("Show-off."). Fix: 1–6 words per line (CLAUDE.md updated).

## v2 round 2 — all PASS

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
| One master file, platform-neutral CTA | PASS: "Every score: specimindlab.github.io/002" |
| Every number from facts.json | PASS |
