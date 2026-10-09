# SPECIMIND — Claude Code prompt pack

Zero budget, no voice. **This pack runs entirely in Claude Code on the web** (claude.ai/code), on Anthropic's cloud, connected to the GitHub repo `specimindlab/specimindlab.github.io`. Nothing is installed on your computer. Final videos are rendered by a free GitHub Actions workflow and published as a GitHub Release you download.

**You paste only six prompts in total**, each into a new session at claude.ai/code with the `specimindlab.github.io` repo selected:

| When | Paste | What it does |
| --- | --- | --- |
| Once, in order | S1, S2, S3, S4 | Builds the repo, the video design system, the sound, the catalog website, and the GitHub workflows that render and publish |
| Any free day | **B** (with the number of videos you want) | Makes that many videos, then GitHub renders them and publishes one downloadable Release |
| Before a capture session | C | Lists exactly which tool tests to record by hand, and where to upload each recording |
| Sundays (optional) | W | Weekly review and next week's picks |
| End of each month (optional) | M | Long-form Field Guide compilation |

The Playbooks (R, I, V, P) further down are instructions Claude Code follows *inside* prompt B. You never paste them.

**Before prompt S1:** from your existing personal GitHub account (the one already connected to Claude), create a free organization named `specimindlab`. In it, create a new **public** repository named exactly `specimindlab.github.io` (Owner: `specimindlab`, not your personal account), ticking "Add a README". A repository named `<owner>.github.io` is that owner's main GitHub Pages site, so this one is served at `https://specimindlab.github.io` and each tool at `https://specimindlab.github.io/047`; any other repository name would be a project site at `https://specimindlab.github.io/<repo-name>/`. Then Add file → Upload files, and drop these three files into the repo root: `specimind-brand-kit.zip`, `specimind-90-day-calendar.xlsx`, and this file `specimind-claude-code-prompts.md`. Commit. Finally, at claude.ai/code, give the Claude GitHub App access to the `specimindlab` organization and this repository.

**Everything here is free:** Remotion (free for individuals and companies of up to 3 people), Node, Python and ffmpeg inside the cloud VM and inside GitHub Actions, GitHub Pages + Actions + Releases (free for public repositories), OBS Studio on your computer only if you record tool tests, and Hugging Face Spaces for open-source models.

---

## S1 — Bootstrap the repo, the cloud setup and CLAUDE.md (paste once)

