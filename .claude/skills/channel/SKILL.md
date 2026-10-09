---
name: channel
description: SPECIMIND dashboard. Shows what's made, released and posted, which recordings are waiting, what the next batch would make, the live state of GitHub (render runs, releases, hub), and the command menu. Use when the human types /channel or asks where the channel stands or what to do next.
argument-hint: "[short | full]"
---

# /channel: where the channel stands

Arguments: `$ARGUMENTS` (`short` for five lines; default is the full view).

1. `git pull origin main`, then `python3 scripts/channel_status.py` (repo state, no network).
2. Add the live state from GitHub (REST only):
   - Last 5 workflow runs: `gh api "repos/specimindlab/specimindlab.github.io/actions/runs?per_page=5" --jq '.workflow_runs[] | [.name,.status,.conclusion,.created_at] | @tsv'`.
   - Releases and their assets: `gh api "repos/specimindlab/specimindlab.github.io/releases?per_page=10" --jq '.[] | [.tag_name, ([.assets[].name] | join(", "))] | @tsv'`. Flag any release with assets other than one zip, and any release whose batch file no longer exists (superseded: the human can delete it).
   - The hub: `curl -s -o /dev/null -w '%{http_code}' https://specimindlab.github.io/<code>` for every made code.
3. Reply in plain words, short:
   - **Made and ready to post** (table: id, code, tool, verdict/score, suggested post time, posted yes/no).
   - **Waiting for you:** recordings to make (count, link to `data/needs-capture.md`), uploads already in (they go first in the next /batch), releases to delete.
   - **Next up:** the rows `/batch 3` would make now, and whether the calendar needs `/scout`.
   - **Problems:** failed runs, hub pages not 200, an unfinished batch.
   - **One recommended next command.**
4. End with the menu:

| Command | What it does |
|---|---|
| `/batch N` | Make the next N videos and publish one Release zip (`/batch 3`, `/batch 2 R015`) |
| `/channel` | This dashboard |
| `/captures [N]` | Your recording checklist for tests only you can do (needs your login) |
| `/scout [N]` | Find N new AI tools worth testing and add them to the calendar |
| `/posted E### <links>` | After posting: put the YouTube/Instagram/X links on the hub |
| `/revise E### <change>` | Change a made video or its copy and re-release it |
| `/rerelease <batch>` | Render a batch again and replace its Release zip |
| `/affiliate <code> <url>` | Add an affiliate link to a tool's hub page (with the disclosure rules) |
| `/weekly` | Weekly review from your analytics export, plus next week's picks |

Do not change any file in this command.
