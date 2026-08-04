# Project status vs original plan

Updated: 2026-08-04

## Original handoff Top 10

| # | Asset | Status | Where |
|---|--------|--------|--------|
| 1 | Playwright starter kit | Done | `kits/playwright-mlx-starter/` |
| 2 | Postman no-code kit | Done | `kits/postman/` + `/guides/postman-mlx/` |
| 3 | WebGL leak checker | Done | `/tools/webgl-check/` |
| 4 | Proxy pack formatter | Done | `/tools/proxy-format/` |
| 5 | Telegram intent onboarding | Done | `@antidetect_automation_bot` |
| 6 | Source-aware deep links | Done | `?start=aa_*` |
| 7 | Troubleshooting / content factory | Partial (drafts ready) | `content/` + FAQ |
| 8 | Use-case landings | Done | `/use-cases/*` |
| 9 | Hub SSOT | Done | `aff-saas` → `*.github.io` |
| 10 | Evergreen refresh Actions | Done | `.github/workflows/` |

## Architecture (locked)

```text
aff-saas (code) → antidetect-automation.github.io (site)
               → CF Worker bot (webhook + D1 + KV + AI)
profile README = brand door only
```

## Live

- Site: https://antidetect-automation.github.io/
- Bot: https://t.me/antidetect_automation_bot
- Worker: https://aa-telegram-bot.antidetect-automation.workers.dev/health
