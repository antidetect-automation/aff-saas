# SEO checklist (aff-saas → github.io)

## Publishing rule
Edit **`site/`** here, then sync to **`antidetect-automation.github.io`**. Never use pages.dev as a second public site.

## On-page (every HTML)
- [x] Unique `<title>` + meta description (≤〜155 chars intent)
- [x] `canonical` absolute URL
- [x] `og:*` + `twitter:card` + `og:image`
- [x] JSON-LD (`WebSite` / `Article` / `FAQPage` / `BreadcrumbList` / `AboutPage`)
- [x] One H1, internal links to deal + Telegram `start=`
- [x] Affiliate disclosure on money pages
- [x] `.nojekyll` so static files publish

## Discovery
- [x] `/sitemap.xml` full URL list
- [x] `/robots.txt` → sitemap
- [x] `/feed.xml` Atom
- [x] `/llms.txt` for AI crawlers
- [x] IndexNow key file (Bing ecosystem)

## GitHub SEO (this repo + pages repo)
- Description + homepage URL + topics
- Profile README points to hub
- Pages README states “published only”

## Manual (you, once)
1. [Google Search Console](https://search.google.com/search-console) → add `https://antidetect-automation.github.io/` → submit sitemap
2. [Bing Webmaster](https://www.bing.com/webmasters) → add site → IndexNow/sitemap
3. Optional: pin `aff-saas` + `antidetect-automation.github.io` on GitHub profile

## Do not
- Thin doorway pages (50 near-duplicate coupons)
- Fake engagement / mass comments
- Promise undetectable / never-ban