```
You are the production engineer for SPECIMIND, a YouTube Shorts / Instagram Reels / X channel that tests new AI tools. You are running in Claude Code on the web: an Anthropic-hosted Ubuntu VM with this repository (specimindlab/specimindlab.github.io, public, owned by the specimindlab GitHub organization) cloned. There is no local machine. Everything must live in this repo; light work runs in this VM, heavy rendering runs in GitHub Actions. Budget is zero: only free, open-source software. There is no narration in any video, ever.

0. ENVIRONMENT CHECK (do this first and save the result as data/env-check.md):
   - Versions: node -v, python3 --version, gh --version, ffmpeg -version (may be missing), echo $CLAUDE_CODE_REMOTE.
   - Reachability with curl -sI (5 s timeout each): registry.npmjs.org, pypi.org, raw.githubusercontent.com, fonts.gstatic.com, storage.googleapis.com, huggingface.co, cdn.playwright.dev, www.tripo3d.ai.
   - Try your WebSearch tool once and your WebFetch tool once (on https://www.tripo3d.ai).
   - Then tell me, in plain words, which features work: research, auto-capture of open-source demos (needs huggingface.co and *.hf.space), rendering preview stills in this VM. If a feature is blocked, tell me the single setting that unlocks it (cloud environment → Network access → Full) and carry on with everything that works.

1. The repo root holds three files I uploaded. Unzip specimind-brand-kit.zip so its contents sit directly in /brand (brand/logo, brand/social, ...), then delete the zip. Move specimind-90-day-calendar.xlsx to /data and specimind-claude-code-prompts.md to /prompts.

2. Create a Remotion project (latest stable 4.x, TypeScript, blank template) in /video. Add @remotion/three, @react-three/fiber, @react-three/drei, three, @remotion/layout-utils, @remotion/media-utils, zod. Pin exact versions and commit package-lock.json. Copy the Anybody variable font from /brand/reference into /video/public/fonts (OFL licence; download OFL.txt from github.com/google/fonts/tree/main/ofl/anybody).

3. Structure:
   /brand  /data  /prompts  /video  /video/public/sfx (filled by prompt S3)  /scripts  /site
   /episodes/E001-<slug>/  one folder per episode (raw/ for the human's uploads, plus the files the playbooks create)
   /data/batches/  one JSON file per batch (written by prompt B; pushing one starts the render workflow)
   /data/schedule.json  last scheduled post date + slot (starts at the calendar start date)
   /data/batch-state.json  durable progress of the current batch, so a resumed or compacted session can continue

4. CLOUD SETUP INSIDE THE REPO (so the default cloud environment needs no configuration):
   - scripts/cloud_setup.sh: exit 0 immediately unless CLAUDE_CODE_REMOTE=true. Then, idempotently and fast when already done: npm ci in /video if node_modules is missing; pip install -r requirements.txt (numpy, scipy, openpyxl, gradio_client); install ffmpeg with apt-get if missing (archive.ubuntu.com is on the default allowlist), otherwise fall back to Remotion's bundled one via `npx remotion ffmpeg`; run `npx remotion browser ensure`. Every step prints a warning instead of failing; the script always exits 0.
   - .claude/settings.json: a SessionStart hook (matcher "startup|resume") running bash "$CLAUDE_PROJECT_DIR"/scripts/cloud_setup.sh with "timeout": 600.
   - Long commands: anything that may exceed 2 minutes (npm ci, renders) runs in the background and you poll it.

5. GITHUB ACTIONS (free for public repositories), in .github/workflows/:
   - pages.yml: build /site and deploy to GitHub Pages on every push to main touching site/, data/ or episodes/*/facts.json (actions/upload-pages-artifact + actions/deploy-pages; permissions pages: write, id-token: write).
   - render.yml ("Render batch"): on push to main touching data/batches/*.json, and on workflow_dispatch with input `batch`. ubuntu-latest, timeout-minutes 300, permissions contents: write. Steps: checkout; setup-node 22 with npm cache; setup-python 3.12; apt-get install ffmpeg; cache ~/.cache/remotion; npm ci in /video; then scripts/render_batch.sh <batch>. That script, for each episode in the batch file: renders <id>-yt.mp4, <id>-ig.mp4, <id>-x.mp4 with ONE delivery spec that YouTube Shorts, Instagram Reels and X all accept natively (only the CTA beat differs): 1080x1920 (9:16), constant 30 fps, H.264 High profile, CRF 18, pixel format yuv420p, colour space bt709 (Remotion --color-space=bt709, so the herbarium paper does not shift colour after upload), AAC-LC 48 kHz stereo 192 kbps, MP4 with +faststart. It then runs scripts/loudness.sh (which copies the video stream and keeps +faststart), copies cover.png and <id>.srt, and verifies each file with ffprobe and ebur128: width 1080, height 1920, square pixels, no rotation metadata, 30 fps, codec h264 / yuv420p / bt709, audio aac 48000 Hz 2 channels, duration 28–40 s (under every platform's limit: X allows 140 s on free accounts), size under 100 MB, integrated -14 LUFS ±1, true peak ≤ -1 dBTP. Any failure prints a GitHub annotation `::error file=episodes/<id>/script.json::<reason>` and fails the job, so the reason is readable through the REST API. On success it builds posting/<batch>/ (one folder per episode with its MP4s, cover, .srt and meta files, plus POSTING.md and posting-sheet.csv), zips it as specimind-<batch>.zip and creates the Release <batch> with `gh release create` using GITHUB_TOKEN, attaching the zip and using POSTING.md as the release notes.
   - preview.yml ("Render previews", fallback only): workflow_dispatch with input `episodes`; renders the review stills (every beat boundary + 1 s, and 25/50/75 %) and pushes them to a branch previews/<run-id>, so a session that cannot render locally can `git fetch` that branch and look at them.
   Finished videos never enter git history; Releases hold them. The GitHub proxy blocks tag pushes from this VM, which is why releases are created inside Actions.

6. .gitignore: node_modules, *.zip, /posting/, /episodes/*/render/, /video/out/. (The human's uploads in episodes/*/raw/ ARE committed: they arrive through github.com.)

7. Write scripts/new_episode.py (creates episodes/<id>-<slug>/ with brief.json from the calendar row, raw/.gitkeep, raw/input/, and README.md with the capture checklist built from the row's 'The test' and 'Free path'). Convert the Calendar sheet of data/specimind-90-day-calendar.xlsx to data/calendar.csv with openpyxl (data_only=True, ISO dates). Write data/series.md describing the 9 series from the Series sheet.

8. Write CLAUDE.md at the repo root with EXACTLY these sections, so every future session follows them:

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

9. Commit and push to main. Then report: the environment-check table, the repo tree, and the exact settings I must click on github.com (Settings → Pages → Source: GitHub Actions, and anything else).
```

