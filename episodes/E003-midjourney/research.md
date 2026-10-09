# E003 · #003 · Midjourney — research (desk study, not hands-on)

**Against the calendar:** the calendar is right that Midjourney has no free tier on midjourney.com or Discord. One exception exists: the separate niji・journey mobile app (Midjourney's anime-style model) gives new app-store users a small trial. It does not unlock Midjourney's main models, so this stays a Field sketch. **Disclosure:** the calendar said "Check for program". We found no public Midjourney affiliate programme, so the label is **Unpaid**.

## What it is
- Midjourney: a text-to-image (and image-to-video) generator run by an independent research lab. The current image model is V8.2: "We are launching our V8.2 image model today. This update focuses on aesthetics and image quality and personalization." Posted 24 Jul 2026. [https://updates.midjourney.com/version-8-2/, accessed 2026-10-09 via https://updates.midjourney.com/rss/]
- A V8.2 edit model (instruction edits, up to 4 image references, inpainting, outpainting) opened to everyone for testing on 27 Aug 2026. [https://updates.midjourney.com/edit-model-for-v8/, accessed 2026-10-09 via RSS]
- A "Thinking Mode" for images is in testing on alpha.midjourney.com ("Rerun (Thinking)"); Midjourney says it helps "prompt accuracy, typography, and coherence". Posted 8 Oct 2026. [https://updates.midjourney.com/testing-thinking-mode/, accessed 2026-10-09 via RSS]
- Midjourney announced its first acquisition (Co–Star) on 23 Jul 2026. [https://updates.midjourney.com/midjourneys-first-acquisition/, accessed 2026-10-09 via RSS]

## Habitat (where it runs)
- Web app (midjourney.com, Create page) and Discord (the Midjourney Bot). No public API is listed in the docs we could reach. [https://docs.midjourney.com/docs/create-page, searched 2026-10-09; https://docs.midjourney.com/hc/en-us/articles/27870484040333-Comparing-Midjourney-Plans, searched 2026-10-09]
- niji・journey: a separate app (iOS / Android) for the anime-style model. [https://nijijourney.com/help-center/sub-trial-generation, accessed 2026-10-09]

## Feeds on
- Text prompts; images as references (edit model: "up to 4 image references at once"), moodboards and style references (srefs); personalization profiles built from your ratings. [https://updates.midjourney.com/edit-model-for-v8/, accessed 2026-10-09 via RSS; https://updates.midjourney.com/version-8-2/, accessed 2026-10-09 via RSS]
- Outputs: a grid of four images per standard prompt; Draft mode in V8.1/V8.2 makes "a big batch of 24 images" at 512 × 512 for 0.4 GPU minutes; video. [https://docs.midjourney.com/hc/en-us/articles/35577175650957-Draft-Conversational-Modes, searched 2026-10-09; https://docs.midjourney.com/hc/en-us/articles/32176522101773-Quality, searched 2026-10-09]

## Free tier
- None on midjourney.com or Discord. Midjourney's docs: a limited trial is "available on the niji journey app, available for iOS and Android devices. No free trial is currently available in Discord or the midjourney.com website." [https://docs.midjourney.com/hc/en-us/articles/27870399340173-Free-Trials, searched 2026-10-09]
- niji・journey: "The niji・journey free trial is only available for new users who download the app from the official Play Store or App Store." "Emulator users cannot access the free trial." The size is given as 20 generations in the Help Center's search snippet, not on the page we fetched, so it is not used on screen. [https://nijijourney.com/help-center/sub-trial-generation, accessed 2026-10-09]
- The free web trial (25 images) was suspended in 2023 and briefly reopened in Aug 2024; no current source reports it back. [https://www.testingcatalog.com/midjourney-introduced-free-access-to-its-ui-with-25-ai-image-generations/, searched 2026-10-09; https://techjacksolutions.com/ai-tools/midjourney/is-midjourney-free/, searched 2026-10-09]

## Paid from
- Monthly: Basic $10, Standard $30, Pro $60, Mega $120. Yearly: $96, $288, $576, $1,152 (20 % off). [https://docs.midjourney.com/hc/en-us/articles/27870484040333-Comparing-Midjourney-Plans, searched 2026-10-09 (the docs host returns 403 to our fetcher; figures from the search index of that page, matching https://www.eesel.ai/blog/midjourney-pricing and https://felloai.com/midjourney-pricing/, searched 2026-10-09)]
- Fast GPU time per month: Basic 3.3 h (200 min), Standard 15 h, Pro 30 h, Mega 60 h. Unused Fast time does not roll over. [https://docs.midjourney.com/hc/en-us/articles/27870484040333-Comparing-Midjourney-Plans, searched 2026-10-09]
- Relax mode (unlimited, slower, "wait times ranging from 0 to 30 minutes"): Standard, Pro and Mega only; "Basic plan subscribers do not have access to Relax Mode." [https://docs.midjourney.com/hc/en-us/articles/32016412137741-GPU-Speed-Fast-Relax-Turbo, searched 2026-10-09]
- Cost of a prompt: "Processing one image prompt usually takes about one minute of GPU time", one video prompt about eight; SD 0.8 min, HD 1.3 min. [https://docs.midjourney.com/hc/en-us/articles/32016412137741-GPU-Speed-Fast-Relax-Turbo, searched 2026-10-09]
- Extra Fast time: $4 an hour ("Hourly Prices are experimental and subject to change"). [https://docs.midjourney.com/hc/en-us/articles/33570952624141-Purchasing-Extra-Fast-Time, searched 2026-10-09]
- **Price math (ours, from the figures above):** Basic $10 → 200 Fast minutes → about 200 standard prompts → about 800 images (4 per grid) → about 1.25 cents an image. At SD (0.8 min) it is about 250 prompts.

## Licence and privacy for output
- Public by default: under the Terms of Service (effective 27 May 2026), your content is publicly viewable and remixable unless you change the setting. [https://docs.midjourney.com/hc/en-us/articles/32083055291277-Terms-of-Service, searched 2026-10-09]
- Stealth Mode (private images) is "only available on the Pro and Mega Plans", and changing the default does not make existing images private. [https://docs.midjourney.com/hc/en-us/articles/32019750070669-Stealth-Mode, searched 2026-10-09; https://docs.midjourney.com/hc/en-us/articles/28014645615373-Keeping-Your-Creations-Private, searched 2026-10-09]
- Companies (or their employees) with more than $1,000,000 USD a year in revenue must be on Pro or Mega to own their assets. [https://docs.midjourney.com/hc/en-us/articles/32083055291277-Terms-of-Service, searched 2026-10-09; https://docs.midjourney.com/hc/en-us/articles/27870375276557-Using-Images-Videos-Commercially, searched 2026-10-09]

## Launch / last major update
- V8.2 image model: 24 Jul 2026 (current). V8 edit model: 27 Aug 2026. Latest changelog: Alpha Changelog 10/7/26. [https://updates.midjourney.com/rss/, accessed 2026-10-09]

## Affiliate programme
- None found. A comparison blog states Midjourney has no public affiliate programme; nothing on Midjourney's own pages suggests one. Label: Unpaid. [https://stacksheriff.com/ai-tools/midjourney-alternatives-affiliate/, searched 2026-10-09]

## Known limitations reported by others
- Text in images: better in V8, but "not best-in-class"; Ideogram is named as ahead for text-heavy work. [https://metavert.io/compare/midjourney-vs-text-to-image, searched 2026-10-09]
- Prompt adherence: reviewers report V8 "tends to interpret rather than execute" and is still behind some rivals on precise adherence. [https://www.mindstudio.ai/blog/what-is-midjourney-v8-alpha-strengths-weaknesses, searched 2026-10-09; https://the-decoder.com/?p=33341, searched 2026-10-09]
- Workflow: Discord-first heritage and no general API access make it awkward for production pipelines. [https://framia.converge.ai/blog/midjourney-v8-review/, searched 2026-10-09]

## The flaw we circle (research, not observed)
- **"Public unless you pay $60"**: on Basic ($10) and Standard ($30), every image you make is publicly viewable and remixable; privacy (Stealth) starts at Pro, $60 a month. Sources above (Terms of Service, Stealth Mode).
