# Episodes

One folder per episode: `E###-<slug>/`. Create a folder with `python3 scripts/new_episode.py E001` (or `--next 10`).

| File | Written by |
| --- | --- |
| `brief.json` | `scripts/new_episode.py` (the calendar row) |
| `README.md` | `scripts/new_episode.py`, refined by Playbook R (the capture checklist) |
| `raw/` | **The human** uploads recordings and downloads here through github.com. Auto-captures go to `raw/auto/` |
| `raw/input/` | The exact input for the test (photo, sketch, prompt text) |
| `research.md`, `facts.json` | Playbook R |
| `script.json`, `cover.png`, `<id>.srt`, `qa/` | Playbook V |
| `meta/youtube.md`, `meta/instagram.md`, `meta/x.md` | Playbook P |
| `render/` | render.yml only; never committed |

Catalog numbers (`code`) are permanent. Never renumber, never reuse.