---

## S2 — Build the design system in Remotion (paste once)

```
Read CLAUDE.md and every file in /brand (look at the PNGs, especially brand-board.png, storyboard-episode-001.png, shorts-cover-template.png). Build a Remotion component library in /video/src/system that reproduces that look exactly, as live components:

- <Paper/>: herbarium background with very subtle static paper grain (seeded noise SVG, opacity 0.05). No vignette.
- <SpecimenLabel code mode status/>: crimson rectangular label with hairline inner border, the code in Anybody wdth 130 wght 900, pierced by an entomology pin (steel shaft, black spherical head with a small highlight, soft offset shadow). Pin enters near the label's right edge and the shaft continues beneath the label. Animate: drop + overshoot over 8 frames; trigger sfx 'pin-tick'. To its right: tool name (wdth 100, wght 900), genus line (e.g. "3D generator"), and the disclosure word ("Affiliate" in type red / "Unpaid" in ink) and mode ("Live specimen" / "Field sketch — not hands-on").
- <FitStack lines width/>: the signature caption stack. Each line's font size is computed so the line spans exactly `width`. Use the variable font with font-variation-settings 'wdth' 60, 'wght' 850; measure with the same settings (if @remotion/layout-utils fitText ignores variation axes, measure with an offscreen canvas or a hidden DOM span inside delayRender/continueRender). Line gap = 0.12 × cap height + room for descenders, so descenders never touch the next line's ascenders. Lines appear one by one (3-frame cut, no fade).
- <Plate/>: archival-white frame with 4 px ink border and registration crosses at the corners, holding video, image, or a 3D turntable.
- <Turntable src/>: loads a .glb with useGLTF inside <ThreeCanvas>; rotation driven by useCurrentFrame (never useFrame); soft studio light; floor shadow; neutral clay override toggle so geometry is visible; background transparent so the Plate shows.
- <ScaleBar seconds max/>: ruled bar with ticks; red fill grows to `seconds`; label "38 s to result".
- <Card title rows/>: archival card (Collection conditions, Field notes) with ruled rows, key in pin steel, value in ink. Rows slide in 2 frames apart; sfx 'paper'.
- <InkMark shape target/>: hand-drawn red ellipse/arrow/underline that draws on (stroke-dashoffset) with slight wobble from a seeded noise function; sfx 'pen'.
- <Stamp word/>: double-rule stamp (Captured red, Released ink, Rare sighting red, Watch ink, Unpaid ink), rotates in from -14° to -7° with a 2-frame scale thump; sfx 'stamp'.
- <Drawer total highlight/>: grid of cells; specimens 1..total-1 shown as small ink labels with pins; the new one drops in red. Reads data/catalog.json so the drawer always reflects the real collection. sfx 'drawer'.
- <Triptych/> (Plate series), <SplitAB/> (Mimicry), <Tray stages/> (Dissection), <CreditCounter used left/> (Free Range), <ExtinctLabel/> (Extinction Watch: ink label with a red strike, successors pinned beside it).

Then build one composition per series in /video/src/series/*.tsx, each driven by a zod-validated script.json prop, each with a DIFFERENT beat structure as defined in data/series.md. Duration is computed from the script (30–40 s).

Acceptance (check yourself before finishing): render stills of every component on a test composition with `npx remotion still` (in the background; if this VM cannot render, dispatch preview.yml and fetch its branch) and LOOK at them. Compare against /brand/storyboard-episode-001.png. Fix any text overflow, any element inside the bottom 480 px or right 150 px, and any line where descenders collide. Repeat until clean. Commit.
```

---

## S3 — Sound, generated in code (paste once)

