# SPECIMIND voice, hooks and pacing (v2, 2026-10-08)

Read this before writing any script.json, cover, title or caption (Playbook V and P).

## What we are
**The benchmark for AI tools.** GSMArena made phones comparable with one spec sheet per phone; AnTuTu made them rankable with one number. SPECIMIND does both for AI tools: every tool is tested once, the same way, given a **SPECIMIND Score out of 100** (`data/score.md`) and pinned in its drawer (3D, Video, Image, Audio, Work, Build), where the hub ranks it against everything else we have tested. The videos are the field reports; the hub's leaderboards are where people decide and click.

## The voice: the deadpan naturalist
A field-guide narrator watching AI tools in the wild: dry, precise, quietly funny, never hype. Then, without fail, useful: it tells you exactly when to use the tool and when not to.

- **Humour is about the result, never decoration.** Research on humour and learning: jokes tied to the material improve recall and enjoyment; unrelated jokes don't ([Edutopia summary](https://www.edutopia.org/blog/laughter-learning-humor-boosts-retention-sarah-henderson), [ERIC ED223118](https://eric.ed.gov/?id=ED223118), [Pinto & Riesch 2025](https://journals.sagepub.com/doi/10.1177/02704676251353101)). So every joke points at something on screen.
- **Devices that fit captions-only video:** deadpan setup before a failure ("Confidence: high."); one-word punchlines ("shattered."); anthropomorphism ("Total show-off."); the field-guide parody ("Habitat: browser. Diet: photos."); a rule of three with a twist; callbacks to the hook.
- **Guardrails:** jokes never bend a number; punch at results, never at users or the people who build the tools; no hype words (insane, crazy, game-changer, mind-blowing, unbelievable, secret, hack) and no emoji.
- **Helpful, every time:** each video teaches one transferable lesson from the test ("Chrome confuses it: shoot matte things") and ends on a decision: **Use it for / Skip it if**.

## The emotional arc (20–30 s)
1. **Curiosity, frame 0:** the payoff or the disaster, with a number.
2. **Anticipation:** the setup ("Specimen one: chrome. Confidence: high.").
3. **Surprise:** the twist or the flaw. Comedy lives here; the music dies with it.
4. **Satisfaction:** the clean result, the score locking in on the crash.
5. **Clarity:** stamp, score, use it for / skip it if, then the platform's call to action (the affiliate click happens here).

