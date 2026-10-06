# Environment check

Run on **2026-10-06** in a Claude Code on the web session (prompt S1, step 0). Re-run it if the cloud environment's network setting changes.

## Versions

| Tool | Result |
| --- | --- |
| `node -v` | v22.22.0 |
| `npm -v` | 10.9.4 |
| `python3 --version` | Python 3.13.16 |
| `gh --version` | gh version 2.89.0 (2026-03-26) |
| `ffmpeg -version` | ffmpeg 6.1.1-3ubuntu5 (preinstalled; the S1 setup hook would apt-get it if missing) |
| `echo $CLAUDE_CODE_REMOTE` | `true` |
| OS | Ubuntu 24.04.5 LTS |
| Chromium | Playwright Chromium preinstalled at `/opt/pw-browsers` (chromium-1194); Remotion's own headless shell downloads fine (`npx remotion browser ensure`) |

## Reachability (`curl -sI -m 5`)

Any HTTP status means the host was reached. A blocked host gives a proxy error or a timeout, not a status code.

| Host | HTTP | Reachable | Note |
| --- | --- | --- | --- |
| registry.npmjs.org | 200 | yes | |
| pypi.org | 200 | yes | |
| raw.githubusercontent.com | 301 | yes | `google/fonts/main/ofl/anybody/OFL.txt` downloaded |
| fonts.gstatic.com | 404 | yes | 404 on the bare root is normal |
| storage.googleapis.com | 400 | yes | 400 on the bare root is normal (bucket name missing) |
| huggingface.co | 200 | yes | `/api/spaces` answers |
| *.hf.space | 200 | yes | tested on `black-forest-labs-flux-1-schnell.hf.space` |
| cdn.playwright.dev | 400 | yes | 400 on the bare root is normal |
| www.tripo3d.ai | 403 | yes, but bot-walled | Cloudflare "Just a moment…" challenge: curl and WebFetch cannot read it |
| archive.ubuntu.com | 200 | yes | apt works |
| api.github.com (via `gh api`) | 200 | partly | Through this session's GitHub proxy, `gh api repos/specimindlab/specimindlab.github.io/...` works for runs, jobs, check-runs, annotations and releases. `.../pages` and `.../actions/permissions` are refused (403), and other repositories are refused unless added to the session |
| github.com (other repos, git) | ok | yes | `git ls-remote` works for public repos |

## Agent tools

| Tool | Result |
| --- | --- |
| WebSearch | **works** ("Tripo AI 3D generator free tier credits pricing 2026" returned 9 results) |
| WebFetch on https://www.tripo3d.ai | **fails**: HTTP 403 from Tripo's Cloudflare bot check, not from our network. Research on that site goes through WebSearch, the tool's docs or API pages, and third-party pages, each listed with URL + date |

## What works

| Feature | Status | Notes |
| --- | --- | --- |
| Research (search + fetch) | **works** | Some vendor sites behind Cloudflare challenges (e.g. tripo3d.ai) cannot be fetched by any setting; use WebSearch, their docs or API subdomains, and note it in research.md |
| Auto-capture of open-source demos | **works** | huggingface.co and *.hf.space are reachable; `gradio_client` is installed by the setup hook. Playwright Chromium is available for recording a Space's interface |
| Preview stills in this VM | **works** | `npx remotion still` renders 1080×1920 stills with the Anybody variable font in about 5 s each; `scripts/smoke_test.sh` renders a full 34 s MP4 and verifies it here too |
| Final renders + Releases | GitHub Actions | `render.yml`; tag pushes are blocked from this VM, so Releases are always created inside Actions |

No network setting needs changing for this environment. If a future session's check shows huggingface.co or *.hf.space blocked, the one setting that unlocks it is: claude.ai/code → environment selector → Default → settings → **Network access: Full**.