```
Create /scripts/make_sfx.py using only numpy and scipy (pip install if missing). Synthesise 48 kHz 16-bit WAVs into /video/public/sfx. Everything is generated, so we own it outright.

- pin-tick.wav: 25 ms bright metallic click (short noise burst through a resonant band-pass ~3.2 kHz + a 90 ms decaying sine at 2.6 kHz, very quiet).
- paper.wav: 300 ms paper slide (filtered pink noise with a soft envelope).
- pen.wav: 400 ms pen scratch (granular high-passed noise with micro-amplitude jitter).
- stamp.wav: 180 ms muffled thud (60–90 Hz sine drop + short noise transient).
- drawer.wav: 900 ms felt-lined wooden drawer sliding shut (low filtered noise sweep + final soft knock).
- ui-click.wav: 20 ms soft click.
- motif.wav: the SPECIMIND sonic logo — four notes (start from A3, E4, C#4, F#4 and adjust if it clashes) with a curious, slightly modal colour, played on a soft sine+triangle 'music box' voice with a gentle room reverb (Schroeder reverb implemented in numpy). 1.6 s.
- bed-{1..6}.wav: six 45-second ambient beds (slow evolving pads, different keys and tempos, no drums, generated with additive synthesis + slow filter LFO), so consecutive videos don't share the same bed.

Also write /scripts/loudness.sh (used by render.yml) that runs ffmpeg loudnorm two-pass to -14 LUFS integrated, -1 dBTP on a rendered mp4 (audio re-encoded as AAC-LC 48 kHz stereo 192 kbps, video stream copied, -movflags +faststart).

Mixing rules for every composition: bed at about -24 LUFS, effects about 8 dB above the bed, motif only on the end card. On Instagram the human may add a trending in-app track at low volume on top; never bake a commercial track into the file.

Check levels by rendering a 10 s test composition with every sound in this VM (in the background), measure with ffmpeg ebur128, report peak and LUFS values, and commit the WAVs (they are small). Push.
```

---

## S4 — The free catalog hub on GitHub Pages (paste once)

```
Build the catalog site in /site as plain static HTML/CSS with a tiny Node build script (no framework, no paid services). It is published by .github/workflows/pages.yml to GitHub Pages at https://specimindlab.github.io/ (a repository named <owner>.github.io is the owner's main Pages site, so pages live at the root, e.g. /047/, with no repo-name prefix; use root-relative links).

Data: /data/catalog.json, which you also extend with per-specimen fields filled from each episode's facts.json: code, tool, pillar, verdict, flaw, free_tier, paid_from, tested_on (date), episode links (YouTube/IG/X URLs, filled after posting), affiliate_url (empty until the human pastes it), disclosure ('Affiliate' | 'Unpaid').

Pages:
- / : the drawer — a grid of every specimen label (same visual system as the videos: herbarium paper, crimson labels, pins, Anybody font self-hosted from /brand), filterable by pillar and verdict, with a big search box that accepts a number ("47" or "047" both work).
- /001/ (one folder per code, so typing specimindlab.github.io/001 works): the specimen page — label, verdict stamp, field notes table, the test conditions, the flaw, the embedded YouTube Short, a 'Try {tool}' button (affiliate_url if present, else the tool's homepage), and the disclosure paragraph at the TOP of the page (text in docs: 'Some links on this page are affiliate links...'). Related specimens: 3 from the same pillar.
- /P01/, /D01/, /M01/ etc. for Plates, Dissections, Mimicry: list the specimens involved with links to each.
- /about/ : the Specimen Code in plain language + full affiliate disclosure.
- /llms.txt : plain-text index of every specimen (code, tool, verdict, flaw, date, URL).
- Each specimen page includes JSON-LD (VideoObject + Review with reviewRating mapped Captured=4, Watch=3, Released=2 out of 5, author 'SPECIMIND').
- Outbound affiliate links get rel="sponsored noopener".
- Append sub-IDs to affiliate URLs where the network supports them: p-{platform}-e{episode}. The specimen page reads ?from=ig|yt|x and passes it through.

Quality floor: works on a 360 px phone, keyboard focus visible, Lighthouse performance and accessibility ≥ 95 (run npx lighthouse in this VM against a local static server if the browser is available, and report the scores), no third-party scripts, no cookies, no tracking pixels.

Make sure pages.yml (from S1) builds this site. Commit, push, check that the Pages workflow succeeded with `gh api repos/specimindlab/specimindlab.github.io/actions/runs?per_page=3`, and tell me exactly which repo settings I must click on github.com if it did not.
```

---

## B — Batch: make any number of videos with one prompt (paste whenever you have time)

