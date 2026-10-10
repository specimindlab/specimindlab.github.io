# E007 · #005 · Liquid AI d1 (Quick Draw) · review loop (Little-known tool, engine v4)

Auto-captured on Liquid AI's free demo page (no account): one round of Quick Draw, our own line drawings (`scripts/quickdraw_strokes.py`, checked only by rendering them locally, never against the model beforehand), drawn stroke by stroke with a scripted mouse (`scripts/auto_capture_quickdraw.py`, `raw/auto/run.json`). Visuals are crops of our own screenshots (`raw/auto/derive.py`). Review record: `qa/contact-sheet.jpg`. Preview platform: ig.

## Round 1: 2 FAILs
- FAIL: frame 0's "Little-known" sticker covered the drawing. Fix: before → after (half-drawn snowman → its guess), drawings cropped tighter.
- FAIL: the timing bar said "seconds to make it" (it guesses, it doesn't make). Fix (engine): optional `seconds_label` on Rare Sighting observations ("seconds to guess it").

## Round 2: 2 FAILs
- FAIL: picture labels "What we gave it / What it made" were wrong for a guessing game. Fix (engine): optional `labels` on Rare Sighting stamp-open and observation (passed to BeforeAfter, ObservationPlate and the cover): "While we drew / Its guess: snowman".
- FAIL: the catch's red circle spilled over the note line. Fix: tighter flaw region. RareSighting and FieldSpecimen fixtures re-rendered: OK.

## Round 3: all PASS

| Check | Result |
| --- | --- |
| Frame 0: complete, readable, a number | PASS: "It guessed 5 of our 6 drawings." over the half-drawn → guessed snowman |
| Story: what it is, results, how we tested, price, the catch, score, decision | PASS: 7 beats, 38.5 s |
| Plain words, reading speed, AI tells | PASS: `scripts/plain_check.py` |
| The catch shown and circled | PASS: apple stuck at 75%, the game needs 85% (mid-act still checked) |
| Score from data/score.md | PASS: 81 = 47 + 15 + 16 + 3 |
| Label, "Not sponsored", "Tested by us" in every frame | PASS |
| Safe zones | PASS: 0 problems on 12 stills |
| Music | PASS: groove 5 (E006 was groove 6) |
