# SPECIMIND: rules for every session

A captions-only YouTube Shorts / Instagram Reels / X channel that tests new AI tools. Repo map: `brand/` brand kit · `data/` calendar, series, schedule, batch state, batches · `prompts/` prompt pack and playbooks · `video/` Remotion project · `scripts/` pipeline · `site/` catalog hub · `episodes/` one folder per made episode · `captures/` capture requests waiting for the human's recordings (no number yet).

## Commands (the human types these; `.claude/skills/<name>/SKILL.md` holds each one's steps)
`/batch N [R###…] [note]` make the next N videos and release one zip · `/channel` dashboard and menu · `/captures [N]` the human's recording checklist · `/scout [N] [topic]` plan new tools into the calendar · `/posted E### <links>` put post links on the hub · `/revise E### <change>` fix a made episode and re-release · `/rerelease <batch>` render a batch again · `/affiliate <code> <url>` add an affiliate link with disclosures · `/weekly` review analytics and plan next week.
Every command starts with `git pull` and `python3 scripts/channel_status.py` (the SessionStart hook prints `--brief`), and reads `prompts/ops-notes.md` (hard-won lessons: add one whenever a batch teaches us something). If the human asks for any of these in their own words, follow the matching SKILL.md. Helpers: `scripts/new_episode.py make|capture|next|status`, `scripts/make_batch_file.py` (slots in number order, neighbour checks, moves schedule.json; `--check <batch>`, `--refresh <batch>` after copy edits), `scripts/build_posting.py`.

## Voice, story and money (read prompts/voice.md v3 before writing any script or copy)
- **Plain words on screen, always.** Keep the look (paper, pins, labels, red ink, stamps), change the words: a 14-year-old must understand every line on the first read. Never show our internal names (Live specimen, Field sketch, Captured, Released, Watch, Free Range, Rare Sighting, Habitat, Feeds on, Specimen Nº) or tech words (chrome, mesh, GLB, GPU seconds, logged out, Space). On screen: "Tested by us" / "Not tested · research only", "Worth it" / "Skip it" / "Not tested", "Not sponsored" / "Affiliate link", "#002", "The facts", "How we tested", "The catch", "Good for / Not for". The engine's own words live in `video/src/vocab.ts`; data files keep the internal names.
- **Every video tells the story:** hook (real result + plain outcome) → what the tool is, in one sentence → what we did → what happened (labelled pictures) → the catch → free vs paid → our score → should you use it → CTA. Every beat after the hook carries a chapter label. 35–55 s (18–60 enforced).
- **Reading time:** at most 2.5 words per second of a beat (caption + card rows). Captions are spoken-style sentences, 1–3 lines of up to 7 words. Run `python3 scripts/plain_check.py E###` (jargon, AI-writing tells, reading speed): it must PASS before review.
- **Sounding human:** no em dashes in captions, no "not just X but Y", no banned hype words, no emoji, varied rhythm, specific opinions. Visuals are our captures, the tool's real output and our own drawings only.
- SPECIMIND is the benchmark for AI tools: every tested tool gets a SPECIMIND score out of 100 by `data/score.md` (facts.json `score`; parts on screen: Quality, Speed, Free plan, Price), shown in the video, on the hub and in its ranking. Research-only videos get no score.
- Frame 0 is a complete still: label pinned, all hook lines on screen, the strongest real visual (before → after, the disaster, or the best result). Hook = 3–12 words with a number or concrete outcome; rotate hook patterns.
- Inputs are licensed photos (Unsplash, Pexels, CC0), credited in facts.json `credits`, the description and the hub. Titles never claim we own the object ("my desk lamp").
- Money: drive every video to the hub. Affiliate + Worth it → Try button; Not sponsored or Skip it → the hub shows the best Worth-it alternatives of the same kind. Verdicts, scores and catches are never changed to sell.