Start a new session at claude.ai/code with the `specimindlab.github.io` repo selected, paste this, and change `10` to however many you want. You can close the browser tab; the session keeps working in the cloud, and you can check on it later from claude.ai/code or the Claude app.

```
Make the next 10 SPECIMIND episodes end to end. You are in Claude Code on the web; work autonomously and do not ask me anything unless a step is truly impossible.

0. git pull. Read CLAUDE.md, data/env-check.md and prompts/specimind-claude-code-prompts.md (Playbooks R, I, V, P). Open data/batch-state.json: if it holds an unfinished batch, resume that batch instead of starting a new one. Otherwise start batch-<YYYY-MM-DD> and record the chosen episode ids in it. Keep a todo list.

1. Pick episodes: the first 10 rows of data/calendar.csv whose Status is not Rendered or Posted. (If I wrote a range such as E021-E030 at the end of this prompt, use that range instead.)

2. Decide each episode's mode:
   a. Live, captured by me: episodes/<id>/raw/ contains my uploaded recordings or downloads.
   b. Live, auto-captured: the tool is open-source with a public Hugging Face Space, or has a free API needing no login or payment, AND data/env-check.md says auto-capture works. Run the test yourself (Playbook I, AUTO-CAPTURE).
   c. Field sketch: the tool has no free tier, or the series is Field Sketch, Extinction Watch or The Drawer.
   d. Needs capture: anything else (a commercial tool whose free tier needs my login, or an auto-capture the network blocks). Never fake it and never downgrade it to a Field sketch. Append it to data/needs-capture.md with its capture checklist and take the next calendar row instead, so the batch still produces 10 videos.
   Keep Field sketches to at most 40% of the batch; if that limit would be passed, prefer rows further down the calendar that are a, b, The Drawer, or Plate/Mimicry with uploads present.

3. For each episode, in calendar order: Playbook R, then I, then V (script and the full review loop on preview stills, max 4 rounds), then P. After EACH finished episode, update data/batch-state.json, commit and push to main ("<id> ready"), so an interruption loses nothing.

4. When every episode is ready, write data/batches/<batch>.json: the episode ids in posting order, each with its suggested post date and time (continue after the last slot in data/schedule.json; two posts a day at 06:30 and 18:30 IST; never two Field sketches or two of the same series back to back), plus every field POSTING.md needs (YouTube title, description, hashtags, related video, whether the "altered or synthetic content" toggle must be ON, Instagram caption, comment code, auto-DM text, X post and first reply). Commit and push. This push starts the "Render batch" workflow on GitHub, which renders the final videos and publishes the Release.

5. Watch the workflow in the background: poll `gh api repos/specimindlab/specimindlab.github.io/actions/runs?per_page=5` every 2 minutes. If the run fails, read its annotations (`gh api repos/specimindlab/specimindlab.github.io/check-runs/<id>/annotations`) or its job log, fix the cause, push, and let it run again. Stop after 3 failed runs and report.

6. When the Release exists: confirm the Pages workflow succeeded and, if your network allows, that every https://specimindlab.github.io/<code> in this batch returns HTTP 200. Update data/schedule.json, set Status = Rendered for these rows in data/calendar.csv, mark the batch complete in data/batch-state.json, commit and push.

7. Report in a short table: id, code, tool, mode, verdict, suggested post time. Then the Release link, anything added to data/needs-capture.md, and any check that still failed.
```

---

## C — Capture list (paste before a recording session)

```
Read CLAUDE.md, data/calendar.csv and data/needs-capture.md. List the next 15 episodes that need ME to record a test by hand (commercial tools whose free tier needs my login), skipping any whose episodes/<id>/raw/ already has a recording.

For each, create the episode folder if needed (scripts/new_episode.py) with raw/.gitkeep, and put the exact input (the photo, sketch or prompt text) into episodes/<id>/raw/input/ so I can download it from github.com. Commit and push.

Then write data/capture-session-<YYYY-MM-DD>.md, grouped by tool so I log in to each tool only once. For each episode give:
- the input file's GitHub link and the exact settings to use
- what to record (start OBS before clicking Generate, stop when the result is fully visible), one attempt only
- the files to download from the tool and the file names to save them as
- the upload link https://github.com/specimindlab/specimindlab.github.io/upload/main/episodes/<id>/raw (I drag the files there and click Commit changes)
- a reminder that GitHub's web upload accepts files up to 25 MB each, with OBS settings that keep a 60-second 1080p recording under that (Settings → Output → Output mode: Advanced → Recording: encoder x264, rate control CBR, bitrate 2500 Kbps; Settings → Video: 30 fps)
- the credit cost if research shows it, and a warning if the free credits will not cover all of this tool's episodes this month.
Use markdown checkboxes so I can tick them on GitHub. Commit, push, and give me the link to the file.
```

