# SPECIMIND voice, story and sound (v3, 2026-10-09)

Read this before writing any script.json, cover, title, caption or post (Playbooks V and P).

## Why v3: the deep dive

v2 videos looked good and said almost nothing to a first-time viewer. We watched them as someone who has never heard of SPECIMIND, the tool, or 3D models, and listed every point where that person would get lost:

| Where people get lost | Example from v2 | What it does to a viewer |
| --- | --- | --- |
| **Our private words.** The naturalist theme leaked out of the visuals and into the words. | "Live specimen", "Field sketch", "Free Range", "Captured", "Released", "Watch", "Habitat", "Feeds on", "Collection conditions", "Specimen Nº002", "Rare sighting" | They can't tell if a tool is good or bad, or what kind of video this is. |
| **Tech words.** | "chrome", "mesh", "GLB", "GPU seconds", "HF PRO", "ZeroGPU", "logged out", "Space", "octree" | Half the audience doesn't know them, so the result means nothing. |
| **No "what is this?"** | The video opened on a result and never said, in one plain sentence, what the tool is and what it's for. | The viewer can't tell why the result matters. |
| **No "why should I care?"** | Nothing connected the test to something the viewer wants (a 3D print, a game asset, a picture for their shop). | No reason to keep watching. |
| **Too fast, too dense.** | 20–25 s, 6–8 beats; cards of 3–6 small rows shown for 3–4 s next to a caption. | Nobody can read a card and a caption in 3 seconds. They swipe. |
| **Puns instead of sentences.** | "Six pieces. Zero lamp." · "Confidence: high." · "the side nobody drew" · "Total show-off." | Clever if you already understood. Confusing if you didn't. |
| **Pictures without labels.** | A photo, an arrow, a grey model on black. | Is the grey thing the result? Why is it grey? Which part is the problem? |
| **A score with no meaning.** | "71/100" with bars called Result, Speed, Free tier, Price. | 71 compared to what? Is that good? |
| **Machine rhythm.** | Every beat the same shape: two short lines, a colon, a joke. Music with a "sad trombone" gag on the flaw. | It feels made by a template, not by people. |

## The fix in one line

**Keep the look, change the words.** Paper, pins, labels, red ink and stamps stay: they are the brand. Every word on screen becomes something a 14-year-old understands on the first read, and every video tells the same simple story.

## The story (every Live video, 35–55 s)

The order below is the meaning. Each series arranges it in its own beat structure (data/series.md), but all of these answers must be on screen:

