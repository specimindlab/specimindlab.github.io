#!/usr/bin/env python3
"""Auto-capture for Hookest's free YouTube Shorts hook generator (hookest.com, "No signup").

    python3 scripts/auto_capture_hookest.py "<topic>" <out dir> [count]

One attempt with the page's default style (Curiosity) and tone (Casual), English, `count` hooks
(default 5). Screenshots 4 per second become the recording; saves the hooks as text, the result
screenshot and the seconds from clicking Generate to the hooks appearing. run.json is written the
moment the result appears.
"""
import json
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
URL = "https://hookest.com/free-youtube-shorts-hook-generator"


def main():
    topic, out = sys.argv[1], Path(sys.argv[2])
    count = sys.argv[3] if len(sys.argv) > 3 else "5"
    frames = out / "frames"
    frames.mkdir(parents=True, exist_ok=True)
    rec = {"tool": "Hookest free YouTube Shorts hook generator", "url": URL, "account": "none", "attempts": 1,
           "topic": topic, "settings": f"style Curiosity (default), tone Casual (default), English, {count} hooks",
           "started_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    n = [0]
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROME)
        ctx = b.new_context(viewport={"width": 600, "height": 1000}, device_scale_factor=2)
        pg = ctx.new_page()

        def shot():
            pg.screenshot(path=str(frames / f"{n[0]:04d}.png"))
            n[0] += 1

        pg.goto(URL, wait_until="networkidle", timeout=90000)
        pg.wait_for_timeout(1500)
        pg.locator("#hookgen-topic").scroll_into_view_if_needed()
        shot()
        before = pg.locator("body").inner_text()
        pg.locator("#hookgen-topic").click()
        for i, ch in enumerate(topic):
            pg.keyboard.type(ch)
            if i % 6 == 0:
                shot()
        pg.get_by_text("Tone, language", exact=False).first.click()  # the count menu sits in this collapsed panel
        pg.wait_for_timeout(400)
        sel = pg.locator("select").nth(2)
        sel.select_option(count)
        shot()
        btn = pg.locator("button.hg-submit")
        t0 = time.time()
        btn.click()
        done = None
        while time.time() - t0 < 120:
            shot()
            txt = pg.locator("body").inner_text()
            busy = not btn.is_enabled()
            if not busy and txt != before and "Tap a hook to copy it" in txt and time.time() - t0 > 1:
                done = time.time()
                break
            time.sleep(0.2)
        rec["seconds_to_result"] = round(done - t0, 1) if done else None
        rec["page_text"] = pg.locator("body").inner_text()[:6000]
        (out / "run.json").write_text(json.dumps(rec, indent=2) + "\n")
        for _ in range(8):
            shot(); time.sleep(0.25)
        pg.screenshot(path=str(out / "result.png"), full_page=True)
        b.close()
    rec["frames"] = n[0]
    (out / "run.json").write_text(json.dumps(rec, indent=2) + "\n")
    print("seconds", rec["seconds_to_result"], "frames", n[0])


if __name__ == "__main__":
    main()