---

## M — Monthly long-form Field Guide (optional, end of month)

```
Collect the month's Live specimens with verdict Captured, ordered by Scorecard performance. Build a 1920×1080 Remotion composition "Field Guide Vol. {n}" that re-lays each episode's assets in a horizontal layout (left: plate; right: field notes), 30–45 s per specimen, chapters, intro and outro drawer. No narration — on-screen text only, same rules. Write a YouTube description with chapters (timestamps), every specimen's clickable affiliate link with sub-ID p-yt-fg{n}, and the disclosure at the top. Run the same review loop as Playbook V adapted to 16:9 safe areas, then add it to a batch file so render.yml renders it and attaches it to a Release.
```

---

## W — Weekly review and next week's picks (optional, Sundays)

```
Inputs: data/scorecard-week-{n}.csv (the human uploads it through github.com: YouTube Studio Shorts table, Instagram Insights, X analytics, affiliate dashboards — any format; parse what's there) and data/specimind-90-day-calendar.xlsx.

1. Compute per episode: views, engaged views, average % viewed, viewed-vs-swiped-away (YouTube), comments with the code (Instagram), hub visits (if available), affiliate clicks, sign-ups, paid. Rank episodes and series.
2. Apply the kill/keep rules from the strategy doc: a series below 50% of the channel median for 6 episodes in a row gets fewer slots; a pillar in the top 3 gets more Field Specimen slots from day 31; top-5 converting specimens become "Revisited" candidates.
3. Rare Sighting picks for next week: search Product Hunt's daily leaderboards for the past 7 days, Exploding Topics' AI page, and new Hugging Face Spaces trending this week. Choose tools that (a) launched ≤ 14 days ago, (b) have a usable free tier, (c) produce a visual result in under 2 minutes. Give 4 picks with links and why.
4. Write data/weekly-review-{n}.md: what worked, what to stop, next week's 14 episodes (update rows in data/calendar.csv; never overwrite the xlsx), and one experiment to run (e.g. hook style A vs B). Commit and push.
5. Fill the Scorecard row for the week in a CSV the human can paste into the xlsx.
```

---

# Playbooks (Claude Code reads these during prompt B — you never paste them)

## Playbook R — Research (used by prompt B; do not paste)

```
Episode: {E###}. Read episodes/{E###-slug}/brief.json and CLAUDE.md.

Research the tool(s) using web search and by fetching the official pages (home, pricing, docs, changelog, affiliate page if any). This week's facts only. Write:

episodes/{E###-slug}/research.md — what it is, who makes it, free tier exact limits, paid starting price (currency + billing period), inputs it accepts ('feeds on'), where it runs ('habitat': browser / iOS / Mac / Discord / API / open weights), notable licence terms for free-tier output (e.g. non-commercial, attribution required), launch or last-major-update date, and 2–3 known limitations reported by users (link each). Every line ends with [source URL, accessed YYYY-MM-DD].

episodes/{E###-slug}/facts.json — machine-readable version: {tool, genus, habitat, feeds_on[], free_tier, paid_from, licence_note, launched, sources[]}. Use null for anything not published.

Inputs: when the test needs a photo or file and episodes/{E###-slug}/raw/input/ is empty, choose licensed inputs yourself (Unsplash, Pexels or CC0, via WebFetch when a site blocks curl), pick them to stress the test (one easy, one hard), save them to raw/input/ with SOURCES.md (URL, photographer, licence, date) and put the credit line in facts.json `credits`. Never claim the object is ours.

Then update README.md in the episode folder: the exact capture checklist for the human (what to record with OBS, which setting, which input to use, where to save the output). If the free tier cannot do the test, say so and switch the brief's mode to 'Field sketch'.

Flag anything that contradicts the calendar row (e.g. the free tier no longer exists) at the top of research.md.
```

---

## Playbook I — Ingest, or auto-capture (used by prompt B; do not paste)

