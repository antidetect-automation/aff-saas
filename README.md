# antidetect-automation

English Multilogin affiliate growth system:

- **Hub (CTA home):** https://antidetect-automation.github.io
- **Telegram bot:** https://t.me/antidetect_automation_bot
- **Codes:** `SAAS50` (browser) · `MIN50` (cloud phone)
- **Bot runtime:** Cloudflare Worker (`worker-bot/`)

## Deep-link map (`start=`)

| Source | Link |
|--------|------|
| Hub home | `https://t.me/antidetect_automation_bot?start=aa_home` |
| Deal page | `...?start=aa_deal` |
| vs AdsPower | `...?start=aa_vs_adspower` |
| Playwright guide | `...?start=aa_playwright` |
| Dev.to deal article | `...?start=devto_deal` |

## Layout

- `site/` — GitHub Pages source (publish to `antidetect-automation.github.io`)
- `worker-bot/` — Telegram webhook worker
- `content/` — syndication drafts (Dev.to / Hashnode)

## Affiliate disclosure

Pages and bot state that we may earn a commission. Not official Multilogin Support.

## Deploy notes

See `worker-bot/README.md` and hub repo Actions.
