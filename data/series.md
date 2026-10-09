# SPECIMIND series

Source: the Series sheet of `data/specimind-90-day-calendar.xlsx` (purpose, mode, signature opening, episode count).
The beat structures below are the house definition. Each Remotion composition in `video/src/series/` implements exactly one of them, and `script.json` must follow its series' structure.

**On screen, never use these series names or the beat-type words below.** They are internal. Viewers see plain words (prompts/voice.md v3): Full test · Free plan test · Little-known tool · Head to head · Research only · AI or real? · Workflow · Roundup · Shut down; verdicts Worth it / Skip it / Not tested; modes "Tested by us" / "Not tested · research only". Every series now tells the v3 story (what it is, what we did, what happened, the catch, the price, the score, should you use it) inside its own beat order, 35–55 s, with an optional `intro` beat (Free Range, Rare Sighting) for "What it is" / "How we tested".

**Why each series gets its own structure:** YouTube's July 2026 guidance on inauthentic or templated content targets channels whose uploads share one skeleton with only the nouns swapped. Our series share a visual language (paper, labels, pins, ink), but each one has a different **first beat**, a different **beat order**, a different **central device** and a different **ending**. CLAUDE.md forbids borrowing one series' structure for another.

## Shared vocabulary

| Beat type | What is on screen |
| --- | --- |
| `output` | The tool's finished result on a Plate (video, image or 3D turntable) |
| `conditions` | The "Collection conditions" card: input, plan, attempts, retries, edited |
| `observation` | The real capture (input → result) with the ScaleBar showing measured seconds |
| `notes` | The "Field notes" card: habitat, feeds on, free tier, paid from, best for, weakness |
| `flaw` | The flaw, circled in red ink on the output or on the notes card |
| `verdict` | Stamp (Captured / Released / Watch / Rare sighting) and the drawer; optional `use_for` / `skip_if` |
| `score` | The SPECIMIND Score card (data/score.md): number out of 100 + four bars, locks on the music's crash |
| `cta` | The end card's platform CTA (yt "Tap our name…", ig "Comment {code}…", x "…first reply") with the hub URL in small print under it; one video per platform |
| `counter` | CreditCounter: credits used / left, or generations per day |
| `stamp-open` | The RARE SIGHTING stamp lands first, with the launch date |
| `triptych` | Three plates in columns under one shared input card |
| `sketch` | Pencil-line diagram redrawn from public information |
| `price-math` | The price worked out on a card: what one month buys |
| `split` | A/B split screen, with no labels |
| `countdown` | 3-2-1 in catalog digits before the reveal |
| `tray` | Numbered dissection stages, one tool per stage |
| `drawer` | The drawer itself: labels light up one by one |
| `extinct` | Ink-black label with a red strike; successors pinned beside it |

Every series keeps these on screen for the **whole** video: the pinned label (code, tool, genus), the mode label ("Live specimen" or "Field sketch — not hands-on") and the disclosure word ("Affiliate" or "Unpaid").

Durations are targets. The composition computes its total from `script.json`: 35–55 s is the target (prompts/voice.md v3), 18–60 s is enforced, and every beat is a multiple of 0.5 s so cuts land on the 120 bpm music (scripts/make_music.py). All nine series are on v2 pacing; their fixtures run 22–25 s. Every series ends on the shared end card (`video/src/series/endcard.tsx`): the stamp, the score (Live), the decision card where the series has one, the series' own signature (drawer, frozen counter, spotted date, totals, successors), then the platform CTA.

---

## 1. Field Specimen — `FS` · composition `FieldSpecimen` · 52 episodes

- **Purpose:** the flagship. One tool, one real test, a conditions card, the flaw, the verdict.
- **Mode:** Live specimen.
- **Signature opening:** a cold open on the output, followed by the full anatomy.
- **Structure (v2, 20–30 s; fixture 23 s):**
  1. `output` ~2.5 s. Frame 0 is complete: the result (or `before` → after) and the hook with a number from our test.
  2. `conditions` ~2.5 s. Caption: the rules of the test ("One photo. One try.").
  3. `observation` ~5–6 s. Input → result, ScaleBar filled to the measured `seconds_to_result`. Caption points the eye ("Watch the handle.").
  4. `notes` ~4.5 s. The Field notes card; the weakness row is circled in red ink (the flaw: the music dies). Caption: "Honest flaw: …".
  5. `score` ~3 s. The SPECIMIND Score counts up and locks on the crash (Live only).
  6. `verdict` ~4.5 s. The end card: stamp + score, "Use it for / Skip it if", the drawer if it fits, the platform CTA + hub URL.
- **Ends on:** the drawer cell with this code highlighted.

