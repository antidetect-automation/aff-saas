#!/usr/bin/env python3
"""Heuristic Google/Lighthouse-style checklist score for static hub (0–100)."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "site"
CHECKS = []


def add(ok: bool, name: str, weight: int) -> None:
    CHECKS.append((ok, name, weight))


def main() -> int:
    pages = list(ROOT.rglob("index.html"))
    heroes = [
        ROOT / "index.html",
        ROOT / "pricing/index.html",
        ROOT / "deal/index.html",
        ROOT / "guides/playwright-mlx/index.html",
        ROOT / "guides/mlx-api/index.html",
        ROOT / "use-cases/facebook-ads/index.html",
        ROOT / "vs/adspower/index.html",
    ]

    # Assets
    og_jpg = ROOT / "assets/og.jpg"
    add(og_jpg.exists() and og_jpg.stat().st_size < 200_000, "OG image <200KB", 8)
    add((ROOT / "assets/site.css").exists(), "CSS present", 2)
    add((ROOT / "assets/favicon.svg").exists(), "SVG favicon", 2)
    add((ROOT / "assets/apple-touch-icon.png").exists(), "Apple touch icon", 2)
    add((ROOT / "sitemap.xml").exists(), "sitemap.xml", 4)
    add((ROOT / "robots.txt").exists() and "Sitemap:" in (ROOT / "robots.txt").read_text(), "robots Sitemap", 3)
    add((ROOT / "llms.txt").exists(), "llms.txt", 2)
    add((ROOT / "feed.xml").exists(), "Atom feed", 2)
    add((ROOT / ".well-known/security.txt").exists(), "security.txt", 2)
    add((ROOT / "privacy/index.html").exists(), "privacy page", 3)
    add((ROOT / "404.html").exists(), "custom 404", 2)
    add((ROOT / "site.webmanifest").exists(), "webmanifest", 2)

    # Heroes completeness
    miss = 0
    for h in heroes:
        t = h.read_text()
        need = [
            'name="description"',
            "rel=\"canonical\"",
            "og:title",
            "twitter:card",
            "application/ld+json",
            "skip-link",
            'id="main"',
            "Affiliate",
        ]
        if not all(x in t for x in need):
            miss += 1
    add(miss == 0, "heroes meta/schema/a11y/disclosure", 12)

    # Sitewide samples
    thin_indexable = 0
    no_h1 = 0
    for p in pages:
        t = p.read_text()
        if "noindex" in t:
            continue
        words = len(re.sub(r"<[^>]+>", " ", t).split())
        if words < 280 and p.parent != ROOT:
            # hubs can be navigational
            if p.name == "index.html" and p.parent.name in {
                "tools",
                "guides",
                "use-cases",
                "errors",
                "vs",
            }:
                pass
            elif words < 200:
                thin_indexable += 1
        if len(re.findall(r"<h1[\s>]", t)) != 1:
            no_h1 += 1
    add(thin_indexable <= 5, f"limited thin indexable ({thin_indexable})", 8)
    add(no_h1 == 0, "single H1 everywhere", 5)

    # Home FAQ + org schema
    home = (ROOT / "index.html").read_text()
    add("FAQPage" in home, "home FAQPage schema", 5)
    add("Organization" in home, "Organization schema", 4)
    add("google-site-verification" in home, "GSC verification meta", 3)
    add("theme-color" in home, "theme-color", 1)

    # Performance CSS checks
    css = (ROOT / "assets/site.css").read_text()
    add("prefers-reduced-motion" in css, "reduced motion", 2)
    add("focus-visible" in css, "focus-visible", 2)
    add(css.count("\n") < 400 and len(css) < 12_000, "CSS budget small", 3)

    total_w = sum(w for _, _, w in CHECKS)
    score = sum(w for ok, _, w in CHECKS if ok)
    pct = round(100 * score / total_w)
    print(f"google_quality_score {pct}/100 (weighted {score}/{total_w})")
    for ok, name, w in CHECKS:
        print(("PASS" if ok else "FAIL"), f"+{w}", name)
    return 0 if pct >= 90 else 1


if __name__ == "__main__":
    sys.exit(main())
