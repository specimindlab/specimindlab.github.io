---
name: captures
description: Build the human's recording checklist for SPECIMIND tests only they can do (tools whose free plan needs their login), grouped by tool, with inputs ready to download and upload links. Use when the human types /captures or asks what they need to record.
argument-hint: "[N=10] [R### ...]"
disable-model-invocation: true
---

# /captures: what the human needs to record

Arguments: `$ARGUMENTS`. A plain number N = how many tests to plan (default 10); `R###` tokens = specific rows.

1. `git pull origin main`; `python3 scripts/channel_status.py`; read `CLAUDE.md`, `prompts/ops-notes.md`, `data/needs-capture.md`, Playbook R and the "Needs capture" rules in `.claude/skills/batch/SKILL.md` step 2.
2. Start from the existing `captures/R###-*/` folders without uploads. If there are fewer than N, look further down the calendar (`python3 scripts/new_episode.py next 60`) for rows that will need the human (research the free plan this week; a public no-login demo means **we** can test it, so it is not a capture). Create each new request with `python3 scripts/new_episode.py capture R###`. Requests use no episode number.
3. For every request make sure `captures/R###-*/raw/input/` holds the exact input (a licensed photo from Unsplash/Pexels/CC0 with `SOURCES.md`, or the prompt text in `prompt.txt`), and that its `README.md` checklist is current (free plan limits checked this week, with source).
4. Write `data/capture-session-<YYYY-MM-DD>.md`, **grouped by tool**, so the human logs in to each tool only once. For each test:
   - [ ] the input's GitHub link and the exact settings to use;
   - [ ] what to record: start OBS before clicking Generate, stop when the result is fully visible, one attempt only;
   - [ ] what to download from the tool and the file names (`screen.mp4`, `result.<ext>`, `notes.txt` with the time the result took and anything odd);
   - [ ] the upload link `https://github.com/specimindlab/specimindlab.github.io/upload/main/captures/<R###-slug>/raw` (drag files, Commit changes);
   - the credit cost, and a warning if the free credits don't cover every test this month.
   At the top: OBS settings that keep a 60-second 1080p recording under GitHub's 25 MB web-upload limit (Output → Advanced → Recording: x264, CBR, 2500 Kbps; Video: 30 fps), and the total time the session will take.
5. Update `data/needs-capture.md` to match. Commit and push ("captures: session <date>").
6. Reply with the link to the session file on github.com, the tools in the order to do them, and: "When the files are uploaded, run `/batch N`: uploaded tests are made first and get the next free numbers."
