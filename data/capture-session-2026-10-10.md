# Capture session · 2026-10-10

Ten tests, nine logins, about **2 h 08 min** plus Kling's queue. Do them in this order (one login per block). Every free-plan fact here was checked on 2026-10-10; sources are in each folder's README.

When you've uploaded, type `/batch N`: uploaded tests are made first and get the next free numbers. Do any subset; nothing waits on the rest.

## Set up once (15 min)

- [ ] **OBS** → Settings → Output → Output mode **Advanced** → Recording: Recording format **MP4**, Encoder **x264**, Rate control **CBR**, Bitrate **2500 Kbps**; tick **Automatic File Splitting** → *Split by size* **24 MB** (keeps every file under GitHub's 25 MB web-upload limit; a 60 s recording is about 19 MB). Settings → Video: Base and Output **1920×1080**, **30 fps**. Audio: desktop audio on, mic off.
- [ ] Capture only the browser window (Window Capture), hide the bookmarks bar, turn off notifications. If your email shows on screen, that's fine: we crop it out.
- [ ] The rules for every test: **free plan only** (no trial, no paying), **one attempt**, the input and settings exactly as written, start OBS **before** you click Generate, stop when the result is fully shown, download the result untouched.
- [ ] Each test's `notes.txt`: how long the result took, credits before/after, the model name shown, and anything odd (an error, a retry, a queue). If a tool blocks the test (no credits, upgrade wall), upload just `notes.txt` saying so: that's useful too.
- [ ] **Upload:** open the test's upload link, drag the files in, click **Commit changes**. Several screen files → name them `screen-1.mp4`, `screen-2.mp4` ….

## 1 · Google (one login for both) · about 20 min

Login: Your Google account (18+).

### R016 · Gemini Notebook (was NotebookLM): Turn one book chapter into a two-host audio show; we check what it gets right

- [ ] Input: [faraday-candle-lecture-1.pdf](https://github.com/specimindlab/specimindlab.github.io/blob/main/captures/R016-notebooklm/raw/input/faraday-candle-lecture-1.pdf) · [settings.txt](https://github.com/specimindlab/specimindlab.github.io/blob/main/captures/R016-notebooklm/raw/input/settings.txt)
- [ ] notebook.google.com > Create new notebook > upload the PDF.
- [ ] Start OBS, then Studio > Audio Overview (Deep Dive, Default length, English). If one starts by itself when the PDF goes in, use that and note it.
- [ ] Leave it recording until the audio is ready (a few minutes; split files are fine). Press play for 10 s, stop OBS.
- [ ] Three-dot menu > Download.
- [ ] Upload `screen.mp4` (or `screen-1.mp4`, `screen-2.mp4` …), `result.<ext>`, `notes.txt` (minutes it took) to **[captures/R016-notebooklm/raw](https://github.com/specimindlab/specimindlab.github.io/upload/main/captures/R016-notebooklm/raw)**
- Cost: 1 audio overview from the free allowance. Fine.

### R012 · Gemini image editing: Remove a person (and her reflection) from a beach photo, then relight it

- [ ] Input: [beach.jpg](https://github.com/specimindlab/specimindlab.github.io/blob/main/captures/R012-gemini-image/raw/input/beach.jpg) · [prompt.txt](https://github.com/specimindlab/specimindlab.github.io/blob/main/captures/R012-gemini-image/raw/input/prompt.txt)
- [ ] gemini.google.com > new chat > model menu: **Flash** (not Auto). If Flash isn't offered, keep the default and write which model it shows.
- [ ] Start OBS, attach the photo, paste message 1, send; when the image appears, paste message 2 in the same chat, send.
- [ ] Stop OBS when the second image is fully shown.
- [ ] Download both images.
- [ ] Upload `screen.mp4`, `result-1-removed.png`, `result-2-golden.png`, `notes.txt` (model shown) to **[captures/R012-gemini-image/raw](https://github.com/specimindlab/specimindlab.github.io/upload/main/captures/R012-gemini-image/raw)**
- Cost: 2 edits from the free allowance. Fine.

## 2 · Adobe · about 15 min

Login: A free Adobe account. Don't start the Premium trial.

### R026 · Adobe Podcast Enhance: Fix an echoey bathroom phone recording

- [ ] Input: [script.txt](https://github.com/specimindlab/specimindlab.github.io/blob/main/captures/R026-adobe-podcast-enhance/raw/input/script.txt)
- [ ] **Before the session:** read script.txt into your phone's voice recorder in a small tiled bathroom, door shut, about 30 cm away. That file is `before.<ext>`.
- [ ] podcast.adobe.com/enhance > sign in. Start OBS, upload before.<ext>, wait, play 5 s of the result.
- [ ] Don't touch any slider. Stop OBS, Download.
- [ ] Upload `before.<ext>`, `screen.mp4`, `result.<ext>`, `notes.txt` (v1 or v2 if shown) to **[captures/R026-adobe-podcast-enhance/raw](https://github.com/specimindlab/specimindlab.github.io/upload/main/captures/R026-adobe-podcast-enhance/raw)**
- Cost: About 20 s of the free 1 hour a day. Fine.

## 3 · ElevenLabs · about 8 min

Login: A free ElevenLabs account.

### R007 · ElevenLabs Sound Effects: A sound effect from one sentence

- [ ] Input: [prompt.txt](https://github.com/specimindlab/specimindlab.github.io/blob/main/captures/R007-elevenlabs/raw/input/prompt.txt)
- [ ] elevenlabs.io > Playground > Sound Effects; Duration Auto, Looping off, Prompt influence 30%.
- [ ] Start OBS, paste the prompt, generate, play each of the 4 versions once.
- [ ] Stop OBS. History > download all 4 (MP3).
- [ ] Upload `screen.mp4`, `result-1.mp3` … `result-4.mp3`, `notes.txt` to **[captures/R007-elevenlabs/raw](https://github.com/specimindlab/specimindlab.github.io/upload/main/captures/R007-elevenlabs/raw)**
- Cost: 200 of 10,000 free credits. Fine.

## 4 · Ideogram · about 8 min

Login: Sign in with **Google, Apple or Microsoft** (email sign-ups get 0 free credits).

### R025 · Ideogram: A poster that must spell 3 lines of text exactly

- [ ] Input: [prompt.txt](https://github.com/specimindlab/specimindlab.github.io/blob/main/captures/R025-ideogram/raw/input/prompt.txt)
- [ ] ideogram.ai > Image > Model: **Ideogram 4.5**, **Magic Prompt off**, the rest default.
- [ ] Write down the credits shown on the Generate button. Start OBS, paste the prompt, Generate.
- [ ] Stop OBS when all 4 images are shown. Download all 4 (JPEG).
- [ ] Upload `screen.mp4`, `result-1.jpg` … `result-4.jpg`, `notes.txt` (credits on the button) to **[captures/R025-ideogram/raw](https://github.com/specimindlab/specimindlab.github.io/upload/main/captures/R025-ideogram/raw)**
- Cost: **Warning:** 30 free credits a week and the cost per image isn't published, so this may be the only run this week.

## 5 · Photoroom · about 8 min

Login: A free Photoroom account (web app).

### R015 · Photoroom AI Backgrounds: A desk product photo to a clean studio shot

- [ ] Input: [bottle-on-desk.jpg](https://github.com/specimindlab/specimindlab.github.io/blob/main/captures/R015-photoroom/raw/input/bottle-on-desk.jpg) · [settings.txt](https://github.com/specimindlab/specimindlab.github.io/blob/main/captures/R015-photoroom/raw/input/settings.txt)
- [ ] app.photoroom.com > Explore (or AI Tools) > AI Backgrounds.
- [ ] Start OBS, upload the photo; don't type a prompt; wait for the 2 backgrounds.
- [ ] Stop OBS. Download both as PNG.
- [ ] Upload `screen.mp4`, `result-1.png`, `result-2.png`, `notes.txt` to **[captures/R015-photoroom/raw](https://github.com/specimindlab/specimindlab.github.io/upload/main/captures/R015-photoroom/raw)**
- Cost: **Warning:** Photoroom no longer publishes the free AI-credit allowance. If it asks you to upgrade first, stop and write that in notes.txt (no paying).

## 6 · Gamma · about 12 min

Login: A free Gamma account.

### R011 · Gamma: A 10-slide deck on composting from one prompt; we count what needs fixing

- [ ] Input: [prompt.txt](https://github.com/specimindlab/specimindlab.github.io/blob/main/captures/R011-gamma/raw/input/prompt.txt)
- [ ] gamma.app > **Use classic generator** > Generate > Presentation, 10 slides, English, defaults.
- [ ] Note the credit balance. Start OBS, paste the prompt, generate (accept the outline as it is), scroll through all 10 slides once.
- [ ] Stop OBS. Share > Export > PDF. Note the balance again, and the cheapest paid price on gamma.app/pricing.
- [ ] Upload `screen.mp4`, `result.pdf`, `notes.txt` (credits before/after, paid price) to **[captures/R011-gamma/raw](https://github.com/specimindlab/specimindlab.github.io/upload/main/captures/R011-gamma/raw)**
- Cost: Uses part of the 400 one-time free credits (they never refill). Fine for one run.

## 7 · Lovable · about 15 min

Login: A free Lovable account.

### R018 · Lovable: A habit-tracker app from one paragraph; we test 3 features

- [ ] Input: [prompt.txt](https://github.com/specimindlab/specimindlab.github.io/blob/main/captures/R018-lovable/raw/input/prompt.txt) · [tests.txt](https://github.com/specimindlab/specimindlab.github.io/blob/main/captures/R018-lovable/raw/input/tests.txt)
- [ ] lovable.dev > prompt box, **Build** mode.
- [ ] Start OBS, paste the paragraph, send, wait for the preview.
- [ ] Do the 3 checks in tests.txt in the preview (no fix messages). Stop OBS.
- [ ] More options under the reply > note "Credits used".
- [ ] Upload `screen.mp4` (split parts fine), `notes.txt` (credits used; pass/fail for each check) to **[captures/R018-lovable/raw](https://github.com/specimindlab/specimindlab.github.io/upload/main/captures/R018-lovable/raw)**
- Cost: About 1-3 of the 5 free daily credits. Fine.

## 8 · Tripo · about 12 min

Login: A free Tripo account (studio.tripo3d.ai).

### R001 · Tripo: A photo of a mug to a textured 3D model

- [ ] Input: [mug.jpg](https://github.com/specimindlab/specimindlab.github.io/blob/main/captures/R001-tripo/raw/input/mug.jpg) · [settings.txt](https://github.com/specimindlab/specimindlab.github.io/blob/main/captures/R001-tripo/raw/input/settings.txt)
- [ ] Tripo Studio > Generate > Image to 3D, default model, texture on. Note the credits and the model name.
- [ ] Start OBS, upload, Generate; when done, rotate the model once all the way round.
- [ ] Stop OBS. Export > GLB. Note the credits again and the free plan numbers on the pricing page.
- [ ] Upload `screen.mp4`, `result.glb`, `notes.txt` (model, credits, free plan numbers) to **[captures/R001-tripo/raw](https://github.com/specimindlab/specimindlab.github.io/upload/main/captures/R001-tripo/raw)**
- Cost: Tripo's cost per model isn't published (third parties say about 15 of 200 monthly credits). Should fit.

## 9 · Kling (last, because of its queue) · about 15 min

Login: A free Kling account.

### R004 · Kling: A still-life photo turned into a 5-second video with a hand picking up an apple

- [ ] Input: [still-life.jpg](https://github.com/specimindlab/specimindlab.github.io/blob/main/captures/R004-kling-3-0/raw/input/still-life.jpg) · [prompt.txt](https://github.com/specimindlab/specimindlab.github.io/blob/main/captures/R004-kling-3-0/raw/input/prompt.txt)
- [ ] kling.ai > Create > Video > Image to Video; default model, 5 s.
- [ ] Look at the credit balance and the cost on Generate. **If the balance is 0, stop** and upload only notes.txt saying so.
- [ ] Start OBS, upload, paste the prompt, Generate; keep recording through the queue (split files are fine) until the video plays.
- [ ] Stop OBS. Download (with watermark; that's fine).
- [ ] Upload `screen.mp4` (split parts fine), `result.mp4`, `notes.txt` (model, credits, queue time) to **[captures/R004-kling-3-0/raw](https://github.com/specimindlab/specimindlab.github.io/upload/main/captures/R004-kling-3-0/raw)**
- Cost: **Warning:** Kling's own pages disagree on whether free accounts get credits at all, and don't publish the cost.

## Free credits this month

Every test fits a fresh free account once. Three are uncertain: **Ideogram** (30 credits a week, cost per image not published), **Photoroom** (free AI allowance no longer published) and **Kling** (may give free accounts no credits). Gamma's 400 credits are one-time. None of them needs a second run: one attempt is the rule.

## One thing to know (no action needed today)

The free plans of ElevenLabs, Kling, Photoroom and Tripo say their output is for personal or non-commercial use (ElevenLabs also wants "elevenlabs.io" in the title of anything published). We show the output as a short, credited review clip, and the batch will add the attribution each tool asks for. Once the channel earns money, check this again.

The other 12 waiting tests (3D tools, comparisons, HeyGen, Chit and more) are in [data/needs-capture.md](needs-capture.md) for a later session.
