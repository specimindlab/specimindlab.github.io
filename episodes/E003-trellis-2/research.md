# E003 · 003 · TRELLIS 2 — research

**Against the calendar:**
- TRELLIS.2 is not new: the weights went up on 1 Dec 2025, the paper on 16 Dec 2025 and the Space on 10 Dec 2025. The Rare Sighting stamp therefore shows the real date ("Out since Dec 2025"); the rare part is that few people outside 3D circles know a Microsoft model this good is free in a browser tab.
- "Free Hugging Face Space demo" is true, but the free path is Hugging Face's ZeroGPU quota, and logged out it is tiny: each Generate asks for 120 GPU seconds and so does each "Extract GLB", while an unauthenticated visitor gets 120 GPU seconds a day in total (details below). From this VM, 23 anonymous requests between 09:30 and 12:44 UTC were refused before any generation ran (the outbound address is shared, so its quota is usually spent); the 24th, at 12:49 UTC, ran. All logged in `raw/auto/refusals.json`.
- The Space removes the background with a second Space (BRIA RMBG 2.0), and that call was refused for our anonymous session ("exceeded your ZeroGPU runs limit"). The Space's own instructions say to upload "preferably" an alpha-masked image, so our test uploads the drawing with its background already keyed out (see Inputs). This is stated on the Conditions card.

