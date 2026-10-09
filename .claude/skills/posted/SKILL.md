---
name: posted
description: Record that SPECIMIND videos went live. Puts the YouTube, Instagram and X links on the hub (the YouTube link turns on the embedded Short), marks the calendar Posted and rebuilds the site. Use when the human types /posted.
argument-hint: "E### <youtube url> <instagram url> <x url> [E### ...]  |  <batch> (no links)"
disable-model-invocation: true
---

# /posted: the videos are out

Arguments: `$ARGUMENTS`

Read them as groups: an episode id (`E005`) or code (`005`, `W01`) followed by its links. Tell the platform from the domain: youtube.com / youtu.be → `youtube`, instagram.com → `instagram`, x.com / twitter.com → `x`. A batch name with no links (`batch-2026-10-19`) marks every episode in it as posted without links. If an id has no links, mark it posted and say that the hub can't embed it until a YouTube link is added.

1. `git pull origin main`. Validate each URL: https, the right domain, a post or Short URL (not a profile). Ask only if a URL is clearly wrong.
2. For each episode, set `links` in its entry in `data/catalog.json` (specimens[] or groups[] by code). Keep links already there unless a new one is given. Never touch verdicts, scores or anything else: `catalog_sync.mjs` never overwrites `links`, so this is the only place they live.
3. `python3 scripts/new_episode.py status Posted <ids or codes>` (it accepts E###, R### and codes such as 005 or W01).
4. `node site/build.mjs` (must build without errors). Commit and push ("posted: E### ..."). pages.yml redeploys the hub.
5. After the Pages run succeeds, check `https://specimindlab.github.io/<code>` returns 200 and contains the YouTube video id.
6. Reply: what is live where, and a reminder of the follow-ups only the human can do:
   - YouTube: pin the pinned comment from meta/youtube.md.
   - Instagram: set up the comment-keyword auto-DM with the code and the text from meta/instagram.md.
   - X: post the first reply from meta/x.md.
   Then `python3 scripts/channel_status.py --brief` for what's next.
