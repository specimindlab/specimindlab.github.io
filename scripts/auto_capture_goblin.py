#!/usr/bin/env python3
"""Auto-capture for Goblin Tools' Magic ToDo (goblin.tools/ToDo): no account, no login.

    python3 scripts/auto_capture_goblin.py "<task>" <out dir> [spiciness ...]

One attempt per spiciness level, each in a fresh browser (no history). For every run: a screen
recording made of screenshots (5 per second, 2x pixel density) from typing the task to the finished
breakdown, the final screenshot, the steps as text, and the seconds from clicking "Break down" to
the last step appearing. Never retries.
"""
import json
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"


def run(p, task, spice, out):
    b = p.chromium.launch(executable_path=CHROME)
    ctx = b.new_context(viewport={"width": 540, "height": 760}, device_scale_factor=2)
    pg = ctx.new_page()
    frames = out / f"spice{spice}-frames"
    frames.mkdir(parents=True, exist_ok=True)
    n = [0]

    def shot():
        pg.screenshot(path=str(frames / f"{n[0]:04d}.png"))
        n[0] += 1

    pg.goto("https://goblin.tools/ToDo", wait_until="networkidle", timeout=60000)
    # close the accounts banner so the list is visible (it is a dismiss button on the page)
    if pg.locator(".gt-pro-banner-close").first.is_visible():
        pg.locator(".gt-pro-banner-close").first.click()
    pg.evaluate("""s => { const r = document.getElementById('spiciness'); r.value = s;
                    r.dispatchEvent(new Event('input', {bubbles: true}));
                    r.dispatchEvent(new Event('change', {bubbles: true})); }""", spice)
    shot()
    pg.click("#new-item")
    for ch in task:
        pg.keyboard.type(ch)
        if n[0] % 1 == 0:
            shot()
    pg.click("#add-item")
    pg.wait_for_timeout(400)
    shot()
    items0 = pg.locator("li.list-group-item").count()
    btn = pg.locator("li.list-group-item button[aria-label='break down this item']").first
    t0 = time.time()
    btn.click()
    done_at, last_count, stable_since = None, items0, None
    while time.time() - t0 < 120:
        shot()
        c = pg.locator("li.list-group-item").count()
        loading = pg.locator("#loadingCancelBtn").is_visible()
        if c != last_count:
            last_count, stable_since = c, time.time()
        if c > items0 and not loading and stable_since and time.time() - stable_since > 1.5:
            done_at = stable_since
            break
        time.sleep(0.12)
    for _ in range(10):  # hold on the result for 2 s
        shot()
        time.sleep(0.15)
    pg.screenshot(path=str(out / f"spice{spice}-result.png"), full_page=True)
    steps = [t.strip() for t in pg.locator("li.list-group-item .todoText").all_inner_texts()]
    b.close()
    secs = round(done_at - t0, 1) if done_at else None
    return {"spiciness": spice, "seconds_to_result": secs, "items": steps, "steps": len(steps) - 1,
            "frames": n[0], "attempts": 1}


def main():
    task, out = sys.argv[1], Path(sys.argv[2])
    spices = [int(s) for s in sys.argv[3:]] or [3]
    out.mkdir(parents=True, exist_ok=True)
    rec = {"tool": "Goblin Tools Magic ToDo", "url": "https://goblin.tools/ToDo", "task": task, "account": "none",
           "started_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "runs": []}
    with sync_playwright() as p:
        for s in spices:
            r = run(p, task, s, out)
            rec["runs"].append(r)
            print(json.dumps(r, indent=1))
    (out / "runs.json").write_text(json.dumps(rec, indent=2) + "\n")


if __name__ == "__main__":
    main()