1. **Hook (0–3 s):** the real result, plus a plain question or outcome. "Can a free AI turn a drawing into a 3D model?" Frame 0 is a complete, readable still.
2. **What it is (one sentence):** "TRELLIS 2 is a free AI from Microsoft. You give it one picture, it gives you a 3D model."
3. **The test (what we did, in plain words):** "We gave it this drawing. One try. No account."
4. **What happened (shown big, labelled):** "What we gave it" / "What it made", with the time it took.
5. **What's good:** one sentence. "It kept the wings, the horns and the claws."
6. **The catch (one real problem, shown and circled):** "From the side, the tail is flat, like a paddle." Plus why, if we know: "The drawing never showed that side."
7. **Free or paid:** "Free: 1 try a day, no account. To download the model: an account or $9 a month."
8. **Our score (out of 100), said like a person would say it:** "Our score: 72 out of 100. That's our best 3D tool so far."
9. **Should you use it?** "Worth it" / "Skip it" stamp, then **Good for:** … **Not for:** …
10. **Where to go next** (the platform's call to action).

Research-only videos (no free plan, so we can't test) say so in the first five seconds: "Midjourney has no free plan, so we didn't test it. Here's what your money gets you." They never show a score.

## Words we use (and never use)

| Never on screen | Say instead |
| --- | --- |
| Live specimen | Tested by us |
| Field sketch — not hands-on | Not tested · research only |
| Captured | Worth it |
| Released | Skip it |
| Watch | Not tested |
| Rare sighting | Little-known tool |
| Specimen Nº002 | #002 |
| Field notes | The facts |
| Collection conditions | How we tested |
| Field verdict | Should you use it? |
| Use it for / Skip it if | Good for / Not for |
| Habitat | Works in |
| Feeds on | You give it |
| Free tier | Free plan |
| Honest flaw | The catch |
| Unpaid | Not sponsored |
| Affiliate | Affiliate link |
| chrome | shiny metal |
| mesh, GLB, model file | 3D model, the 3D file |
| GPU seconds, quota, ZeroGPU | free daily allowance, free tries a day |
| logged out | without an account |
| HF PRO | Hugging Face's $9-a-month plan |
| Hugging Face Space | a free demo page |

Series names (Free Range, Rare Sighting, Plate, Mimicry, Dissection, The Drawer, Extinction Watch) are **internal**. On screen and on the hub, use: Free plan test · Little-known tool · Head to head · AI or real? · Workflow · Roundup · Shut down. The pinned label shows **what the tool does** ("Turns a picture into a 3D model"), not a category word.

## Captions

- Write what you would say to a friend, out loud. Full sentences, contractions, "we" and "you". Then cut words, not meaning.
- 1–3 lines, up to 7 words a line; lines still fill the width edge to edge (the signature).
- **Reading time:** at most 2.5 words per second of the beat, counting the caption and any card rows. A 4 s beat holds 10 words. If it doesn't fit, split the beat or cut words. `scripts/plain_check.py` enforces this.
- One idea per beat. If the picture already says it, the caption says what the picture can't.
- Every beat after the hook gets a small red **chapter label** above the caption ("What it is", "The test", "The catch", "The price", "Our score"), so a viewer who looks up mid-video knows where they are.
- Pictures that need it carry labels: "What we gave it" / "What it made" / "From the side".

## Sounding human (the "made by people" check)

AI-written copy has tells. We remove them:
- No em dashes in captions; no "not just X, but Y"; no "In a world where…"; no rule-of-three jokes every beat; no colon on every line.
- Banned words: delve, unleash, unlock, elevate, revolutionise, game-changer, seamless, cutting-edge, insane, crazy, mind-blowing, unbelievable, secret, hack. No emoji.
- Vary the rhythm: some beats one line, some three; not every line a punchline.
- Opinions are ours and specific ("We'd use it for game props, not for 3D printing").
- Visuals: only our captures, the tool's real output, our own drawings and the paper look. No AI-generated imagery presented as anything but the tested output.
- Run `python3 scripts/plain_check.py <episode>` before review; it flags jargon, AI tells and reading speed in script.json and meta/.

## Humour

Light, and only about the result, never decoration: "That's not a tail. That's a paddle." is fine *after* the plain sentence has said what happened. Jokes never replace the explanation, and the music never plays a joke.

## Music (scripts/make_music.py v4)

Modern, digital and catchy: every episode gets its own track, but you can tell it's SPECIMIND within a second.
- **The brand tag:** the same four-note phrase on the same glassy synth opens every video on frame 0 and closes it on the end card. That is the logo you hear.
- **The track itself changes every time:** six modern styles (future house, melodic house, synthwave pop, future garage, electro pop, chill house), a different key, chord progression, drum pattern and topline per episode. Toplines are built from the brand tag's rhythm and intervals, so they feel related without repeating.
- **It follows the story:** lighter groove under the explaining beats (room to read), the topline arrives with the result, a calm filtered breakdown under the catch (thoughtful, never funny), a build into the score, the full chorus on the verdict.
- Synthesised in code (no samples: nothing for Content ID to claim), humanised timing and velocity, sidechain pump, proper reverb and delay. Never the same groove as the previous upload.

## Titles and posts

- Tool first, then the plain outcome with a number, under 60 characters: "Hunyuan3D: free AI turned 3 lamps into 3D (71/100)".
- Our inputs are licensed photos (Unsplash, Pexels, CC0), credited. Never "my lamp".
- Descriptions and captions use the same plain words as the video. Disclosure first line.

## Numbering

Episodes and on-screen numbers follow the order videos come out (#001, #002, #003 …), never the calendar. A tool waiting for the human's screen recording doesn't hold a number; it gets the next free one when its video is made (scripts/new_episode.py).

## Money, honestly

Unchanged: every video drives to the hub. Affiliate + "Worth it" → the hub's Try button. Not sponsored or "Skip it" → the hub shows the best "Worth it" alternatives. Scores, verdicts and catches are never changed to sell anything.

## One video per platform

Unchanged: `<id>-yt.mp4`, `<id>-ig.mp4`, `<id>-x.mp4`, identical except the end card's ask (YouTube "Tap our name…", Instagram "Comment {code}…", X "…in the first reply"), with the hub address under it. Releases ship one zip with everything.
