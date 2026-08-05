#!/usr/bin/env python3
"""Hit priority live URLs; exit 1 if any non-200."""
from __future__ import annotations
import sys
import urllib.error
import urllib.request

BASE = "https://antidetect-automation.github.io"
PATHS = [
    "/",
    "/pricing/",
    "/deal/",
    "/faq/",
    "/guides/mlx-api/",
    "/guides/playwright-mlx/",
    "/use-cases/facebook-ads/",
    "/vs/adspower/",
    "/errors/cdp-attach/",
    "/sitemap.xml",
    "/llms.txt",
    "/feed.xml",
]
BOT = "https://aa-telegram-bot.antidetect-automation.workers.dev/health"


def code(url: str) -> int:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "aff-saas-health-check/1.0 (+https://antidetect-automation.github.io)"},
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return 0


def main() -> int:
    bad = []
    for path in PATHS:
        url = BASE + path
        c = code(url)
        print(c, url)
        if c != 200:
            bad.append(url)
    c = code(BOT)
    print(c, BOT)
    if c != 200:
        bad.append(BOT)
    print("failures", len(bad))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