## Video system
- `video/src/system/`: the design-system components (Paper, SpecimenLabel, FitStack, Plate, PlateTag, Turntable, ScaleBar, Card, InkMark, Stamp, Drawer, Triptych, SplitAB, Tray, CreditCounter, ExtinctLabel, Sketch, ScoreCard, BeforeAfter). Series are built only from these; `Cover` (series/Cover.tsx) renders cover.png from the same script.json.
- One video per platform per episode: `<id>-yt.mp4`, `<id>-ig.mp4`, `<id>-x.mp4` (all 1080×1920), identical except the end card's CTA from script.json `cta` (yt "Tap our name for…", ig "Comment {code} for…", x "…in the first reply"), with the hub URL in small print under it. Every series ends on the shared end card (`video/src/series/endcard.tsx`).
- `video/src/series/`: one composition per series; script.json shapes and beat orders in `video/src/series/README.md`. Fixtures there are design placeholders, never research.
- Text is measured only below `<FontGate/>` (series bodies go through `framed()`); never measure in an outer component.
- QA: `scripts/render_system_test.sh`, `scripts/render_series_test.sh`, then `scripts/check_safe_zones.py <stills>`. Look at the stills before committing. Review stills (`qa/stills/*.png`, one per beat boundary) are for looking at in this VM and are never committed; commit `qa/report.md` and `qa/contact-sheet.jpg` only.
- After changing the font or caption axes: `python3 scripts/font_metrics.py`.
- Music (v4): `python3 scripts/make_music.py <script.json>` composes the episode's own modern 120 bpm track to the edit: the SPECIMIND sound logo (the same four-note phrase on the same glassy synth) on frame 0 and again when the verdict stamp lands; six styles (future house, melodic house, synthwave pop, future garage, electro pop, chill house), a key, progression and topline per episode; room to read under explaining beats, topline with the result, a calm filtered breakdown under the catch (never a gag), build + impact on the score, full chorus on the verdict; folded so the end loops into frame 0. script.json: `"music": "music.wav"`, `"groove": 1-6` (never the previous upload's), optional `"key"` 0-7. music.wav is generated by render_previews.sh and render_batch.sh, never committed. Every beat's `seconds` is a multiple of 0.5 (validated).
- Effects: `python3 scripts/make_sfx.py` generates the WAVs in `video/public/sfx` with levels baked in; components never set a volume. The old ambient beds (`script.bed`) remain only for scripts without music. Never bake a commercial track into a file.

## Catalog site
- `site/build.mjs` (no dependencies) builds the hub from `data/catalog.json` into `site/_site`; pages.yml deploys it on every push to main touching site/, data/, brand/ or episode facts/covers. Field definitions are in catalog.json `fields`.
- After an episode is ready (Playbook P): `node scripts/catalog_sync.mjs E###` then `node site/build.mjs`. Sync never overwrites links, affiliate_url or corrections, and refuses to renumber.
- The hub uses the same plain words as the videos and shows **no posting dates** (the human posts whenever they have time); test dates may appear.
- Test layouts only with `node site/build.mjs --catalog site/fixtures/catalog.fixture.json --out <scratch>`; never deploy the fixture.
- Quality floor: 360 px phone, visible focus, Lighthouse performance and accessibility >= 95, no cookies, no third-party scripts (the YouTube player loads only on click). Text is ink, or red only on archival label or at large sizes (contrast).
- Font: `brand/reference/Anybody-VF-latin.woff2` from `python3 scripts/make_web_font.py`.

## Cloud rules
- You run in Claude Code on the web. Commit and push to main after each finished unit of work (one episode, one fix). Never rely on anything that is not in the repo.
- Keep progress in data/batch-state.json; on start, read it and resume.
- Never commit .mp4/.mov/.zip except the human's uploads in episodes/*/raw/ and captures/*/raw/. Final videos are rendered by .github/workflows/render.yml and published as a Release that carries **one zip only** (`specimind-<batch>.zip`: every video, cover, caption file and POSTING.md); no separate MP4 assets.
- Use gh with REST endpoints (gh api repos/specimindlab/specimindlab.github.io/...) for runs, jobs, annotations and releases.
- Commands that may exceed 2 minutes run in the background; poll them.
- If preview stills cannot be rendered in this VM, dispatch preview.yml and fetch its previews/<run-id> branch.

