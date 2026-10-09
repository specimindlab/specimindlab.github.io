---
name: scout
description: Find new AI tools worth testing on SPECIMIND (fresh launches with a usable free plan and a visual result) and add them as planned rows to data/calendar.csv. Use when the human types /scout or the calendar is running low.
argument-hint: "[N=7] [topic, e.g. video | 3D | audio]"
disable-model-invocation: true
---

# /scout: plan the next tests

Arguments: `$ARGUMENTS`. A plain number N = rows to add (default 7); any other words narrow the topic (a pillar such as 3D, Video, Image, Audio, Work, Build).

1. `git pull origin main`; `python3 scripts/channel_status.py`; read `CLAUDE.md`, `data/series.md`, `prompts/voice.md`, and the header plus last 30 rows of `data/calendar.csv` (column meanings, series rotation, what is already planned or made; never plan a tool we covered in the last 30 days unless it shipped a major new version).
2. Search this week's sources (WebSearch, then fetch the pages): Product Hunt's daily AI leaderboards for the past 7 days, Hugging Face trending Spaces, the official changelogs and blogs of the big labs, and "new AI tool" news from the past 14 days. For each candidate, fetch its own pricing page.
3. Keep only tools that: launched or shipped a big update in the last 30 days; produce something you can **see or hear** within about 2 minutes; and have a free plan (or a public demo). Prefer tools **we can test without the human** (a public no-login demo or open weights): they never wait on a recording. Drop anything whose free plan you can't confirm ("not published" is fine to note, guessing is not).
4. Choose the series for each so the rotation in `data/series.md` holds (no series twice in a row; Field sketches at most 1 in 5; a roundup (The Drawer) about every 7th video). Write a draft hook from what the test will show, not hype.
5. Append rows to `data/calendar.csv` (keep its CRLF line endings and every column; next Row numbers after the last R###; Episode and Code empty; Status `Planned`; the free path and affiliate status from the pricing page). Write `data/scout-<YYYY-MM-DD>.md`: one line per tool with why, the free plan, whether we can test it ourselves, and every source URL with today's date.
6. Commit and push ("scout: N new rows"). Reply with a short table (row, tool, series, can we test it ourselves?, why it's worth a video) and the suggested next command (`/batch N`, or `/captures` if most need the human).
