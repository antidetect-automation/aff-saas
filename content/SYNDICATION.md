# Syndication pack

## Published on Dev.to (2026-08-04) — **ACCOUNT DEAD / 404**

Do not trust these URLs; recreate account and republish.

| Article | URL | Canonical |
|---------|-----|-----------|
| Pricing 2026 | https://dev.to/antidetect-automatio/multilogin-pricing-2026-free-5-profiles-and-pro-from-7mo-57n4 | `/pricing/` |
| vs AdsPower | https://dev.to/antidetect-automatio/multilogin-vs-adspower-in-2026-api-farms-vs-rpa-desks-3f6a | `/vs/adspower/` |
| Playwright + MLX | https://dev.to/antidetect-automatio/playwright-multilogin-x-start-a-profile-and-connectovercdp-4j75 | `/guides/playwright-mlx/` |

Bodies in `content/published/`. API key lives in `.secrets/devto.env` (gitignored) — never commit.

Profile: https://dev.to/antidetect-automatio

## Still manual / later
- Hashnode (needs token)
- GSC / Bing Webmaster sitemap submit
- Medium (optional)
- Further Dev.to only after these 3 get engagement

## Draft inventory (unpublished)
Deal, tools, GoLogin, Dolphin, Octo, Undetectable, Linken, MoreLogin, Hidemium, Incogniton — keep in `content/devto-*.md`.

## Hashnode (blocked Aug 2026)

- Token saved locally in `.secrets/hashnode.env` (gitignored)
- Blog: https://antidetect-automation.hashnode.dev
- Publication id: `6a71fe31e4e6b72e634f8d22`
- Endpoint that works: `https://gql-beta.hashnode.com/`
- **API writes require Hashnode Pro** on the publication (`createDraft` → FORBIDDEN without Pro)
- Script ready: `python3 scripts/publish_hashnode.py` after Pro upgrade

Dev.to account is gone (404); recreate + new API key if you want Forem again.
