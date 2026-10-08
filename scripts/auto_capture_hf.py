#!/usr/bin/env python3
"""Playbook I auto-capture: one anonymous run on a public Hugging Face Space (no login, no token).

    python3 scripts/auto_capture_hf.py <space> <api_name> <input image> <out dir> [--param k=v ...]

Records wall-clock time from submit to result, the time spent queued (from the job status
stream), the Space's own outputs and any error text, into <out dir>/<stem>.run.json, and copies
every returned file next to it. Never retries: one attempt is the Specimen Code.
"""
import json
import os
import shutil
import sys
import time
import urllib.request
from pathlib import Path

from gradio_client import Client, handle_file


def main() -> int:
    space, api, image, out = sys.argv[1:5]
    params = {}
    for a in sys.argv[5:]:
        if a.startswith("--param"):
            continue
        k, v = a.split("=", 1)
        params[k] = json.loads(v) if v[:1] in "0123456789tfn[{\"-" else v
    os.environ.pop("HF_TOKEN", None)  # anonymous, always
    out = Path(out)
    out.mkdir(parents=True, exist_ok=True)
    stem = Path(image).stem
    rec = {"space": space, "api_name": api, "input": str(image), "params": params, "attempts": 1,
           "started_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    client = Client(space, verbose=False)
    t0 = time.time()
    job = client.submit(image=handle_file(image), api_name=api, **params)
    queued_until = None
    statuses = []
    while not job.done():
        st = job.status()
        code = str(getattr(st, "code", ""))
        if not statuses or statuses[-1]["code"] != code:
            statuses.append({"t": round(time.time() - t0, 2), "code": code, "rank": getattr(st, "rank", None), "eta": getattr(st, "eta", None)})
        if queued_until is None and "PROCESSING" in code:
            queued_until = time.time() - t0
        time.sleep(0.25)
    total = time.time() - t0
    rec["status_log"] = statuses
    rec["wall_seconds"] = round(total, 1)
    rec["queue_seconds"] = round(queued_until, 1) if queued_until is not None else None
    rec["seconds_to_result_excl_queue"] = round(total - (queued_until or 0), 1)
    try:
        result = job.result()
        files = []
        for i, r in enumerate(result if isinstance(result, (list, tuple)) else [result]):
            # gr.update({...}) outputs come back as {"value": "/tmp/gradio/.../x.glb"}: the file stays
            # on the Space, served at <host>/file=<path>. Fetch it now, before the Space cleans up.
            if isinstance(r, dict) and isinstance(r.get("value"), str) and r["value"].startswith("/tmp/"):
                host = json.load(urllib.request.urlopen(f"https://huggingface.co/api/spaces/{space}/host", timeout=20))["host"]
                dest = out / f"{stem}-out{i}{Path(r['value']).suffix}"
                urllib.request.urlretrieve(f"{host}/file={r['value']}", dest)
                rec.setdefault("outputs", []).append({"index": i, "file": str(dest), "remote": r["value"]})
                continue
            if isinstance(r, str) and os.path.isfile(r):
                dest = out / f"{stem}-out{i}{Path(r).suffix}"
                shutil.copy2(r, dest)
                files.append(str(dest))
                rec.setdefault("outputs", []).append({"index": i, "file": str(dest)})
            else:
                rec.setdefault("outputs", []).append({"index": i, "value": r if not isinstance(r, str) or len(r) < 2000 else r[:2000] + "..."})
        rec["ok"] = True
    except Exception as e:  # quota, queue or app errors are results too: record them verbatim
        rec["ok"] = False
        rec["error"] = f"{type(e).__name__}: {e}"
    (out / f"{stem}.run.json").write_text(json.dumps(rec, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps({k: rec.get(k) for k in ("ok", "wall_seconds", "queue_seconds", "seconds_to_result_excl_queue", "error")}))
    return 0 if rec["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
