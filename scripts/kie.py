#!/usr/bin/env python3
"""
Generate design assets with kie.ai and keep a log of every prompt.

  python3 scripts/kie.py gen --model gpt-image-2-text-to-image --out design/assets/raw/x.png \
      --prompt "..." --input '{"resolution":"1K","background":"transparent","aspect_ratio":"1:1"}'
  python3 scripts/kie.py gen --model nano-banana-pro --ref design/assets/icon-3d-shield.png ...
  python3 scripts/kie.py balance

Reads KIE_API_KEY from the environment or from .env at the project root. The key is never printed.
Every run is appended to design/assets/prompts.jsonl so any asset can be regenerated or tweaked.
"""

import argparse
import base64
import json
import mimetypes
import subprocess
import os
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API = "https://api.kie.ai"
UPLOAD = "https://kieai.redpandaai.co"
LOG = ROOT / "design/assets/prompts.jsonl"
# Field that takes reference images, per model schema.
REF_FIELD = {"nano-banana-pro": "image_input", "gpt-image-2-image-to-image": "input_urls"}


def api_key() -> str:
    key = os.environ.get("KIE_API_KEY")
    if not key and (ROOT / ".env").exists():
        for line in (ROOT / ".env").read_text().splitlines():
            if line.startswith("KIE_API_KEY="):
                key = line.split("=", 1)[1].strip().strip("\"'")
    if not key:
        sys.exit("KIE_API_KEY is missing. Add it to .env at the project root.")
    return key


def call(method: str, url: str, body: dict | None = None) -> dict:
    req = urllib.request.Request(url, method=method, data=json.dumps(body).encode() if body else None)
    req.add_header("Authorization", f"Bearer {api_key()}")
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=120) as r:
        res = json.load(r)
    # HTTP 200 does not mean success: the real status is in the body.
    if res.get("code") != 200:
        raise RuntimeError(f"{url}: {res.get('code')} {res.get('msg')}")
    return res["data"]


def upload(path: Path) -> str:
    mime = mimetypes.guess_type(path.name)[0] or "image/png"
    data = base64.b64encode(path.read_bytes()).decode()
    res = call("POST", f"{UPLOAD}/api/file-base64-upload", {
        "base64Data": f"data:{mime};base64,{data}",
        "uploadPath": "images/dozyar",
        "fileName": path.name,
    })
    return res["downloadUrl"]


def download(url: str, dest: Path) -> None:
    # curl with a hard time limit: urllib downloads from the result host can stall forever.
    subprocess.run(["curl", "-sSfL", "--retry", "3", "--max-time", "120", "-o", str(dest), url], check=True)


def generate(model: str, prompt: str, extra: dict, refs: list[Path], deadline: int) -> list[str]:
    inp = {"prompt": prompt, **extra}
    if refs:
        inp[REF_FIELD[model]] = [upload(p) for p in refs]
    return run_task(model, inp, deadline)


def run_task(model: str, inp: dict, deadline: int) -> list[str]:
    task = call("POST", f"{API}/api/v1/jobs/createTask", {"model": model, "input": inp})["taskId"]
    print(f"task {task}", file=sys.stderr)
    end = time.time() + deadline
    while time.time() < end:
        time.sleep(3)
        info = call("GET", f"{API}/api/v1/jobs/recordInfo?taskId={task}")
        state = info.get("state")
        if state == "success":
            result = info.get("resultJson") or info.get("response") or {}
            if isinstance(result, str):
                result = json.loads(result)
            return result.get("resultUrls") or []
        if state == "fail":
            raise RuntimeError(f"task failed: {info.get('failCode')} {info.get('failMsg')}")
    raise TimeoutError(f"task {task} still running after {deadline}s")


def main() -> None:
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)
    g = sub.add_parser("gen")
    g.add_argument("--model", required=True)
    g.add_argument("--prompt", required=True)
    g.add_argument("--out", required=True, help="output path; numbered when the model returns several images")
    g.add_argument("--input", default="{}", help="extra input fields as JSON")
    g.add_argument("--ref", action="append", default=[], help="reference image (repeatable)")
    g.add_argument("--deadline", type=int, default=300)
    g.add_argument("--rmbg", action="store_true", help="also save a cut-out (*-cut.png) via recraft/remove-background")
    sub.add_parser("balance")
    a = p.parse_args()

    if a.cmd == "balance":
        print(call("GET", f"{API}/api/v1/chat/credit"))
        return

    extra = json.loads(a.input)
    refs = [ROOT / r for r in a.ref]
    urls = generate(a.model, a.prompt, extra, refs, a.deadline)
    out = ROOT / a.out
    out.parent.mkdir(parents=True, exist_ok=True)
    saved = []
    for i, url in enumerate(urls):
        dest = out if len(urls) == 1 else out.with_name(f"{out.stem}-{i + 1}{out.suffix}")
        download(url, dest)
        saved.append(str(dest.relative_to(ROOT)))
        if a.rmbg:
            cut_url = run_task("recraft/remove-background", {"image": url}, a.deadline)[0]
            cut = dest.with_name(f"{dest.stem}-cut.png")
            download(cut_url, cut)
            saved.append(str(cut.relative_to(ROOT)))
    with LOG.open("a") as f:
        f.write(json.dumps({
            "time": time.strftime("%Y-%m-%dT%H:%M:%S"), "model": a.model, "prompt": a.prompt,
            "input": extra, "refs": a.ref, "rmbg": a.rmbg, "files": saved,
        }, ensure_ascii=False) + "\n")
    print("\n".join(saved))


if __name__ == "__main__":
    main()
