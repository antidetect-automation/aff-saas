#!/usr/bin/env python3
"""Quick quality gate: internal hrefs resolve; priority pages exist."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "site"
PRIORITY = [
    "index.html",
    "pricing/index.html",
    "deal/index.html",
    "faq/index.html",
    "guides/mlx-api/index.html",
    "guides/playwright-mlx/index.html",
    "use-cases/facebook-ads/index.html",
    "vs/adspower/index.html",
    "sitemap.xml",
    "llms.txt",
]


def exists_for_href(href: str) -> bool:
    href = href.split("#")[0].split("?")[0]
    if not href.startswith("/"):
        return True
    rel = href.lstrip("/")
    cands = [
        ROOT / rel,
        ROOT / rel / "index.html",
        ROOT / f"{rel}.html",
    ]
    if href.endswith("/"):
        cands = [ROOT / rel / "index.html", ROOT / rel.rstrip("/") / "index.html"]
    return any(c.exists() for c in cands)


def main() -> int:
    missing_priority = [p for p in PRIORITY if not (ROOT / p).exists()]
    hrefs = set()
    for f in ROOT.rglob("*.html"):
        for h in re.findall(r'href="(/[^"]+)"', f.read_text(errors="ignore")):
            if h.startswith("//"):
                continue
            hrefs.add(h)
    broken = sorted(h for h in hrefs if not exists_for_href(h))
    print("priority_missing", missing_priority)
    print("internal_hrefs", len(hrefs))
    print("broken", broken[:40], "count", len(broken))
    return 1 if missing_priority or broken else 0


if __name__ == "__main__":
    sys.exit(main())
