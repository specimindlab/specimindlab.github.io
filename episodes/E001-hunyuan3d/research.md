# E001 · #001 · Hunyuan3D — research

**Contradicts the calendar:** the calendar's free path ("~20 generations/day") is Tencent's own hosted web app, which needs a login. This episode tests the other free path, the official public Hugging Face Space, **logged out**. There, Hugging Face's ZeroGPU gives an unauthenticated visitor **2 GPU minutes a day**, and textured generation is refused outright, so the logged-out free tier makes untextured shapes only (our test, see facts.json). The 20/day figure is kept below as context, not used on screen.

## What it is
- Hunyuan3D 2.1: Tencent's image-to-3D model. "Jun 13, 2025: We release the first production-ready 3D asset generation model, Hunyuan3D-2.1!" Two parts: Hunyuan3D-Shape-v2-1 (image to shape, 3.3B parameters) and Hunyuan3D-Paint-v2-1 (PBR texture, 2B parameters). [https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1, accessed 2026-10-08]
- Maker: Tencent ("Team Hunyuan3D"). Technical report arXiv 2506.15442, published Jun 18, 2025. [https://huggingface.co/tencent/Hunyuan3D-2.1, accessed 2026-10-08]
- Official demo: the Hugging Face Space tencent/Hunyuan3D-2.1, running on ZeroGPU (`zero-a10g` requested in the Space runtime). [https://huggingface.co/spaces/tencent/Hunyuan3D-2.1, accessed 2026-10-08; https://huggingface.co/api/spaces/tencent/Hunyuan3D-2.1, accessed 2026-10-08]

## Habitat (where it runs)
- Browser (the Hugging Face Space, no login needed for shapes). [https://huggingface.co/spaces/tencent/Hunyuan3D-2.1, accessed 2026-10-08]
- Open weights you can run yourself: "It takes 10 GB VRAM for shape generation, 21GB for texture generation and 29GB for shape and texture generation in total." [https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1, accessed 2026-10-08]
- Tencent's hosted web app (Hunyuan 3D Global, login): 3d.hunyuanglobal.com now redirects to hy3d.tencent.ai; the page body could not be read by our fetcher. [https://3d.hunyuanglobal.com/ → 301 https://hy3d.tencent.ai/, accessed 2026-10-08]

## Feeds on
- One image (shape), or up to four views (front, back, left, right) in the Space's multi-view inputs; texture generation takes the mesh plus the image. [Space API listing via gradio_client, 2026-10-08; https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1, accessed 2026-10-08]

## Free tier (exact limits)
- Hugging Face ZeroGPU, per account tier: "Unauthenticated: 2 minutes, Low priority; Free account: 5 minutes, Medium; PRO account: 40 minutes (extensible), Highest". "Included daily quota resets exactly 24 hours after your first GPU usage." [https://huggingface.co/docs/hub/en/spaces-zerogpu, accessed 2026-10-08]
- The Space's code requests 60 s of GPU for "Gen Shape" and 180 s for "Gen Textured Shape" (`@spaces.GPU(duration=60)` / `@spaces.GPU(duration=180)` in gradio_app.py). [https://huggingface.co/spaces/tencent/Hunyuan3D-2.1/raw/main/gradio_app.py, accessed 2026-10-08]
- Our logged-out textured attempt was refused: "The requested GPU duration (270s) is larger than the maximum allowed. Subscribe to Hugging Face PRO to allow GPU tasks up to 40 min". [our run, raw/auto/textured/lamp-1-chrome.run.json, 2026-10-08]
- Tencent's hosted app: "Users of Tencent Hunyuan 3D Global will receive 20 free generations daily" (press release dated Nov. 25, 2025). Not used in this test (needs a login). [https://www.prnewswire.com/news-releases/tencent-announces-global-launch-of-hunyuan-3d-engine-to-empower-creators-with-advanced-creation-tools-302626280.html, accessed 2026-10-08]

## Paid from
- Hugging Face PRO: "$9 /month", which includes "8× ZeroGPU quota and highest queue priority". [https://huggingface.co/pricing, accessed 2026-10-08]
- Over quota (PRO/Team/Enterprise): "$1 per 10 minutes of GPU time" from pre-paid credits. [https://huggingface.co/docs/hub/en/spaces-zerogpu, accessed 2026-10-08]
- Tencent's own paid credit packs: not published on any page we could read (third-party claims of "$15 per 1,000 credits" not verified, so not used).

## Licence for outputs
- Tencent Hunyuan 3D 2.1 Community License. Territory: "the worldwide territory, excluding the territory of the European Union, United Kingdom and South Korea." "Tencent claims no rights in Outputs You generate." You "must not use ... any Output ... to improve any other AI model". Above 1 million monthly active users, a separate licence is needed. [https://huggingface.co/tencent/Hunyuan3D-2.1/blob/main/LICENSE, accessed 2026-10-08]

## Launch / last major update
- Hunyuan3D 2.1 open-sourced Jun 13, 2025. The Space was last modified 2025-08-11. [https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1, accessed 2026-10-08; https://huggingface.co/api/spaces/tencent/Hunyuan3D-2.1, accessed 2026-10-08]

## Known limitations reported by others
- Thin structures: a 2026 paper that uses the Hunyuan3D ShapeVAE reports that "structures thinner than a voxel cannot be captured by the 64³ sparse representation or the Hunyuan3D ShapeVAE bottleneck", so thin parts "are smoothed out or merged with nearby surfaces". [https://arxiv.org/pdf/2609.15639, accessed 2026-10-08 via search]
- Licence territory excludes the EU, UK and South Korea (commentary). [https://news.ycombinator.com/item?id=43420870, accessed 2026-10-08 via search]
- Windows installs are hard to get working (user report, issue #118). [https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1/issues/118, accessed 2026-10-08 via search]

## Inputs used (not research claims)
Three desk-lamp photos under the Unsplash License (see raw/input/SOURCES.md). No upload from the human was available for this test batch.
