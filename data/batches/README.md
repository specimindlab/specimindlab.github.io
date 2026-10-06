# Batch files

One JSON file per batch, written by prompt B (step 4). **Pushing a new or changed `data/batches/<batch>.json` to `main` starts the "Render batch" workflow** (`.github/workflows/render.yml`). The workflow renders every episode for YouTube, Instagram and X, verifies each file, and publishes the GitHub Release `<batch>` with `specimind-<batch>.zip` attached and POSTING.md as the release notes.

To re-render a batch without changing it: Actions → Render batch → Run workflow → `batch` = the file name without `.json`.

## Format

```json
{
  "batch": "batch-2026-10-19",
  "created": "2026-10-12",
  "episodes": [
    {
      "id": "E001",
      "post_at": "2026-10-19 06:30 IST",
      "youtube": {
        "title": "Tripo: this mug was a phone photo 38 seconds ago",
        "description": "Full description, disclosure line first...",
        "hashtags": ["#3dmodeling", "#ai3d", "#specimindlab"],
        "related_video": "",
        "altered_content": false
      },
      "instagram": {
        "caption": "First line = keyword line...",
        "comment_code": "001",
        "auto_dm": "Here's Specimen 001: https://specimindlab.github.io/001?from=ig (affiliate link)"
      },
      "x": {
        "post": "≤ 200 characters: tool name + one opinion",
        "first_reply": "https://specimindlab.github.io/001?from=x · Affiliate link"
      }
    }
  ]
}
```

- `episodes` are in posting order. Each `id` must have a folder `episodes/<id>-<slug>/` containing `script.json`, `cover.png` and `<id>.srt`. The `meta/` folder is copied into the posting package if it exists.
- `youtube.altered_content`: true when the video shows realistic AI-generated people, places or events that a viewer could mistake for real (YouTube's "altered or synthetic content" toggle). POSTING.md prints ON or OFF.
- Two posts a day at 06:30 and 18:30 IST. Never schedule two Field sketches, or two episodes of the same series, back to back.

`scripts/fixtures/batches/batch-smoke.json` is a working example: `bash scripts/smoke_test.sh` renders it end to end without creating a Release.