## 2. Free Range — `FR` · composition `FreeRange` · 26 episodes

- **Purpose:** what the free tier actually gets you, in numbers, told as a story on the counter.
- **Mode:** Live specimen.
- **Signature opening:** the counter with the most dramatic real result on frame 0 (before → after when the input is a photo).
- **Structure (v2, 20–30 s, beats on the 0.5 s grid):**
  1. `counter` ~2 s. The CreditCounter at its start value + the hook visual (`media`, optional `before`). Hook caption: the outcome with a number.
  2. `observation` × 2–3, ~2.5–3 s each, with **one `flaw` placed right after the observation it is about** (the comedy beat: the music dies). Each generation ticks the counter down; earlier results pin as thumbnails.
  3. `price-math` ~3.5 s. Free = N results per day/month; the first paid tier.
  4. `score` ~3 s. The SPECIMIND Score counts up and locks on the crash (`data/score.md`).
  5. `verdict` ~4.5 s. Stamp + score, "Use it for / Skip it if", the counter frozen if it fits, the hub URL.
- **Ends on:** the frozen counter and the decision card.
- **Differs from FS:** no conditions card. The counter is the structure; the notes card is replaced by the price math.

## 3. Rare Sighting — `RS` · composition `RareSighting` · 32 episodes

- **Purpose:** a tool most people haven't heard of yet. Speed beats polish.
- **Mode:** Live specimen or Field sketch.
- **Signature opening:** the RARE SIGHTING stamp and the launch date.
- **Structure (v2, 20–30 s; fixture 22 s):**
  1. `stamp-open` ~2 s. The stamp lands over a sharp crop of the output; launch date in catalog digits ("Launched 3 Oct").
  2. `output` ~3 s. The full result; the caption says what it does in one line.
  3. `observation` ~5–6 s. A single run, with the ScaleBar.
  4. `notes` ~4 s (3 rows: habitat / free tier / paid from), with the `flaw` circled inside.
  5. `score` ~3 s (Live only).
  6. `verdict` ~4 s. End card: "Watch" in Field sketch mode, otherwise Captured or Released, with score, decision and the platform CTA.
- **Ends on:** the "spotted" date line under the stamp.
- **Differs from FS:** it opens on the stamp, not the output, and uses a 3-row notes card. There is no conditions card.

## 4. Plate — `PL` · composition `Plate` · 13 episodes

- **Purpose:** same input, three tools, a side-by-side triptych. The highest search intent of all the series.
- **Mode:** Live specimen.
- **Signature opening:** three columns under one shared input card, ranked at the end.
- **Structure (v2, 20–30 s; fixture 25 s):**
  1. `triptych` ~2.5 s. Input card on top, three plates. Caption: "Same photo. Three tools."
  2. `triptych-fill` ~8–9 s. The plates fill one by one, each with its own small ScaleBar (seconds).
  3. `flaw` ~5 s. One ink circle per plate, each with a 2–4-word note.
  4. `verdict` ~5 s. Rank tags 1–3 pin on with each plate's SPECIMIND Score; the winner gets the Captured stamp.
  5. `cta` ~3.5 s. The platform CTA + hub URL over the ranked triptych.
- **Ends on:** the ranked triptych.
- **Differs from FS:** three specimens on one sheet, flaws compared side by side, and a ranking instead of a single verdict.

## 5. Field Sketch — `SK` · composition `FieldSketch` · 13 episodes

- **Purpose:** a desk study of a paid tool, labelled "not hands-on". The verdict is always "Watch".
- **Mode:** Field sketch.
- **Signature opening:** pencil-line diagrams redrawn from public information, then the price math.
- **Structure (v2, 20–30 s; fixture 22 s):**
  1. `sketch` ~4 s. The redrawn diagram (what goes in, what comes out) draws itself line by line. The "Field sketch — not hands-on" mode label is larger than usual.
  2. `notes` ~5 s, built from research.md: habitat, feeds on, plans.
  3. `price-math` ~5 s. The cheapest way in, and what it buys.
  4. `flaw` ~4 s. The most important documented limitation, circled. `flaw_source` is always `research`.
  5. `verdict` ~4 s. The Watch stamp over the sketch + the platform CTA. No score (not hands-on).
- **Ends on:** the Watch stamp over the sketch.
- **Never shows:** generated output presented as our own. Any example image must be our own redrawing.

## 6. Mimicry — `MI` · composition `Mimicry` · 13 episodes

