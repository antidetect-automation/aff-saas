#!/usr/bin/env python3
"""Ping IndexNow for priority hub URLs (Bing / partners)."""
from __future__ import annotations

import json
import pathlib
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
KEY = (ROOT / "site" / "indexnow-key.txt").read_text().strip()
HOST = "antidetect-automation.github.io"
BASE = f"https://{HOST}"

URLS = [
    f"{BASE}/",
    f"{BASE}/pricing/",
    f"{BASE}/deal/",
    f"{BASE}/faq/",
    f"{BASE}/start/",
    f"{BASE}/about/",
    f"{BASE}/privacy/",
    f"{BASE}/glossary/",
    f"{BASE}/guides/",
    f"{BASE}/guides/mlx-api/",
    f"{BASE}/guides/playwright-mlx/",
    f"{BASE}/guides/postman-mlx/",
    f"{BASE}/guides/puppeteer-mlx/",
    f"{BASE}/guides/selenium-mlx/",
    f"{BASE}/guides/api-auth-mlx/",
    f"{BASE}/guides/mlx-proxy/",
    f"{BASE}/guides/profile-warmup/",
    f"{BASE}/guides/cookies-sessions/",
    f"{BASE}/use-cases/",
    f"{BASE}/use-cases/ads-multi-account/",
    f"{BASE}/use-cases/facebook-ads/",
    f"{BASE}/use-cases/google-ads/",
    f"{BASE}/use-cases/affiliate/",
    f"{BASE}/use-cases/cloud-phone/",
    f"{BASE}/use-cases/social-multi-account/",
    f"{BASE}/use-cases/scraping-isolation/",
    f"{BASE}/use-cases/ecommerce-warmup/",
    f"{BASE}/vs/",
    f"{BASE}/vs/adspower/",
    f"{BASE}/vs/gologin/",
    f"{BASE}/vs/dolphin-anty/",
    f"{BASE}/vs/octo-browser/",
    f"{BASE}/vs/undetectable/",
    f"{BASE}/vs/bitbrowser/",
    f"{BASE}/errors/",
    f"{BASE}/errors/cdp-attach/",
    f"{BASE}/errors/token-auth/",
    f"{BASE}/errors/proxy-mlx/",
    f"{BASE}/errors/mlx-automation/",
    f"{BASE}/tools/",
    f"{BASE}/digest/",
    f"{BASE}/sitemap.xml",
    f"{BASE}/llms.txt",
    f"{BASE}/feed.xml",
]


def main() -> None:
    payload = {
        "host": HOST,
        "key": KEY,
        "keyLocation": f"{BASE}/{KEY}.txt",
        "urlList": URLS,
    }
    req = urllib.request.Request(
        "https://api.indexnow.org/indexnow",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        print("indexnow", resp.status, len(URLS), "urls")


if __name__ == "__main__":
    main()
