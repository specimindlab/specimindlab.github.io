# E008 · #006 · Hookest · review loop (Free plan test, engine v4)

Auto-captured on hookest.com (no signup): one generation of 5 hooks with the page defaults, describing our own Goblin Tools test (`scripts/auto_capture_hookest.py`, `raw/auto/run.json`). Crops only (`raw/auto/derive.py`); the page's "similar hooks" (other creators' videos) and the YouTube logo are never shown. Calendar row R024 moved from Rare Sighting to Free Range (no signup is the story, and two little-known-tool videos stay apart). Review record: `qa/contact-sheet.jpg`. Preview platform: ig.

## Round 1: 3 FAILs
- FAIL: frame 0's two narrow panels cut the typed text mid-line ("site: it turned the"). Fix: one plate with the first three generated hooks, readable.
- FAIL: the result tags count our picks (#1-#3) while captions named hook numbers ("The third one" under tag #2). Fix: captions without hook numbers after the first ("Another was clickbait.", "One said nothing at all.").
- FAIL: the catch's red circle missed the "11 words · 4.2s" line (letterboxed image). Fix: region moved onto the line.

## Round 2: all PASS

| Check | Result |
| --- | --- |
| Frame 0: complete, readable, a number | PASS: three real hooks under "We asked AI for 5 hooks. Only 2 were usable." |
| Story: what it is, how we tested, results, catch, price, score, decision | PASS: 10 beats, 45 s |
| Plain words, reading speed, AI tells | PASS: `scripts/plain_check.py` |
| The catch shown and circled | PASS: best hook 4.2 s, past its own 3-second window |
| Score from data/score.md | PASS: 77 = 27 + 15 + 25 + 10 |
| Label, "Not sponsored", "Tested by us" in every frame | PASS |
| Safe zones | PASS: 0 problems on 15 stills |
| Music | PASS: groove 4 (E007 was groove 5) |
