#!/usr/bin/env python3
"""Auto-capture for LightOn's official LightOnOCR-3 demo (huggingface.co/spaces/lightonai/LightOnOCR-3-Demo).

    python3 scripts/auto_capture_lightonocr.py <image> <out dir>

No account. Default settings (LightOnOCR-3-4B, Grounding mode, 2048 px). One attempt: upload, click
Run OCR, wait for the result. Screenshots 4 per second become the recording; saves the transcription
(Document view text), the final screenshot and the seconds from Run to the result.
"""
import json
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
URL = "https://lightonai-lightonocr-3-demo.hf.space/"


def main():
    image, out = sys.argv[1], Path(sys.argv[2])
    frames = out / "frames"
    frames.mkdir(parents=True, exist_ok=True)
    rec = {"tool": "LightOnOCR-3 demo", "url": URL, "account": "none", "attempts": 1, "input": image,
           "settings": "defaults: LightOnOCR-3-4B, Grounding, T 0.2, 6,144 tokens, 2048 px",
           "started_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    n = [0]
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROME)
        ctx = b.new_context(viewport={"width": 1280, "height": 1000}, device_scale_factor=2)
        pg = ctx.new_page()

        def shot():
            pg.screenshot(path=str(frames / f"{n[0]:04d}.png"))
            n[0] += 1

        pg.goto(URL, wait_until="networkidle", timeout=120000)
        pg.wait_for_timeout(3000)
        shot()
        pg.set_input_files("input[data-role=file]", image)
        pg.wait_for_timeout(2500)
        shot()
        run = pg.locator("button.run")
        t0 = time.time()
        run.click()
        done = None
        while time.time() - t0 < 600:
            shot()
            ready = pg.locator("button[data-view=doc]").is_enabled() and not pg.locator("button.stop").is_visible()
            if ready:
                done = time.time()
                break
            time.sleep(0.2)
        rec["seconds_to_result"] = round(done - t0, 1) if done else None
        (out / "run.json").write_text(json.dumps(rec, indent=2) + "\n")  # saved before any optional step
        for _ in range(8):
            shot(); time.sleep(0.25)
        pg.screenshot(path=str(out / "result-blocks.png"))
        pg.locator("button[data-view=doc]").evaluate("e => e.click()")  # the Space header can cover the tabs
        pg.wait_for_timeout(800)
        pg.screenshot(path=str(out / "result-document.png"))
        rec["page_text_after"] = pg.locator("body").inner_text()[:6000]
        pg.locator("button[data-view=raw]").evaluate("e => e.click()")
        pg.wait_for_timeout(800)
        pg.screenshot(path=str(out / "result-raw.png"))
        rec["raw_view_text"] = pg.locator("body").inner_text()[:8000]
        b.close()
    rec["frames"] = n[0]
    (out / "run.json").write_text(json.dumps(rec, indent=2) + "\n")
    print("seconds_to_result", rec["seconds_to_result"], "frames", n[0])


if __name__ == "__main__":
    main()
