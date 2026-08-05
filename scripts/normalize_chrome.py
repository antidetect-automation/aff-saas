#!/usr/bin/env python3
"""Normalize site header/footer + inject site.js / theme-color across HTML pages."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "site"

HEADER = """  <header class="site-header">
    <div class="shell site-header__bar">
      <a class="brand" href="/" aria-label="antidetect-automation home">
        <span class="brand__mark" aria-hidden="true"></span>
        <span class="brand__text">antidetect-automation</span>
      </a>
      <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="site-nav" data-nav-toggle>
        <span class="nav-toggle__label">Menu</span>
        <span class="nav-toggle__icon" aria-hidden="true"></span>
      </button>
      <nav class="site-nav" id="site-nav" data-site-nav>
        <a href="/pricing/">Pricing</a>
        <a href="/deal/">Deal</a>
        <a href="/digest/">Digest</a>
        <a href="/vs/">Compare</a>
        <a href="/guides/">Guides</a>
        <a href="/use-cases/">Use cases</a>
        <a class="site-nav__cta" href="https://t.me/antidetect_automation_bot?start=aa_nav">Get 50%</a>
      </nav>
    </div>
  </header>"""

FOOTER = """  <footer class="site-footer">
    <div class="shell site-footer__grid">
      <div class="site-footer__brand">
        <a class="brand" href="/">
          <span class="brand__mark" aria-hidden="true"></span>
          <span class="brand__text">antidetect-automation</span>
        </a>
        <p>Multilogin partner desk for ads, API, and Cloud Phone ops. Independent hub — not Multilogin Support.</p>
      </div>
      <div>
        <h2 class="site-footer__h">Money</h2>
        <ul>
          <li><a href="/deal/">Deal desk</a></li>
          <li><a href="/pricing/">Pricing 2026</a></li>
          <li><a href="https://t.me/antidetect_automation_bot?start=aa_foot">Telegram codes</a></li>
          <li><a href="https://multilogin.com?a_aid=saas">Open Multilogin</a></li>
        </ul>
      </div>
      <div>
        <h2 class="site-footer__h">Ops</h2>
        <ul>
          <li><a href="/guides/">Guides</a></li>
          <li><a href="/vs/">Compare</a></li>
          <li><a href="/use-cases/">Use cases</a></li>
          <li><a href="/digest/">Digest</a></li>
          <li><a href="/errors/">Error desk</a></li>
          <li><a href="/tools/">Tools</a></li>
        </ul>
      </div>
      <div>
        <h2 class="site-footer__h">Meta</h2>
        <ul>
          <li><a href="/about/">About</a></li>
          <li><a href="/faq/">FAQ</a></li>
          <li><a href="/privacy/">Privacy</a></li>
          <li><a href="https://github.com/antidetect-automation">GitHub</a></li>
          <li><a href="/sitemap.xml">Sitemap</a></li>
          <li><a href="/feed.xml">Feed</a></li>
        </ul>
      </div>
    </div>
    <div class="shell site-footer__legal">
      <p><strong>Affiliate disclosure:</strong> We may earn a commission if you buy Multilogin via our codes or links (<code>SAAS50</code> / <code>MIN50</code>).</p>
      <p class="site-footer__copy">© antidetect-automation · partner desk</p>
    </div>
  </footer>
  <script src="/assets/site.js" defer></script>"""


def normalize(html: str) -> str:
    # theme-color
    html = re.sub(
        r'<meta name="theme-color" content="[^"]*"\s*/?>',
        '<meta name="theme-color" content="#050a0c" />',
        html,
        count=1,
    )
    if 'name="theme-color"' not in html:
        html = html.replace(
            '<meta name="viewport"',
            '<meta name="theme-color" content="#050a0c" />\n  <meta name="viewport"',
            1,
        )

    # Ensure site.js not duplicated later — strip old footer scripts first
    html = re.sub(
        r'\s*<script src="/assets/site\.js"[^>]*>\s*</script>\s*',
        "\n",
        html,
    )

    # Header: classic <header class="top">...</header> OR already site-header
    html = re.sub(
        r"<header class=\"(?:top|site-header)\">[\s\S]*?</header>",
        HEADER,
        html,
        count=1,
    )

    # Footer: replace any foot / site-footer block before </body>
    html = re.sub(
        r"<footer class=\"(?:foot|site-footer)\">[\s\S]*?</footer>(?:\s*<script src=\"/assets/site\.js\"[^>]*>\s*</script>)?",
        FOOTER,
        html,
        count=1,
    )

    return html


def main() -> None:
    files = sorted(ROOT.rglob("*.html"))
    changed = 0
    for path in files:
        if "assets" in path.parts:
            continue
        raw = path.read_text(encoding="utf-8")
        if "<body" not in raw:
            continue
        new = normalize(raw)
        if new != raw:
            path.write_text(new, encoding="utf-8")
            changed += 1
            print("updated", path.relative_to(ROOT))
    print(f"done: {changed}/{len(files)} files")


if __name__ == "__main__":
    main()
