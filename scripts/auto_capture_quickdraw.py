#!/usr/bin/env python3
"""Auto-capture for Quick Draw in Liquid AI's System One Arcade (d1-3B), no account, no camera.

    python3 scripts/auto_capture_quickdraw.py <out dir>

One round (the game's own format: 6 random words of 16, 20 seconds each). For each word we draw
our prepared line drawing (scripts/quickdraw_strokes.py) stroke by stroke with the mouse, at about
human speed, and stop drawing as soon as the game says it guessed. Screenshots 5 per second become
the recording; the game's own log gives the result and seconds per word. Never retries.
"""
import json
import re
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
from quickdraw_strokes import DRAWINGS  # noqa: E402

CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
URL = "https://liquidai-system-one-arcade.hf.space/"


def main():
    out = Path(sys.argv[1])
    frames = out / "frames"
    frames.mkdir(parents=True, exist_ok=True)
    rec = {"tool": "Liquid AI System One Arcade · Quick Draw (d1-3B)", "url": URL, "account": "none", "attempts": 1,
           "started_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "words": [], "events": []}
    n = [0]
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROME)
        ctx = b.new_context(viewport={"width": 760, "height": 1100}, device_scale_factor=2)
        pg = ctx.new_page()

        def shot():
            pg.screenshot(path=str(frames / f"{n[0]:04d}.png"))
            n[0] += 1

        def status():
            return pg.locator("body").inner_text()

        pg.goto(URL, wait_until="networkidle", timeout=90000)
        pg.get_by_text("Quick Draw", exact=True).first.click()
        pg.wait_for_timeout(2500)
        shot()
        box = pg.locator("canvas.surface").bounding_box()
        X = lambda x: box["x"] + box["width"] * (0.06 + 0.88 * x)
        Y = lambda y: box["y"] + box["height"] * (0.06 + 0.88 * y)
        pg.get_by_text("Start a round").click()
        t_round = time.time()
        last_word = None
        while time.time() - t_round < 200:
            txt = status()
            m = re.search(r"Draw (?:an? )?([a-z]+)\n", txt)
            word = m.group(1) if m else None
            if word and word != last_word and word in DRAWINGS:
                last_word = word
                t0 = time.time()
                rec["events"].append({"t": round(t0 - t_round, 2), "event": f"word {word}"})
                got = False
                for stroke in DRAWINGS[word]:
                    pg.mouse.move(X(stroke[0][0]), Y(stroke[0][1]))
                    pg.mouse.down()
                    for i, (x, y) in enumerate(stroke[1:]):
                        pg.mouse.move(X(x), Y(y), steps=2)
                        pg.wait_for_timeout(12)
                        if i % 6 == 0 and n[0] < 4000:
                            shot()
                    pg.mouse.up()
                    pg.wait_for_timeout(350)
                    shot()
                    if "Got it" in status() or "It was" in status():
                        got = True
                        break
                # wait for the game to settle this word (guessed, or the 20 s run out)
                while time.time() - t0 < 22 and not re.search(r"Got it|It was", status()):
                    pg.wait_for_timeout(200)
                    shot()
                s = status()
                res = re.search(r"(Got it: [^\n]+|It was [^\n]+)", s)
                rec["words"].append({"word": word, "result": res.group(1) if res else "?",
                                     "strokes_drawn": len(DRAWINGS[word]), "wall_seconds": round(time.time() - t0, 2)})
                for _ in range(5):
                    shot(); pg.wait_for_timeout(200)
            if re.search(r"\d / 6 guessed", txt):
                break
            pg.wait_for_timeout(150)
        for _ in range(10):
            shot(); pg.wait_for_timeout(200)
        final = status()
        rec["final_text"] = final[:1500]
        pg.screenshot(path=str(out / "final.png"))
        log = re.findall(r"(\d)\. ([a-z]+)\n(\d+\.\d s|missed)", final)
        rec["game_log"] = [{"n": int(a), "word": w, "result": r} for a, w, r in log]
        m = re.search(r"(\d) / 6 guessed(?:, ([\d.]+) s each)?", final)
        rec["summary"] = m.group(0) if m else None
        b.close()
    rec["frames"] = n[0]
    (out / "run.json").write_text(json.dumps(rec, indent=2) + "\n")
    print(json.dumps({k: v for k, v in rec.items() if k not in ("final_text", "events")}, indent=1))


if __name__ == "__main__":
    main()
