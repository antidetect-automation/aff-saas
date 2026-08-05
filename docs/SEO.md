# SEO checklist (aff-saas → github.io)

## Strategy lock (2026)
- **Quality over inventory.** A few excellent money/compare/how-to pages beat twenty thin doorways.
- **No new GitHub repos** for SEO “coverage” (triggers spam heuristics). Use `aff-saas` + existing kits only.
- **One public site:** `https://antidetect-automation.github.io/` only.

## Priority URLs (protect these)
1. `/pricing/` — commercial
2. `/deal/` — transactional
3. `/vs/adspower/` — primary compare
4. `/guides/playwright-mlx/` — how-to moat
5. `/guides/mlx-api/` — Postman API authority
6. `/use-cases/facebook-ads/` + `/use-cases/ads-multi-account/` — ads/MMO intent
7. `/errors/cdp-attach/` — problem intent
8. `/faq/` — Free / SAAS50 questions

Secondary essays (same voice, no template spam): GoLogin, Octo, Dolphin, Undetectable, BitBrowser, Google ads, affiliate.

## Publishing rule
Edit **`site/`** here, then sync to **`antidetect-automation.github.io`**. Never use pages.dev as a second public site.

## On-page (money + essays)
- [x] Unique `<title>` + meta description (intent, ≤〜155 chars)
- [x] `canonical` absolute URL
- [x] `og:*` + `twitter:card` + `og:image`
- [ ] Prefer `Article` JSON-LD + `dateModified` on essays (upgrade stubs when rewriting)
- [x] One H1; silo links: pricing ↔ deal ↔ main compare ↔ FAQ ↔ Telegram `start=`
- [x] Affiliate disclosure on money pages
- [x] Human voice — operators, not brochure AI outlines
- [x] `.nojekyll`

## Discovery
- [x] `/sitemap.xml`
- [x] `/robots.txt` → sitemap
- [x] `/feed.xml`
- [x] `/llms.txt`
- [x] IndexNow key
- [x] GSC meta verification tag on hub

## Manual (owner)
1. Google Search Console → verify → **submit sitemap**
2. Bing Webmaster → IndexNow/sitemap
3. Publish Dev.to/Hashnode from `content/` (3 max to start: pricing, AdsPower, Playwright) — link back to github.io
4. BotFather `/setuserpic`

## Do not
- Thin doorway / near-duplicate compare farms
- New repos, mirrors, or “one repo per competitor”
- Fake engagement / mass comments
- Undetectable / never-ban claims
- `pages.dev` as a public brand site