```
Episode: {E###}. Inspect episodes/{E###-slug}/raw/. For each file:
- Screen recordings (uploaded by the human through github.com): use ffmpeg to trim dead time (detect frozen frames with freezedetect; keep the moment of clicking Generate and the moment the result appears), crop to the tool's canvas area (detect with cropdetect, confirm by extracting a frame and looking at it), scale to fit a 940 px wide plate, re-encode H.264 30 fps, no audio.
- Record the real generation time: the seconds between the Generate click and the result appearing. Save it to facts.json as seconds_to_result, and note how you measured it.
- Images: convert to PNG, max 2000 px.
- .glb / .obj: validate with a quick three.js load test; record vertex count, whether textures exist; save a clay-render still for the flaw check.
- Audio outputs (music, SFX from the tool): normalise to -16 LUFS, keep as the tool's own sound — this is the specimen, not narration.

Look at extracted frames yourself. Find the single most honest flaw a viewer can SEE (fused geometry, melted hands, misspelled text, wrong count, artefacts). Write it to facts.json as flaw {text (max 5 words), timestamp or image region}. If there is no visible flaw, use the most important limitation from research.md and mark flaw_source: 'research'.

Decide the verdict with reasons in facts.json: Captured / Released (Live) or Watch (Field sketch). Be willing to release. Live specimens: compute the SPECIMIND Score by data/score.md and store it in facts.json `score` ({total, parts: [{key, value, max}], result_runs}). Tools: scripts/auto_capture_hf.py (anonymous Space runs) and scripts/glb_inspect.mjs (3D stats + clay renders).

AUTO-CAPTURE (when raw/ is empty): only if data/env-check.md says huggingface.co is reachable from this VM. If the tool is open-source with a public Hugging Face Space, or offers a free API that needs no login and no payment, run the test yourself:
- Use the gradio_client Python package (or the documented free API) with the exact input from the brief. Save inputs and outputs to raw/auto/.
- Measure seconds_to_result as wall-clock time from request to result, excluding queue wait (record both).
- If Playwright's Chromium is available (env-check), also record the run as video: open the Space headless, perform the same steps, and keep Playwright's page recording so the Observation beat shows the real interface. Otherwise the Observation beat shows the input and the output side by side with the measured time.
- Never create accounts, never log in, never bypass rate limits, queues or captchas. If the Space is down or queued > 10 minutes, mark the episode 'needs capture' instead.
- Label the episode 'Live specimen' and add 'Auto-captured on a public demo' to the Conditions card.

If raw/ is empty and auto-capture is not possible: never invent footage. If the tool has no free tier (or the series is Field Sketch / Extinction Watch), make it a Field sketch. Otherwise mark it 'needs capture' and let prompt B move on.
```

---

## Playbook V — Script, render, review loop (used by prompt B; do not paste)

```
Episode: {E###}. Read CLAUDE.md, prompts/voice.md, data/series.md, data/score.md, brief.json, research.md, facts.json, and the list of the last 6 published episodes' script.json files (episodes/*/script.json, by date).

1. Write episodes/{E###-slug}/script.json for the series composition in the voice of prompts/voice.md: beats (each a multiple of 0.5 s, 20–30 s total), every caption line (1–6 words per line, 1–3 lines per beat), which asset fills each plate, scale-bar seconds, field-notes rows, flaw annotation target, the score beat, verdict with use_for / skip_if, code, label text, mode, "music": "music.wav" and "groove" 1-6 (not the same as the previous episode), and "cover" (before/after or the strongest result + the hook).
   Hook rules: the first beat states what happened in OUR test using a number from facts.json ("This mug was a phone photo 38 seconds ago."). Rewrite the calendar's draft hook if reality differs. Must not start with the same first word as either of the last 2 episodes. Banned words: insane, crazy, game-changer, mind-blowing, unbelievable, secret, hack, 🤯 or any emoji.
   CTA (script.json `cta`, shown on the end card, one video per platform; the hub URL is printed under it automatically): two short lines each, pointing at what the hub gives them (the link, the ranking, the alternatives).
   yt: "Tap our name\nfor the 3D ranking." (Shorts links are not clickable; the channel profile links to the hub) · ig: "Comment {code}\nfor the 3D ranking." (the auto-DM sends the hub link) · x: "3D ranking in\nthe first reply."

2. Do NOT render the final MP4s here: render.yml does that on GitHub. In this VM, run scripts/render_previews.sh {E###}: it composes music.wav, renders the review stills, cover.png (Cover composition) and {E###}.srt (in the background; or via preview.yml if this VM cannot render). If you need to check timing or the loop, render one low-resolution preview (540×960, CRF 30) and delete it afterwards.

3. REVIEW LOOP — do not skip. Extract a still at every beat boundary + 1 s and at 25%, 50%, 75% of the duration (npx remotion still). Look at each image and check:
   [ ] first frame shows the output (or diagram in Field sketch) — not a title card
   [ ] label, disclosure word and mode visible in every still
   [ ] no text in bottom 480 px or right 150 px; nothing clipped
   [ ] every caption line spans the content width; no descender collisions; max 3 lines
   [ ] flaw is on screen and circled; price and free tier on screen
   [ ] colours only from the brand tokens; no orange, no gradients, no glow
   [ ] verdict stamp legible; drawer shows the correct code highlighted
   [ ] text readable at phone size (downscale a still to 360 px wide and look again)
   [ ] music: groove differs from the previous upload; flaw, score lock and verdict land where the picture does (make_music.py prints the sections)
   [ ] duration 20–30 s (max 40); every beat a multiple of 0.5 s; last frame matches first frame closely enough to loop
   [ ] frame 0 alone would stop a scroll: complete, readable with the sound off, a number or concrete outcome
   [ ] not structurally identical to the previous episode (compare beat lists)
   Write qa/report.md with each check, PASS/FAIL, and the still that proves it (stills are not committed; qa/contact-sheet.jpg is). Fix every FAIL, re-render, re-check. Loop until all PASS (max 4 iterations; if still failing, stop and explain).

4. Commit and push the episode folder (script, facts, research, srt, cover, qa report and stills; never MP4s).
```

