# Repository architecture (affiliate / SEO)

```text
                    ┌─────────────────────────────────────┐
  Google / GitHub   │  antidetect-automation.github.io    │  ← ONLY public website
  search traffic ──►│  (published HTML, SEO, sitemap)     │
                    └──────────────┬──────────────────────┘
                                   │ CTA
                                   ▼
                    ┌─────────────────────────────────────┐
                    │  t.me/antidetect_automation_bot     │  ← purchase desk
                    │  (Cloudflare Worker webhook)        │
                    └──────────────┬──────────────────────┘
                                   │
                                   ▼
                              SAAS50 / MIN50
```

## LOCKED — no new GitHub repositories

**Do not create any more public (or private product) repos under `antidetect-automation`.**

Org already has enough surface area. Extra repos look like spam to GitHub Trust & Safety and dilute SEO. All new work stays inside existing trees:

| Allowed repo | Role |
|--------------|------|
| `antidetect-automation` | Profile README only |
| `antidetect-automation.github.io` | Published site (synced) |
| `aff-saas` | **Only** source of truth — site, worker, kits, content drafts |
| `playwright-mlx-starter` | Existing kit mirror — improve in place, do not fork/split |
| `puppeteer-mlx-starter` | Existing kit mirror — improve in place, do not fork/split |

Selenium and Postman stay **folders under `aff-saas/kits/`** — never promote to new public repos unless the owner explicitly overrides this lock later.

## Three (+kits) repos — keep them separate

| Repo | Role | Edit here? |
|------|------|------------|
| [`antidetect-automation`](https://github.com/antidetect-automation/antidetect-automation) | **GitHub profile README** | README / badges only |
| [`antidetect-automation.github.io`](https://github.com/antidetect-automation/antidetect-automation.github.io) | **Live website** | Prefer sync from `aff-saas/site` |
| [`aff-saas`](https://github.com/antidetect-automation/aff-saas) | **Source of truth** | All product work |

## Should we merge profile + site?

**No.** Profile `username/username` ≠ User Pages `username.github.io`. Keep split.

## Affiliate rule of thumb

- **Profile** → trust / first look on GitHub  
- **github.io** → rank & convert  
- **aff-saas** → quality writing + Worker + kits (in monorepo)  

Do not host a second public site on Cloudflare Pages / pages.dev.
Do not create more GitHub repos for “coverage.”
