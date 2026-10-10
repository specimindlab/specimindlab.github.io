#!/usr/bin/env python3
"""Auto-capture for the official Wan text-to-video demo (huggingface.co/spaces/Wan-AI/Wan2.1): anonymous.

    python3 scripts/auto_capture_wan_t2v.py "<prompt>" <out dir> [size]

One attempt. Submits the prompt, then polls the Space's own status endpoint until the video is
ready; records the queue estimate the Space reports, its own "cost" seconds, and our wall clock.
"""
import json
import os
import shutil
import sys
import time
from pathlib import Path

from gradio_client import Client


def main():
    prompt, out = sys.argv[1], Path(sys.argv[2])
    size = sys.argv[3] if len(sys.argv) > 3 else "720*1280"
    os.environ.pop("HF_TOKEN", None)
    out.mkdir(parents=True, exist_ok=True)
    rec = {"space": "Wan-AI/Wan2.1", "mode": "text-to-video", "prompt": prompt, "size": size, "watermark_wan": False,
           "attempts": 1, "account": "none", "started_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "polls": []}
    c = Client("Wan-AI/Wan2.1", verbose=False)
    t0 = time.time()
    first = c.predict(prompt, size, False, -1, api_name="/t2v_generation_async")
    rec["submit_reply"] = first
    video = None
    while time.time() - t0 < 1800:
        time.sleep(5)
        r = c.predict(api_name="/status_refresh")
        vid, cost, wait, prog = r
        rec["polls"].append({"t": round(time.time() - t0, 1), "cost": cost, "wait": wait, "progress": prog})
        path = vid.get("video") if isinstance(vid, dict) else vid
        if path:
            video = path
            break
    rec["wall_seconds"] = round(time.time() - t0, 1)
    if video:
        shutil.copy(video, out / "wan-t2v.mp4")
        rec["output"] = "wan-t2v.mp4"
    else:
        rec["error"] = "no video within 30 minutes"
    (out / "run.json").write_text(json.dumps(rec, indent=2) + "\n")
    print(json.dumps({k: v for k, v in rec.items() if k != "polls"}, indent=1), len(rec["polls"]), "polls; last", rec["polls"][-1:] )


if __name__ == "__main__":
    main()