---

## Playbook P — Publishing metadata (used by prompt B; do not paste)

```
Episode: {E###}. Using facts.json, script.json and the templates in the strategy doc (copied in data/copy-templates.md), write episodes/{E###-slug}/meta/:

youtube.md — title (tool name first, under 60 characters, the outcome with a number or the score, in the voice of prompts/voice.md; never "my"), description (template; disclosure line verbatim), 3 hashtags, tags list from YouTube autocomplete research for the tool name (search YouTube suggestions and list the 8 most relevant), playlist names (pillar + series), related-video suggestion (Plate → winner's Field Specimen; Drawer → latest Field Guide), pinned comment.
instagram.md — caption (first line = same keyword line), conditions, "Comment {code} and we'll DM you the link", disclosure, 3–5 hashtags, alt text, the exact auto-DM text for the comment-automation tool with {code} filled in, and a suggested Trial Reel alternative hook.
x.md — post text (≤ 200 characters, tool name + one opinion), first-reply text with the hub link + disclosure.

Also update data/catalog.json (`node scripts/catalog_sync.mjs {E###}`, then `node site/build.mjs` to validate) and commit; pages.yml publishes specimindlab.github.io/{code} so it is live before the video is posted. After posting, the human pastes the YouTube/Instagram/X URLs into `links` and any affiliate link into `affiliate_url`.
```

---

## Notes for the human

- **What you do by hand, in stretches when you are free:** a capture session (prompt C, then drag the recordings onto github.com); a batch day (prompt B at claude.ai/code, then walk away); a posting session (download the Release, schedule from POSTING.md). YouTube Studio and Meta Business Suite schedule for free; post X manually if scheduling is not offered on your account.
- **Where things run:** research, scripting and review in Claude Code on the web; final rendering, the website and the Releases in GitHub Actions. Nothing runs on your computer except OBS during a capture session.
- **If a session stops** (usage limit, idle pause, anything): start a new session on the same repo and paste the same prompt. data/batch-state.json lets it continue.
- **One optional setting unlocks more:** at claude.ai/code, open the environment selector (the cloud icon above the message box) → hover Default → settings icon → Network access: **Full**. With the default "Trusted" level, Hugging Face auto-capture and some research pages may be blocked; the S1 environment check tells you exactly what works.
- **Free alternatives used instead of paid tools:** narration → captions-only format with code-generated sound; stock music → generated beds + Instagram's in-app library; link-in-bio tools → GitHub Pages hub; domain → specimindlab.github.io; paid generation → free tiers + open-source models; video editor and render farm → Remotion inside GitHub Actions; analytics → native dashboards + the Scorecard tab.
- **When the first commission arrives:** buy a domain such as `specimindlab.com` and point it at the same GitHub Pages site. Catalog numbers stay the same.
