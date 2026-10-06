#!/usr/bin/env bash
# SessionStart hook for Claude Code on the web (see .claude/settings.json).
# Idempotent and fast when everything is already in place. Never fails the session:
# every step prints a warning instead, and the script always exits 0.

[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$ROOT" || exit 0
warn() { echo "cloud_setup: WARNING: $*" >&2; }
note() { echo "cloud_setup: $*"; }

# 1. Node dependencies for the Remotion project
if [ ! -d video/node_modules ]; then
  note "npm ci in video/"
  (cd video && npm ci --no-audit --no-fund --loglevel=error) || warn "npm ci failed in video/"
else
  note "video/node_modules present"
fi

# 2. Python packages (pinned in requirements.txt)
if python3 -c "import numpy, scipy, openpyxl, gradio_client" 2>/dev/null; then
  note "python packages present"
else
  note "pip install -r requirements.txt"
  python3 -m pip install -q -r requirements.txt 2>/dev/null \
    || python3 -m pip install -q --user -r requirements.txt 2>/dev/null \
    || python3 -m pip install -q --break-system-packages -r requirements.txt \
    || warn "pip install failed"
fi

# 3. ffmpeg / ffprobe (system package first, Remotion's bundled binary as fallback)
if command -v ffmpeg >/dev/null 2>&1 && command -v ffprobe >/dev/null 2>&1; then
  note "ffmpeg present"
else
  SUDO=""; [ "$(id -u)" = "0" ] || SUDO="sudo"
  if ! { $SUDO apt-get update -qq && $SUDO apt-get install -y -qq ffmpeg >/dev/null; }; then
    warn "apt-get install ffmpeg failed; using Remotion's bundled ffmpeg"
    if (cd video && npx --no-install remotion ffmpeg -version >/dev/null 2>&1); then
      mkdir -p "$HOME/.local/bin"
      for bin in ffmpeg ffprobe; do
        printf '#!/usr/bin/env bash\ncd "%s/video" && exec npx --no-install remotion %s "$@"\n' "$ROOT" "$bin" > "$HOME/.local/bin/$bin"
        chmod +x "$HOME/.local/bin/$bin"
      done
      note "shims for ffmpeg/ffprobe in ~/.local/bin (add it to PATH if needed)"
    else
      warn "no ffmpeg available"
    fi
  fi
fi

# 4. Headless browser for Remotion stills and renders
if [ -d video/node_modules ]; then
  (cd video && npx --no-install remotion browser ensure >/dev/null 2>&1) \
    && note "remotion browser ready" || warn "remotion browser ensure failed (dispatch preview.yml for stills)"
fi

exit 0