## What it is
- TRELLIS.2: "a state-of-the-art large 3D generative model (4B parameters) designed for high-fidelity image-to-3D generation", built on a sparse voxel structure called O-Voxel, with "full PBR materials" (base colour, roughness, metallic, opacity). [https://github.com/microsoft/TRELLIS.2, accessed 2026-10-09]
- Maker: Microsoft (Microsoft Research). Paper: "Native and Compact Structured Latents for 3D Generation", arXiv 2512.14692, published 2025-12-16. [https://arxiv.org/abs/2512.14692, accessed 2026-10-09 via https://export.arxiv.org/api/query?id_list=2512.14692]
- Speed claimed by the authors on an NVIDIA H100: 512³ ~3 s, 1024³ ~17 s (10 s shape + 7 s material), 1536³ ~60 s. [https://github.com/microsoft/TRELLIS.2, accessed 2026-10-09]

## Habitat (where it runs)
- Browser: the official Hugging Face Space microsoft/TRELLIS.2, on ZeroGPU. [https://huggingface.co/spaces/microsoft/TRELLIS.2, accessed 2026-10-09; https://huggingface.co/api/spaces/microsoft/TRELLIS.2, accessed 2026-10-09]
- Open weights you can run yourself: "An NVIDIA GPU with at least 24GB of memory is necessary", Linux only, verified on A100 and H100. [https://github.com/microsoft/TRELLIS.2, accessed 2026-10-09]

## Feeds on
- One image, "preferably with an alpha-masked foreground object"; without alpha the Space removes the background through BRIA RMBG 2.0. [https://huggingface.co/spaces/microsoft/TRELLIS.2/raw/main/app.py, accessed 2026-10-09]
- Settings in the Space: resolution 512 / 1024 (default) / 1536; GLB export with decimation target (default 300,000 faces) and texture size (default 2048). [same app.py]
- Output: an 8-view preview in six render modes (normal, clay, base colour, three HDRI lightings), then a textured GLB on "Extract GLB". [same app.py]

## Free tier (exact limits)
- Hugging Face ZeroGPU daily quota: "Unauthenticated: 2 minutes, Low priority; Free account: 5 minutes, Medium; PRO account: 40 minutes (extensible), Highest". "Included daily quota resets exactly 24 hours after your first GPU usage." [https://huggingface.co/docs/hub/en/spaces-zerogpu, accessed 2026-10-09]
- The Space requests 120 GPU seconds for Generate and 120 for Extract GLB (`@spaces.GPU(duration=120)` on `image_to_3d` and `extract_glb`). [https://huggingface.co/spaces/microsoft/TRELLIS.2/raw/main/app.py, accessed 2026-10-09]
- What this means logged out (our reading of the two facts above, checked by our run): one Generate fits in the 120-second quota; once it has used any GPU time, a second 120-second request (the GLB) no longer fits until the quota resets. A free account (300 s) fits Generate + GLB once or twice a day.
- Our refusals, verbatim: "You have exceeded your ZeroGPU runs limit. Authenticate with a Hugging Face token for more quota" (background removal, 09:30 UTC) and "You have exceeded your ZeroGPU quota (120s requested vs. 0s left)" (Generate, 09:34 and 09:35 UTC). [raw/auto/refusals.json, 2026-10-09]

## Paid from
- Hugging Face PRO: "$9 /month", with "8× ZeroGPU quota and highest queue priority". [https://huggingface.co/pricing, accessed 2026-10-08 for E002; same page and price used here]
- Beyond the daily quota (PRO/Team/Enterprise): "$1 per 10 minutes" of GPU time from pre-paid credits. [https://huggingface.co/docs/hub/en/spaces-zerogpu, accessed 2026-10-09]
- Microsoft sells no TRELLIS plan. Third-party hosted APIs exist (not tested, not used on screen). [https://piapi.ai/en/blogs/trellis-2-vs-trellis-3d-generation-api, searched 2026-10-09]

## Our test (2026-10-09, 12:49 UTC, logged out, one attempt)
- Generate ran in 40.7 s wall clock (submit to preview; the status stream reported no separate queue phase). Upload/background step 2.5 s. Seed 324847287, Space defaults (1024, 12/12/12 steps). [raw/auto/dragon-concept-alpha.run.json]
- Then "Extract GLB" was refused: "You have exceeded your ZeroGPU quota (120s requested vs. 0s left)". So, logged out, we got the Space's 8-angle preview but no downloadable model. [same file]
- What the preview shows: one coherent creature with both wings, horns, claws, eye and the S-curve of the tail; seen side-on (view 7, a view the drawing never showed) the tail is a broad flat paddle. The shaded and base-colour previews show the blue body as near-black and the cream belly as lime; the drawing's blue is a mid tone, and the preview's colours look like linear values shown without gamma, so without the GLB we cannot tell whether the texture or only the preview is dark. Not used as the flaw. [raw/auto/views/*.jpg]

## Licence for outputs
- Model and code: MIT License. Some dependencies (nvdiffrast, nvdiffrec) have their own licences. [https://github.com/microsoft/TRELLIS.2, accessed 2026-10-09; https://huggingface.co/api/models/microsoft/TRELLIS.2-4B (license: mit), accessed 2026-10-09]

## Launch / last major update
- Weights: created 2025-12-01 (last modified 2025-12-27). Space: created 2025-12-10, last modified 2026-05-20. Paper: 2025-12-16. Training code released (roadmap ticked). [https://huggingface.co/api/models/microsoft/TRELLIS.2-4B, https://huggingface.co/api/spaces/microsoft/TRELLIS.2, https://github.com/microsoft/TRELLIS.2, all accessed 2026-10-09]

## Known limitations
- From the model card: raw meshes "may occasionally contain small holes or minor topological discontinuities"; for watertight geometry (3D printing) Microsoft provides hole-filling scripts. [https://huggingface.co/microsoft/TRELLIS.2-4B, accessed 2026-10-09]
- From the model card: "not been aligned with human preferences", so "outputs ... may vary in style; users may need to experiment with inputs". [same]
- A comparison test found both TRELLIS and TRELLIS 2 "struggle" with a complex object: "The outputs lack structural accuracy and detail." [https://piapi.ai/en/blogs/trellis-2-vs-trellis-3d-generation-api, searched 2026-10-09]
- Single front image only in the Space: the back of the object is invented (ComfyUI's multi-view texturing node takes an extra back-view image for this reason). [https://comfyai.run/documentation/Trellis2MeshTexturingMultiView, searched 2026-10-09]

## Affiliate programme
- None: open-source research release. Label: Unpaid.

## Inputs used (not research claims)
- `raw/input/dragon-concept.jpg`: "A blue dragon with light green wings stands proudly" by void (@voidhve) on Unsplash, Unsplash License, published 23 Sep 2025, downloaded 2026-10-09 at 1600 × 1391. [https://unsplash.com/illustrations/a-blue-dragon-with-light-green-wings-stands-proudly-G2soPH69lSM, accessed 2026-10-09]
- `raw/input/dragon-concept-alpha.png`: the same drawing with its cream background and red disc keyed out by colour (our script, no AI; the dragon's pixels are untouched). Three AI background removers (rembg isnet-general-use, birefnet-general, u2net) kept the red disc as part of the creature, so we keyed it by colour instead.