## Hooks: the first frame decides the swipe
Viewers decide in roughly the first second; "viewed vs swiped away" is the Shorts metric that matters, and strong Shorts sit around 70 %+ viewed ([vidIQ](https://vidiq.com/blog/post/viral-video-hooks-youtube-shorts/), [Shortimize](https://www.shortimize.com/blog/youtube-shorts-retention-rate), [virvid](https://virvid.ai/blog/first-3-seconds-hook-faceless-shorts-2026)). Around half of Reels are watched with the sound off, so the hook must work as text in the first frame ([Hootsuite](https://blog.hootsuite.com/instagram-algorithm/)).

- **Frame 0 is a complete still:** label pinned, every hook line on screen (no cut-in), the strongest real visual (before → after, the disaster, or the best result). The engine does this automatically for the first beat.
- **The hook is 3–9 words, has a number or a concrete outcome, and the punchline gets the biggest line** (short lines render huge).
- **Patterns, rotated so consecutive uploads differ:** *Disaster-first* ("This lamp / shattered."), *Number-shock* ("66 free videos / a day."), *Versus-tease* ("One of these / is AI."), *Verdict-first* ("71 out of 100. / Here's why."), *Promise* ("Free textures, / no login? Nope.").
- Never open on a title card, a logo or a slow reveal. No two consecutive uploads open with the same first word or the same pattern.

## Pacing
- 20–30 s total (15–30 s completes best; [Piktochart](https://piktochart.com/blog/how-long-youtube-shorts/), [OpusClip](https://www.opus.pro/blog/ideal-youtube-shorts-length-format-retention)); the schema allows 18–40.
- Every beat is a multiple of 0.5 s (one beat at 120 bpm), so cuts land on the music. Most beats are 2–3.5 s; nothing static longer than 3 s; something moves in every beat (turntable, counter tick, card slide, stamp, score count).
- Captions: 1–6 words per line, 1–3 lines, each line pops in on the cut.

## Music
`scripts/make_music.py` composes each episode's own song from its script.json at 120 bpm, in one of six grooves (nu-disco, electro-funk, French house, UK garage, synth-pop, boom-bap funk). It is arranged like a song, not a loop: every beat gets a role and the role decides the drums, bass, chords and melody.
- **Hook** (frame 0): the SPECIMIND call phrase (A E C# F#) on the lead over the full groove, so the first second already sounds like a chorus.
- **Verses** (setup and observation beats): a different progression and a counter-melody; each verse's stinger climbs two semitones, so the middle keeps rising instead of repeating.
- **Flaw:** a tape stop into a scratch, a sad sliding bass and a vocal chop: the joke lands in silence.
- **Build and roll** (price math, score): chord pulses with the filter opening, a snare roll, the crash on the score lock.
- **Drop** (verdict): the hook's answer phrase in thirds; the payoff the viewer has been waiting for.
- Every bar varies (seeded per episode), a fill rotates in one beat before every cut, and the song's tail is folded into its first seconds, so when YouTube or Instagram loops the video the music runs straight on into the hook.

Generated in code because royalty-free libraries still get Content ID claims, and a claimed Short can be blocked ([Foxi](https://www.foximusic.com/blog/need-background-music-that-wont-trigger-content-id/), [Pixabay licence notes](https://thewavevideomarketing.com/blog/pixabay-content-license-music-youtube-monetization)). 120 bpm sits at the top of the explainer range, where short "momentum" explainers live ([Bensound](https://blog.bensound.com/creation-editing/music-for-explainer-videos/)). Pick a groove different from the previous upload's.

## Titles and copy
- Tool first, then the outcome with a number, under 60 characters: "Hunyuan3D: free 3D AI shattered this lamp (71/100)".
- Our inputs are licensed photos (Unsplash, Pexels, CC0), credited in the description and on the hub: never "my desk lamp" or "I", never imply we own or made the object.
- Captions and descriptions use the same voice: one dry line, then the facts.

## Money, honestly
The channel earns from affiliate commissions, so every video drives to the hub, where the Try buttons and leaderboards live.
- **Affiliate + Captured:** the hub's Try button is the affiliate link (with sub-ID p-{platform}-e{episode}).
- **Unpaid or Released:** the hub page shows the best-scoring Captured alternatives in the same drawer, with their (affiliate) links. We never change a verdict, a score or a flaw to sell anything.
- Calendar picks: when two episodes are equally ready, test the tool with an affiliate programme first.

## One video per platform
YouTube Shorts, Instagram Reels and X all play 1080×1920 9:16 full screen (X's main video sizes are 16:9, 1:1 and 9:16; there is no 4:5 video spec: [HeyOrca](https://www.heyorca.com/blog/x-twitter-media-specs-best-practices-2026), [postfa.st](https://postfa.st/sizes/x/video)). The edit is the same everywhere, but the end card is where the affiliate click is won, and each platform clicks differently, so every episode renders **three** files: `<id>-yt.mp4`, `<id>-ig.mp4`, `<id>-x.mp4`. Each ends on that platform's ask (script.json `cta`), with the hub URL in small print under it:
- **Instagram:** "Comment {code} for the …" triggers the auto-DM with the link (comment-to-DM converts far better than "link in bio": [SmartReply](https://smartreply.io/blog/instagram-comment-dm-automation-guide)).
- **YouTube:** links in Shorts descriptions and comments are not clickable ([YouTube Help](https://support.google.com/youtube/answer/13748639?hl=en)), so: "Tap our name for the …" sends them to the channel profile, which links to the hub; the Related Video points to the drawer's best Short.
- **X:** "… in the first reply": the first reply carries the clickable link.
- Point the CTA at what the hub gives them (the ranking, the alternatives, the link), never at "follow for more".
