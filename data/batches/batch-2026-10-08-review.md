# batch-2026-10-08 — test batch review

One episode end to end (prompt B with 1), to find what breaks in the production engine before real batches.

## Result
- E001 Tripo → `data/needs-capture.md` (commercial, login needed, `raw/` empty).
- E002 Hunyuan3D (Free Range) → Live specimen, auto-captured on the official Hugging Face Space, logged out. Verdict Captured. Flaw: the chrome lamp shattered into 6 pieces. Posts 2026-10-19 06:30 IST.

## Fixed in this batch (engine)
| Problem found | Fix |
| --- | --- |
| Free Range pinned three 270 px plates in a row; 3D results were specks on a phone | Hero plate for the current result + thumbnails in the right column (`video/src/series/FreeRange.tsx`); flaw beat uses the same |
| Untextured meshes in light clay washed out on the archival plate | Turntable clay is pin steel (`video/src/system/Turntable.tsx`) |
| Turntable framed the bounding sphere: flat or sprawling meshes filled ~30 % of the plate | Framing by horizontal radius + height |
| No way to make `cover.png` or `<id>.srt` (render_batch.sh requires both) | `Cover` composition (cover template) + `scripts/make_srt.mjs`, both run by `scripts/render_previews.sh` |
| No tool for Playbook I's "three.js load test + clay render" | `scripts/glb_inspect.mjs` (vertices, triangles, textures, connected components, 4-view clay sheet) |
| No tool for Playbook I's AUTO-CAPTURE | `scripts/auto_capture_hf.py` (anonymous, one attempt, wall/queue/GPU time, fetches `gr.update` file outputs) |
| catalog_sync missed "Honest flaw:" mid-line; generic conditions lost detail; no input credits | Fixed; `facts.conditions` and `facts.credits` are used when present; the site shows credits |
| Captions and descriptions only reached the human inside the Release zip | `posting/<batch>/` text package (POSTING.md, sheet, covers, srt, meta) is committed; MP4s stay out of git |
| Release had only the zip | Each MP4 is also attached on its own (phone-friendly download) |
| POSTING.md dropped YouTube tags | Added |
| Contact sheet grew an empty row once the cover existed | Fixed |

## Still open (decisions or bigger changes)
1. **Inputs should be ours.** No photo was in `raw/input/`, so the test used three Unsplash photos (credited). Wikimedia Commons rate-limits this VM's shared IP and Openverse now needs a key. Upload your own input photos to `episodes/<id>/raw/input/` before a batch for authentic "my desk lamp" tests.
2. **Free Range opens on the counter, not the output.** CLAUDE.md's "Output first" rule conflicts with the series definition in data/series.md. I followed the series. Decide whether the counter beat should sit over a crop of the result.
3. **Observation beats show results only**, not the tool's interface or the input photo. A Playwright recording of the Space would be more convincing, but every recorded run spends GPU quota. Consider an `input` thumbnail in Free Range observations.
4. **Review stills are ~1.8 MB PNGs** (24 MB per episode in `qa/`). Over 180 episodes that is ~4 GB of git history. Consider committing JPEG stills or only the contact sheet.
5. **The calendar's free-path text is stale for open-weights tools.** "~20 generations/day" is Tencent's hosted app (login); the public Space gives 2 GPU minutes logged out. Playbook R caught it; the calendar row was not rewritten.
6. **Posting slot vs calendar.** The batch continues from `data/schedule.json`, so E002 posts in E001's slot (19 Oct 06:30) while E001 waits for capture.
