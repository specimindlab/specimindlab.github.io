# SPECIMIND

A field guide to new AI tools. Captions-only Shorts, Reels and X videos: one real test per tool, one attempt, one honest flaw circled in red ink. Hub: https://specimindlab.github.io

Everything runs in the cloud. Claude Code on the web does the research, scripting and review; GitHub Actions renders the videos and publishes them as Releases; GitHub Pages hosts the catalog. The rules every session follows are in [CLAUDE.md](CLAUDE.md), and the prompts to paste are in [prompts/specimind-claude-code-prompts.md](prompts/specimind-claude-code-prompts.md).

```
brand/        brand kit: logo, social, vectors, templates, reference (brand board, storyboard, Anybody font)
data/         calendar.csv (working copy) + the xlsx, series.md, schedule.json, batch-state.json, batches/, env-check.md
prompts/      the prompt pack and playbooks
video/        Remotion 4 project (TypeScript); public/fonts, public/sfx
scripts/      cloud_setup.sh, new_episode.py, render_batch.sh, loudness.sh, verify_delivery.py, render_previews.sh, smoke_test.sh
site/         catalog hub: build.mjs + src/ (deployed by .github/workflows/pages.yml to specimindlab.github.io)
episodes/     one folder per episode: E001-tripo/, ... (raw/ holds the human's uploads)
.github/      pages.yml, render.yml (Render batch), preview.yml (Render previews)
```

| Task | How |
| --- | --- |
| New episode folder | `python3 scripts/new_episode.py E001` or `--next 10` |
| Review stills | `bash scripts/render_previews.sh E001` (or Actions → Render previews) |
| Pipeline self-test | `bash scripts/smoke_test.sh` (renders and verifies the E000 fixture; no Release) |
| Catalog entry + site | `node scripts/catalog_sync.mjs E001`, then `node site/build.mjs` (pages.yml deploys on push) |
| Render + publish | push `data/batches/<batch>.json` to main, or Actions → Render batch → `batch` |

Delivery spec (identical for YouTube Shorts, Instagram Reels and X; only the CTA beat differs): 1080×1920, constant 30 fps, H.264 High, CRF 18, yuv420p, BT.709, AAC-LC 48 kHz stereo 192 kbps, +faststart, 28–40 s, under 100 MB, -14 LUFS ±1, true peak ≤ -1 dBTP.

Licences: Remotion (free for individuals and companies of up to 3 people), Anybody font (SIL OFL 1.1, `video/public/fonts/OFL.txt`). All sound is generated in code.