- **Purpose:** AI or real? Viewers comment A or B, and the answer is revealed at the end.
- **Mode:** Live specimen.
- **Signature opening:** a split screen A/B; the answer is revealed after a 3 s countdown.
- **Structure (v2, 20–30 s; fixture 22.5 s):**
  1. `split` ~5–6 s. A and B, unlabelled. Caption: the question ("One is Photoroom. One is a camera.").
  2. `details` ~5–6 s. Matched crops from A and B, with no hints in the text.
  3. `countdown` 3 s. 3, 2, 1, one per beat of the music.
  4. `reveal` ~4 s. The AI side gets its specimen label pinned on; the real side gets "Real" in ink. The `flaw` that gave it away is circled.
  5. `cta` ~3.5 s. Per platform: IG "Comment A or B before you rewatch.", YT "A or B? Comment before you rewatch.", X "A or B? Reply before you rewatch."; hub URL under it.
- **Ends on:** the revealed split, which loops back cleanly to the unlabelled split.
- **Differs from FS:** the output is hidden in plain sight, the flaw is the punchline, and nothing is identified until the reveal.

## 7. Dissection — `DS` · composition `Dissection` · 13 episodes

- **Purpose:** a workflow that chains 2–3 tools to make one finished thing.
- **Mode:** Live specimen.
- **Signature opening:** numbered stages laid out like a dissection tray.
- **Structure (v2, 20–30 s; fixture 25 s):**
  1. `output` ~2.5 s. The finished thing, followed straight away by
  2. `tray` ~2.5 s. The empty tray with numbered wells 1–3 and the tool names on small tags.
  3. `observation` × 2–3, ~4 s each. Each stage fills its well, with its own seconds; the stages are joined by ink arrows.
  4. `flaw` ~3.5 s. The weakest stage is circled.
  5. `verdict` ~4.5 s (on the whole workflow). Total time and total cost (often "0") in catalog digits, the platform CTA.
- **Ends on:** the full tray with the totals.
- **Differs from FS:** several tools and a stage-by-stage tray; the verdict judges the chain.

## 8. The Drawer — `DR` · composition `Drawer` · 12 episodes

- **Purpose:** the Sunday recap. Every specimen pinned this week, in 30 s.
- **Mode:** built from the week's renders, using `data/catalog.json` and each episode's facts.json. No new capture is needed.
- **Signature opening:** the drawer opens, and each label lights up with its verdict.
- **Structure (v2, 20–30 s; fixture 24 s):**
  1. `drawer-open` ~2 s. Caption: "Week N."
  2. `roll-call` ~2–3 s per specimen: the label lights up, its verdict mini-stamp lands, its score and a 2–4-word flaw note appear.
  3. `tally` ~3 s. The counts per verdict.
  4. `cta` ~3 s: a teaser for next week (a covered label) + the platform CTA to this week's rankings (IG "Comment W01 for the rankings.").
- **Ends on:** the drawer sliding shut.
- **Rule:** the Drawer reads catalog data and never invents a verdict.

## 9. Extinction Watch — `EX` · composition `ExtinctionWatch` · 6 episodes

- **Purpose:** a tool or model that died or changed, and what replaced it.
- **Mode:** Field sketch.
- **Signature opening:** an ink-black label and a crossed-out specimen, then the successors pinned beside it.
- **Structure (v2, 20–30 s; fixture 24 s):**
  1. `extinct` ~3 s. The black label with the dead tool's name; the red strike draws across it. Caption: what happened, with a date.
  2. `timeline` ~5 s: launch → change → closure (dates from research.md).
  3. `successors` ~8 s. Three small labels pin in beside it, each with its free tier and one line.
  4. `flaw` ~3.5 s. The catch shared by the successors, circled.
  5. `verdict` ~4.5 s. Watch, with the best successor circled, + the platform CTA.
- **Ends on:** the extinct label with its successors pinned around it.

---

## Totals

| Series | Code | Composition | Episodes in 90 days | Mode |
| --- | --- | --- | --- | --- |
| Field Specimen | FS | FieldSpecimen | 52 | Live specimen |
| Free Range | FR | FreeRange | 26 | Live specimen |
| Rare Sighting | RS | RareSighting | 32 | Live or Field sketch |
| Plate | PL | Plate | 13 | Live specimen |
| Field Sketch | SK | FieldSketch | 13 | Field sketch |
| Mimicry | MI | Mimicry | 13 | Live specimen |
| Dissection | DS | Dissection | 13 | Live specimen |
| The Drawer | DR | Drawer | 12 | Built from the week's renders |
| Extinction Watch | EX | ExtinctionWatch | 6 | Field sketch |
| **Total** | | | **180** | |

Catalog code prefixes: `###` single specimens · `P##` Plates · `M##` Mimicry · `D##` Dissections · `W##` Drawer weeks · `X##` Extinction Watch · `TBD` Rare Sighting slots, where the code is assigned when the tool is chosen (the next free `###`; never renumber).
