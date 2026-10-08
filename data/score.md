# The SPECIMIND Score

One number out of 100 for every Live specimen, so every AI tool we test can be ranked against every other one in its drawer (3D, Video, Image, Audio, Work, Build ...), the way a phone benchmark ranks phones. It is computed from the test itself, by these rules, and published with its four parts in the video, on the specimen page and in the leaderboards. Field sketches (not hands-on) get **no score**: we never score what we did not test.

**Score = Result (50) + Speed (15) + Free tier (25) + Price (10).**

## Result · 0–50: what came out
Judged per run against the drawer's checklist, then averaged over the runs in the video (one attempt per run, so failures count). Each run starts at 50 and loses points:

| Drawer | Deductions per run |
| --- | --- |
| 3D | broken into pieces / not one closed mesh −25 · thin parts lost −10 · extra geometry (table, background) −8 · wrong silhouette −15 · no texture when the test asked for it −8 |
| Image | wrong subject or count −20 · melted hands, faces or text −12 each · visible artefacts −8 · ignores an explicit instruction −10 |
| Video | physics break (things morph, run backwards) −15 · identity drift −12 · flicker or warping −8 · ignores the prompt −15 · shorter than asked −5 |
| Audio | wrong thing generated −25 · clipping or artefacts −10 · cut-off tail −6 · ignores duration −5 |
| Work / Build | each requested feature or section that does not work −15 · factual error −10 · needs manual fixes to be usable −8 |

Minimum 0 per run. Write each run's deductions in facts.json (`score.result_runs`).

## Speed · 0–15: seconds to result (excluding queue), measured
| Drawer | 15 | 12 | 9 | 5 | 2 |
| --- | --- | --- | --- | --- | --- |
| 3D, Image, Audio | ≤ 30 s | ≤ 60 s | ≤ 120 s | ≤ 300 s | slower |
| Video | ≤ 60 s | ≤ 120 s | ≤ 300 s | ≤ 600 s | slower |
| Work / Build | ≤ 60 s | ≤ 180 s | ≤ 600 s | ≤ 1800 s | slower |

## Free tier · 0–25: what you get for nothing
- **Access** (0–5): no login 5 · free account 3 · card required for the free tier 0.
- **Volume** (0–10): results of this test per day on the free tier: ≥ 20 → 10 · ≥ 5 → 7 · ≥ 1 → 4 · per month only: ≥ 20 → 5, ≥ 5 → 3 · less → 1.
- **Completeness** (0–10): the full feature free 10 · the core works but a key part is locked (textures, HD, export) 6 · watermark or low resolution only 3 · demo only 1.

## Price · 0–10: the cheapest way to pay
Cheapest paid plan per month: ≤ $10 → 10 · ≤ $20 → 8 · ≤ $40 → 5 · ≤ $100 → 3 · more → 1 · not published → 3. Open weights you can run yourself add nothing (most viewers cannot) but are noted on the page.

## Verdict and score
The verdict stays a judgement on the test, but it must agree with the score unless the page says why: **Captured** usually ≥ 60 · **Released** usually < 45 · in between, the flaw decides.

## Worked example: Nº002 Hunyuan3D (71)
The test asked for a mesh (shape only), so no texture deductions.
- Result 28/50: chrome lamp 0 (pieces −25, thin parts lost −10, wrong silhouette −15) · grey lamp 42 (tabletop kept −8) · orange lamp 42 (the block it stands on kept −8) → (0 + 42 + 42) / 3 = 28.
- Speed 15/15: 18–22 s.
- Free tier 18/25: no login 5 · about 6 shapes a day 7 · textures locked 6.
- Price 10/10: Hugging Face PRO, $9 a month.

Keep every number in facts.json under `score` so the site, the video and llms.txt all show the same one.
