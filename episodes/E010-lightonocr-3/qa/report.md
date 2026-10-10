# E010 · #007 · LightOnOCR-3 · review loop (Little-known tool, engine v4)

Auto-captured on LightOn's official demo page (no account): one licensed photo of a handwritten note, demo defaults, one try; compared word by word with our transcription written before the test (`raw/input/SOURCES.md`). Our capture script stopped on a later step, so timing was rebuilt from screenshot file times and the attempt was not re-run (`raw/auto/run.json`). Review record: `qa/contact-sheet.jpg`. Preview platform: ig.

## Verdict note
Score 54 sits between 45 and 60, where data/score.md says the catch decides. The catch changes the note's meaning (names and the last line), which is what handwriting transcription is for, so the verdict is Released (Skip it). Good for: a quick first draft you'll check.

## Round 1: 2 FAILs
- FAIL: our note crops missed the handwriting (wrong coordinates). Fix: measured on a grid; crops of the written part and of the last lines.
- FAIL: the catch's red circle sat under the line (letterboxed image). Fix: a taller crop of the ending and the region moved onto "Ginger Tom" (mid-act still checked).

## Round 2: all PASS

| Check | Result |
| --- | --- |
| Frame 0: complete, a number | PASS: the note → its text, "It read 42 of 46 handwritten words." |
| Story: what it is, result, how we tested, price, the catch, score, decision | PASS: 7 beats, 38 s |
| Plain words, reading speed, AI tells | PASS: `scripts/plain_check.py` |
| The catch shown and circled | PASS: "Ginger Tom" circled, "It read this as 'thing. Love'" |
| Score from data/score.md | PASS: 54 = 20 + 15 + 16 + 3 |
| Label, "Not sponsored", "Tested by us" in every frame | PASS |
| Safe zones | PASS |
| Music | PASS: groove 1 (E009 was groove 2) |
