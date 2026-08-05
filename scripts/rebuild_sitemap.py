#!/usr/bin/env python3
"""Rebuild site/sitemap.xml from filesystem with priority rules."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "site"
BASE = "https://antidetect-automation.github.io"
TODAY = "2026-08-05"
STUBS = {
    "/vs/blink/",
    "/vs/vision/",
    "/vs/vmlogin/",
    "/vs/hidemium/",
    "/vs/incogniton/",
    "/vs/kameleo/",
    "/vs/linken-sphere/",
    "/vs/morelogin/",
}
PRI = {
    "/": 1.0,
    "/pricing/": 0.96,
    "/deal/": 0.96,
    "/digest/": 0.88,
    "/start/": 0.95,
    "/guides/mlx-api/": 0.94,
    "/guides/playwright-mlx/": 0.94,
    "/use-cases/facebook-ads/": 0.93,
    "/vs/adspower/": 0.93,
    "/use-cases/ads-multi-account/": 0.92,
    "/use-cases/google-ads/": 0.92,
    "/vs/": 0.92,
    "/vs/gologin/": 0.92,
    "/vs/octo-browser/": 0.92,
    "/vs/bitbrowser/": 0.92,
    "/faq/": 0.91,
    "/use-cases/affiliate/": 0.90,
    "/guides/postman-mlx/": 0.90,
    "/guides/api-auth-mlx/": 0.90,
    "/guides/mlx-proxy/": 0.90,
    "/errors/cdp-attach/": 0.90,
    "/guides/": 0.90,
    "/tools/": 0.90,
    "/use-cases/": 0.88,
    "/use-cases/cloud-phone/": 0.88,
    "/errors/": 0.88,
    "/vs/dolphin-anty/": 0.88,
    "/vs/undetectable/": 0.88,
    "/guides/profile-warmup/": 0.88,
    "/guides/cookies-sessions/": 0.88,
    "/guides/puppeteer-mlx/": 0.86,
    "/guides/selenium-mlx/": 0.84,
    "/glossary/": 0.80,
    "/about/": 0.70,
}


def priority(path: str) -> float:
    if path in STUBS:
        return 0.30
    if path in PRI:
        return PRI[path]
    if path.startswith("/tools/"):
        return 0.85
    if path.startswith("/errors/"):
        return 0.86
    if path.startswith("/use-cases/"):
        return 0.80
    if path.startswith("/guides/"):
        return 0.85
    if path.startswith("/vs/"):
        return 0.70
    if path.endswith((".xml", ".txt")):
        return 0.55
    return 0.60


def main() -> None:
    urls = ["/"]
    for idx in sorted(ROOT.rglob("index.html")):
        if idx.parent == ROOT:
            continue
        rel = "/" + str(idx.parent.relative_to(ROOT)).replace("\\", "/") + "/"
        urls.append(rel)
    for e in ("/sitemap.xml", "/feed.xml", "/llms.txt"):
        urls.append(e)
    seen = set()
    ordered = []
    for u in urls:
        if u not in seen:
            seen.add(u)
            ordered.append(u)
    ordered.sort(key=lambda p: (-priority(p), p))
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for path in ordered:
        if path in STUBS:
            continue  # on-page noindex; keep crawl budget on heroes
        loc = BASE + ("/" if path == "/" else path)
        lines.append(
            f"  <url><loc>{loc}</loc><lastmod>{TODAY}</lastmod><priority>{priority(path):.2f}</priority></url>"
        )
    lines.append("</urlset>")
    body = "\n".join(lines) + "\n"
    (ROOT / "sitemap.xml").write_text(body)
    n = body.count("<url>")
    print(f"wrote {n} urls (skipped stubs {len([u for u in ordered if u in STUBS])})")


if __name__ == "__main__":
    main()
