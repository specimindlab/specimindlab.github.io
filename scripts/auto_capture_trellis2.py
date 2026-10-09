#!/usr/bin/env python3
"""Playbook I auto-capture for TRELLIS.2: one anonymous run of the official Space's own UI chain.

    python3 scripts/auto_capture_trellis2.py <input image> <out dir>

The Space's UI does three things, and this script calls the same endpoints in the same session,
with the Space's default settings, exactly once each (one attempt is the Specimen Code):
    upload   -> /preprocess_image   (background removal on the Space, via BRIA RMBG 2.0)
    Generate -> /get_seed (randomize on) -> /image_to_3d   (returns an HTML preview: 6 render modes x 8 views)
    Extract GLB -> /extract_glb      (decimation 300000, texture 2048: the UI defaults)
Wall-clock and queue seconds for every step go to <out dir>/<stem>.run.json; the preview views are
decoded to <out dir>/views/<mode>-<view>.jpg; the GLB (if the Space allows it) is copied next to it.
No login, no token, no retries: refusals (quota) are recorded verbatim as results.
"""
import base64
import json
import os
import re
import shutil
import sys
import time
from pathlib import Path

os.environ.pop("HF_TOKEN", None)  # anonymous, always
from gradio_client import Client, handle_file  # noqa: E402

SPACE = "microsoft/TRELLIS.2"
MODES = ["normal", "clay", "base_color", "hdri_forest", "hdri_sunset", "hdri_courtyard"]


def run(client, rec, name, **kw):
    t0 = time.time()
    job = client.submit(**kw)
    queued_until, log = None, []
    while not job.done():
        st = job.status()
        code = str(getattr(st, "code", ""))
        if not log or log[-1]["code"] != code:
            log.append({"t": round(time.time() - t0, 2), "code": code, "rank": getattr(st, "rank", None)})
        if queued_until is None and "PROCESSING" in code:
            queued_until = time.time() - t0
        time.sleep(0.25)
    total = time.time() - t0
    step = {"step": name, "api_name": kw.get("api_name"), "wall_seconds": round(total, 1),
            "queue_seconds": round(queued_until, 1) if queued_until is not None else None,
            "seconds_excl_queue": round(total - (queued_until or 0), 1), "status_log": log,
            "started_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(t0))}
    try:
        step["result"] = job.result()
        step["ok"] = True
    except Exception as e:  # a refusal is a result too
        step["ok"] = False
        step["error"] = f"{type(e).__name__}: {e}"
    rec["steps"].append(step)
    print(json.dumps({k: step.get(k) for k in ("step", "ok", "wall_seconds", "queue_seconds", "error")}), flush=True)
    return step


def main() -> int:
    image, out = Path(sys.argv[1]), Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    rec = {"space": SPACE, "input": str(image), "attempts": 1, "settings": "Space defaults (resolution 1024, "
           "12/12/12 steps, randomize seed; GLB decimation 300000, texture 2048)", "steps": []}
    client = Client(SPACE, verbose=False)

    pre = run(client, rec, "upload (background removal)", input=handle_file(str(image)), api_name="/preprocess_image")
    if not pre["ok"]:
        return finish(rec, out, image)
    pre_path = pre.pop("result")
    pre_path = pre_path.get("path") if isinstance(pre_path, dict) else pre_path
    shutil.copy2(pre_path, out / f"{image.stem}-preprocessed.png")

    seed = run(client, rec, "seed", randomize_seed=True, seed=0, api_name="/get_seed")
    seed_val = int(seed.pop("result"))
    rec["seed"] = seed_val

    gen = run(client, rec, "generate", image=handle_file(str(out / f"{image.stem}-preprocessed.png")),
              seed=seed_val, resolution="1024", api_name="/image_to_3d")
    if gen["ok"]:
        html = gen.pop("result")
        (out / f"{image.stem}-preview.html").write_text(html if isinstance(html, str) else json.dumps(html))
        views = out / "views"
        views.mkdir(exist_ok=True)
        n = 0
        for m, s, b64 in re.findall(r'id="view-m(\d)-s(\d)"[^>]*?src="data:image/jpeg;base64,([^"]+)"', html, re.S):
            (views / f"{MODES[int(m)]}-{s}.jpg").write_bytes(base64.b64decode(b64))
            n += 1
        gen["preview_views"] = n

        ext = run(client, rec, "extract GLB", decimation_target=300000, texture_size=2048, api_name="/extract_glb")
        if ext["ok"]:
            res = ext.pop("result")
            path = res[0] if isinstance(res, (list, tuple)) else res
            path = path.get("path") if isinstance(path, dict) else path
            dest = out / f"{image.stem}.glb"
            shutil.copy2(path, dest)
            ext["file"] = str(dest)
    return finish(rec, out, image)


def finish(rec, out, image):
    for st in rec["steps"]:
        st.pop("result", None)
    rec["finished_utc"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    (out / f"{image.stem}.run.json").write_text(json.dumps(rec, indent=2, ensure_ascii=False) + "\n")
    return 0 if all(s["ok"] for s in rec["steps"]) else 1


if __name__ == "__main__":
    sys.exit(main())