## The Specimen Code (never break)
- Output first: the first frame shows the tool's finished result (or, in Field sketch mode, the redrawn diagram).
- One attempt. If more than one attempt was used, the Conditions card must say how many.
- One honest flaw per specimen, shown on screen and circled in red ink.
- Every Live specimen shows its SPECIMIND Score (data/score.md), computed from the test, never adjusted.
- Price on screen: free-tier limit + paid starting price (from research.md, with source).
- Verdicts (data: Captured / Released / Watch) show on screen as Worth it, Skip it, Not tested (research only). Be willing to say Skip it.
- Numbers follow release order: `scripts/new_episode.py make R###` gives a calendar row the next episode id (E001, E002 …) and the next code of its kind (#001 … for single tools, P/M/D/W/X## for groups) when the video is actually made. A tool waiting for the human's recording gets `new_episode.py capture R###` (a `captures/` folder, no number) and its number when made. Once given, a number is never changed or reused.
- No narration, no AI voice, no copyrighted music, no other creators' footage, no tool logos as hero images.
- Mode label is always visible: "Tested by us" or "Not tested · research only".
- Disclosure label ("Affiliate link" or "Not sponsored") is visible for the WHOLE video (exceeds India's ASCI 1/3 rule and the FTC's clear-and-conspicuous standard).

## Brand tokens
Herbarium #D8DCCD (every background) · Iron-gall ink #151612 (text, rules) · Type red #C4122F (specimen labels, Captured stamp, scale-bar fill, ink annotations) · Archival label #F2F3EC (output frames, cards) · Pin steel #8C938D.
One typeface: Anybody variable (wdth 50–150, wght 100–900). Captions: wdth 60, wght 850. Catalog numbers and stamps: wdth 130–150, wght 900. Small labels: wdth 80–90, wght 600–800. Sentence case everywhere except stamps. Brand name SPECIMIND; handle @specimindlab; hub https://specimindlab.github.io/<code>.
Signature: every caption line is fitted to the full content width (edge-to-edge), so short lines are huge and long lines condense. 1–3 lines per beat, 1–7 words per line, written as plain spoken sentences.

## Frame and safe zones (1080×1920, 30 fps)
Content box: x 70–930 for text (right 150 px reserved for platform buttons), y 180–1440 (bottom 480 px reserved for captions/UI). The pinned label sits top-left at y≈180–330. Output plates may run to x 1010 but never put text there.

## Motion and pacing rules
Clear first, snappy second, cut on the beat. 35–55 s per video (18–60 allowed). Beats are multiples of 0.5 s (120 bpm), long enough to read (2.5 words per second at most); something moves in every beat (pop-in lines, card slides, turntables, ink, counters). The label is already pinned on frame 0. Cards slide in like paper (12 frames, ease-out). Captions cut in line by line, each line landing with a 4-frame pop (1.06 → 1); the first beat's lines are all there on frame 0. Turntables turn once every 6 s. Ink annotations draw on over 10 frames. Scores count up and lock on the music's crash. Never use glow, gradients, particle effects, glitch, camera shake or emoji.

## Avoiding "inauthentic / templated content" (YouTube July 2026 guidance)
- Each series has its own structure (see data/series.md). Never reuse one series' structure for another.
- No two consecutive uploads open with the same beat type, hook pattern or first word.
- Every Live specimen contains a unique, real capture from our own test (uploaded by the human, or auto-captured by you from a public, login-free demo). Never fake a Live specimen.
- Hooks state what actually happened in OUR test (numbers from facts.json), not generic hype.

## Honesty rules for research
Every factual claim (price, free limit, feature, launch date) must come from a page fetched or searched this week and be listed in research.md with URL + access date. Unknown = "not published", never guessed.
