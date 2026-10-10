# E005 · #004 · Goblin Tools · review loop (Free plan test, engine v4)

Auto-captured on goblin.tools (no account): "Clean the garage" at spice levels 1, 3 and 5, one try each (`scripts/auto_capture_goblin.py`, `raw/auto/runs.json`). Visuals are crops and scroll windows of our own screenshots (`raw/auto/derive.py`). Review record: `qa/contact-sheet.jpg`; stills are not committed. Preview platform: ig.

## Engine change
- Free plan tests count a free allowance down. Goblin Tools has no limit, so a countdown would imply one. New: `counter.unlimited` (CreditCounter `unlimited`): the counter counts tries used up ("3 tries used · free, no account, no limit"). Series test re-run for FreeRange.

## Round 1: 3 FAILs
- FAIL: the list screenshots in the result frames were too small to read (whole-page crops shrunk to fit). Fix: crops of the list's text column only, scrolled; text about twice the size.
- FAIL: "How we tested" cards were mostly white space around a small spice control. Fix: tighter crops on shorter cards.
- FAIL: two-line captions squeezed the result frames. Fix: one-line captions on the three result beats.

## Round 2: 1 FAIL
- FAIL: frame 0's "What we gave it" card showed the task tiny, with part of the page cut off. Fix: the task row from the sharp 2x page, scaled up on a clean card.

## Round 3: all PASS

| Check | Result |
| --- | --- |
| Frame 0: complete, readable, a number | PASS: one task line → long list, "One chore became 33 steps." |
| Story: what it is, how we tested, results, catch, price, score, decision | PASS: 10 beats, 47 s |
| Plain words, reading speed, AI tells | PASS: `scripts/plain_check.py` |
| Chapter label on every beat after the hook | PASS |
| The catch shown and circled | PASS: level 5's repairs and repainting circled, "Repairs and paint, not cleaning" |
| Price on screen | PASS: free, no account; Pro $3 a month |
| Score from data/score.md | PASS: 94 = 44 + 15 + 25 + 10 (facts.json `score`) |
| Label, "Not sponsored", "Tested by us" in every frame | PASS |
| Safe zones | PASS: 0 problems on 15 stills |
| Music | PASS: synthwave pop in C major, groove 3 (E004 was groove 1) |
