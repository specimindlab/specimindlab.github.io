# SPECIMIND: rules for every session

A captions-only YouTube Shorts / Instagram Reels / X channel that tests new AI tools. Repo map: `brand/` brand kit · `data/` calendar, series, schedule, batch state, batches · `prompts/` prompt pack and playbooks · `video/` Remotion project · `scripts/` pipeline · `site/` catalog hub · `episodes/` one folder per episode.

## Video system
- `video/src/system/`: the design-system components (Paper, SpecimenLabel, FitStack, Plate, Turntable, ScaleBar, Card, InkMark, Stamp, Drawer, Triptych, SplitAB, Tray, CreditCounter, ExtinctLabel, Sketch). Series are built only from these.
- `video/src/series/`: one composition per series; script.json shapes and beat orders in `video/src/series/README.md`. Fixtures there are design placeholders, never research.
- Text is measured only below `<FontGate/>` (series bodies go through `framed()`); never measure in an outer component.
- QA: `scripts/render_system_test.sh`, `scripts/render_series_test.sh`, then `scripts/check_safe_zones.py <stills>`. Look at the stills before committing.
- After changing the font or caption axes: `python3 scripts/font_metrics.py`.

## Cloud rules
- You run in Claude Code on the web. Commit and push to main after each finished unit of work (one episode, one fix). Never rely on anything that is not in the repo.
- Keep progress in data/batch-state.json; on start, read it and resume.
- Never commit .mp4/.mov/.zip except the human's uploads in episodes/*/raw/. Final videos are rendered by .github/workflows/render.yml and published as Releases.
- Use gh with REST endpoints (gh api repos/specimindlab/specimindlab.github.io/...) for runs, jobs, annotations and releases.
- Commands that may exceed 2 minutes run in the background; poll them.
- If preview stills cannot be rendered in this VM, dispatch preview.yml and fetch its previews/<run-id> branch.

## The Specimen Code (never break)
- Output first: the first frame shows the tool's finished result (or, in Field sketch mode, the redrawn diagram).
- One attempt. If more than one attempt was used, the Conditions card must say how many.
- One honest flaw per specimen, shown on screen and circled in red ink.
- Price on screen: free-tier limit + paid starting price (from research.md, with source).
- Verdicts: Captured, Released, or Watch (Field sketch only). Roughly 1 in 8 Live specimens is Released.
- Catalog numbers are permanent. Never renumber.
- No narration, no AI voice, no copyrighted music, no other creators' footage, no tool logos as hero images.
- Mode label is always visible: "Live specimen" or "Field sketch — not hands-on".
- Disclosure label ("Affiliate" or "Unpaid") is visible for the WHOLE video (exceeds India's ASCI 1/3 rule and the FTC's clear-and-conspicuous standard).

## Brand tokens
Herbarium #D8DCCD (every background) · Iron-gall ink #151612 (text, rules) · Type red #C4122F (specimen labels, Captured stamp, scale-bar fill, ink annotations) · Archival label #F2F3EC (output frames, cards) · Pin steel #8C938D.
One typeface: Anybody variable (wdth 50–150, wght 100–900). Captions: wdth 60, wght 850. Catalog numbers and stamps: wdth 130–150, wght 900. Small labels: wdth 80–90, wght 600–800. Sentence case everywhere except stamps. Brand name SPECIMIND; handle @specimindlab; hub https://specimindlab.github.io/<code>.
Signature: every caption line is fitted to the full content width (edge-to-edge), so short lines are huge and long lines condense. 1–3 lines per beat, 2–6 words per line.

## Frame and safe zones (1080×1920, 30 fps)
Content box: x 70–930 for text (right 150 px reserved for platform buttons), y 180–1440 (bottom 480 px reserved for captions/UI). The pinned label sits top-left at y≈180–330. Output plates may run to x 1010 but never put text there.

## Motion rules
Calm and exact. Labels pin in with a 6-frame drop + 2-frame overshoot and a pin tick. Cards slide in like paper (12 frames, ease-out). Captions cut in line by line (no word-by-word bouncing, no typewriter). Ink annotations draw on over 10 frames. Never use glow, gradients, particle effects, glitch, zoom-punch, or emoji.

## Avoiding "inauthentic / templated content" (YouTube July 2026 guidance)
- Each series has its own structure (see data/series.md). Never reuse one series' structure for another.
- No two consecutive uploads open with the same beat type or the same first word.
- Every Live specimen contains a unique, real capture from our own test (uploaded by the human, or auto-captured by you from a public, login-free demo). Never fake a Live specimen.
- Hooks state what actually happened in OUR test (numbers from facts.json), not generic hype.

## Honesty rules for research
Every factual claim (price, free limit, feature, launch date) must come from a page fetched or searched this week and be listed in research.md with URL + access date. Unknown = "not published", never guessed.
