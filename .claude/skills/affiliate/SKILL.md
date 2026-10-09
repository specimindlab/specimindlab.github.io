---
name: affiliate
description: Add (or remove) an affiliate link for a tool SPECIMIND covered, following the disclosure rules (FTC, ASCI) on the hub, in the video label and in the post copy. Use when the human types /affiliate.
argument-hint: "<code or E###> <tracking url | remove> [sub-ID parameter]"
disable-model-invocation: true
---

# /affiliate: add an affiliate link the honest way

Arguments: `$ARGUMENTS` (the code or episode id, then the tracking URL or `remove`, optionally the network's sub-ID parameter).

Rules that never bend: the link never changes a verdict, score, catch or ranking. A tool rated "Skip it" can carry a link, but the hub won't show a Try button for it and points to the best "Worth it" alternatives instead (`site/build.mjs` does this). The disclosure must be clear wherever the link appears.

1. `git pull origin main`; `python3 scripts/channel_status.py`; read the "Money" lines in `CLAUDE.md` and the `affiliate_url` and `affiliate_subid_param` fields in `data/catalog.json` `fields`.
2. Check the URL: https, and the network's domain or the tool's own domain with a referral parameter. If a sub-ID parameter is given, store it in `affiliate_subid_param` (the hub adds `p-<platform>-e###` per click source). Otherwise the hub detects it for known networks.
3. In `data/catalog.json`, set the entry's `affiliate_url` (or clear it for `remove`) and `disclosure` (`Affiliate`, or back to `Unpaid` for `remove`). Set the same `disclosure` in the episode's `facts.json`, so `catalog_sync.mjs` keeps it (facts.disclosure is "the relationship today").
4. Then depends on whether the video is out yet:
   - **Not posted yet:** the video itself must say "Affiliate link" for its whole length. Set `"disclosure": "Affiliate"` in script.json and change the disclosure lines in meta/youtube.md (first line), instagram.md and x.md to say there is an affiliate link. Then follow `/revise` steps 4–7 (re-render, check, re-release the batch).
   - **Already posted:** the posted video stays as it is (there was no affiliate relationship when it was made). Write the human the exact lines to add on each platform if they put the link there: YouTube description first line "Affiliate link: we may earn a commission. It never changes our verdict.", the same in the pinned comment and the Instagram auto-DM text, and "#ad" next to the link on X.
5. `node site/build.mjs` must pass (it refuses an affiliate_url without the Affiliate disclosure). Commit and push. After Pages deploys, check the tool's page shows the Try button with `rel="sponsored"` and the disclosure paragraph.
6. Reply with what changed, where the link now appears, and what the human must still do on the platforms.
