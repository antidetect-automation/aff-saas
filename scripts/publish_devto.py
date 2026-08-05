#!/usr/bin/env python3
"""Publish queued Dev.to articles with rate-limit-safe delays.

Dev.to returned 429 with ~300s cooldown after bursts.
Default gap: 330s between successful posts; on 429 wait Retry-After or 320s.
"""
from __future__ import annotations

import json
import pathlib
import sys
import time
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
KEY_FILE = ROOT / ".secrets" / "devto.env"
RESULTS = ROOT / "content" / "published" / "RESULTS.json"
GAP_SEC = 330  # ~5.5 min — safer than the observed 300s cooldown
RETRY_429 = 320

QUEUE = [
    {
        "file": "deal-saas50.md",
        "title": "Multilogin coupon codes SAAS50 and MIN50 (2026)",
        "canonical_url": "https://antidetect-automation.github.io/deal/",
        "tags": ["multilogin", "coupon", "antidetect", "saas"],
        "series": "Multilogin ops",
    },
    {
        "file": "tools.md",
        "title": "Free client-side tools for antidetect and Multilogin ops",
        "canonical_url": "https://antidetect-automation.github.io/tools/",
        "tags": ["multilogin", "antidetect", "webgl", "proxy"],
        "series": "Multilogin ops",
    },
    {
        "file": "vs-gologin.md",
        "title": "Multilogin vs GoLogin in 2026: when to graduate",
        "canonical_url": "https://antidetect-automation.github.io/vs/gologin/",
        "tags": ["multilogin", "gologin", "antidetect", "automation"],
        "series": "Multilogin ops",
    },
    {
        "file": "vs-dolphin.md",
        "title": "Multilogin vs Dolphin Anty (2026): media-buying SOPs vs scripts",
        "canonical_url": "https://antidetect-automation.github.io/vs/dolphin-anty/",
        "tags": ["multilogin", "dolphin", "antidetect", "marketing"],
        "series": "Multilogin ops",
    },
    {
        "file": "vs-octo.md",
        "title": "Multilogin vs Octo Browser: social SOPs vs automation spine",
        "canonical_url": "https://antidetect-automation.github.io/vs/octo-browser/",
        "tags": ["multilogin", "octo", "antidetect", "automation"],
        "series": "Multilogin ops",
    },
]


def load_key() -> str:
    if not KEY_FILE.exists():
        sys.exit(f"Missing {KEY_FILE} — put DEVTO_API_KEY=... there")
    raw = KEY_FILE.read_text().strip()
    key = raw.split("=", 1)[-1].strip()
    if len(key) < 10:
        sys.exit("API key looks empty")
    return key


def already_published(title: str, results: list) -> bool:
    return any(r.get("ok") and r.get("title") == title for r in results)


def post(key: str, article: dict) -> dict:
    body = (ROOT / "content" / "published" / article["file"]).read_text()
    payload = {
        "article": {
            "title": article["title"],
            "published": True,
            "body_markdown": body,
            "tags": article["tags"][:4],
            "canonical_url": article["canonical_url"],
            "series": article["series"],
        }
    }
    req = urllib.request.Request(
        "https://dev.to/api/articles",
        data=json.dumps(payload).encode(),
        headers={
            "Content-Type": "application/json",
            "api-key": key,
            "Accept": "application/json",
            "User-Agent": "antidetect-automation-publisher/1.1",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=90) as resp:
        return json.load(resp)


def main() -> None:
    key = load_key()
    # auth check
    me_req = urllib.request.Request(
        "https://dev.to/api/users/me",
        headers={"api-key": key, "User-Agent": "antidetect-automation-publisher/1.1"},
    )
    try:
        with urllib.request.urlopen(me_req, timeout=30) as resp:
            me = json.load(resp)
            print(f"auth ok @{me.get('username')} id={me.get('id')}")
    except urllib.error.HTTPError as e:
        sys.exit(f"auth failed {e.code}: {e.read().decode()[:200]}")

    results = json.loads(RESULTS.read_text()) if RESULTS.exists() else []
    first = True
    for art in QUEUE:
        if already_published(art["title"], results):
            print(f"skip (done): {art['title']}")
            continue
        if not first:
            print(f"sleep {GAP_SEC}s before next post…")
            time.sleep(GAP_SEC)
        first = False
        for attempt in range(1, 4):
            try:
                data = post(key, art)
                row = {
                    "ok": True,
                    "title": art["title"],
                    "url": data.get("url"),
                    "id": data.get("id"),
                }
                results.append(row)
                RESULTS.write_text(json.dumps(results, indent=2) + "\n")
                print("OK", data.get("url"))
                break
            except urllib.error.HTTPError as e:
                err = e.read().decode()
                print(f"FAIL attempt {attempt} {e.code} {err[:240]}")
                if e.code == 429:
                    wait = RETRY_429 * attempt
                    print(f"rate limited — sleep {wait}s")
                    time.sleep(wait)
                    continue
                if e.code == 401:
                    sys.exit("API key unauthorized — refresh .secrets/devto.env")
                results.append(
                    {"ok": False, "title": art["title"], "status": e.code, "err": err[:400]}
                )
                RESULTS.write_text(json.dumps(results, indent=2) + "\n")
                break
    print("queue finished")


if __name__ == "__main__":
    main()
