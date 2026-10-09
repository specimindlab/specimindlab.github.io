---
name: weekly
description: SPECIMIND weekly review. Reads the analytics the human uploaded, ranks videos and kinds of video, says what to do more and less of, and plans next week's tests. Use when the human types /weekly.
argument-hint: "[path to the analytics file in data/, default: the newest data/scorecard-*]"
disable-model-invocation: true
---

# /weekly: what worked, and next week's plan

Arguments: `$ARGUMENTS` (optional path; default: the newest `data/scorecard-*` file).

The human exports the numbers (YouTube Studio Shorts table, Instagram Insights, X analytics, affiliate dashboards: any format, CSV or XLSX) and uploads them to `data/` on github.com: `https://github.com/specimindlab/specimindlab.github.io/upload/main/data`. If there's no file, say exactly what to export and where to upload it, then stop.

1. `git pull origin main`; `python3 scripts/channel_status.py`; read `CLAUDE.md`, `data/series.md`, the calendar, and earlier `data/weekly-review-*.md` (what we said we'd try).
2. Parse what's there (csv and openpyxl are always installed; pandas if present). Per episode: views, engaged views, average % viewed, viewed vs swiped away, likes, comments (and comments containing the code on Instagram), shares, hub visits and affiliate clicks if present. Match rows to episodes by title or code; list anything you couldn't match.
3. Rank episodes and kinds of video (series). Look for causes you can see in our own files: hook pattern and first words, frame 0, length, music style, topic. Compare with last week. Don't overclaim from small numbers; say when a difference is noise.
4. Decide, using the rules in `data/series.md` (a series under half the channel median for 6 videos in a row gets fewer slots; the top topics get more): what to make more of, what to stop, and **one** experiment for next week (e.g. two hook styles on similar tests).
5. Plan next week: reorder or edit the next 14 Planned rows in `data/calendar.csv` (keep CRLF and every column; never change made rows) and, if fewer than 14 are left, run the `/scout` steps for the gap.
6. Write `data/weekly-review-<YYYY-MM-DD>.md` (numbers table, what worked, what to stop, the experiment, next week's rows) and commit and push.
7. Reply in five or six lines: the best and worst video and why we think so, the change for next week, the experiment, and the suggested `/batch N` or `/captures`.
