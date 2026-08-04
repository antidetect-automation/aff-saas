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

## Three repos — keep them separate

| Repo | Role | Edit here? |
|------|------|------------|
| [`antidetect-automation`](https://github.com/antidetect-automation/antidetect-automation) | **GitHub profile README** (special repo name = username). Brand door on your profile page. | Yes — README / badges only |
| [`antidetect-automation.github.io`](https://github.com/antidetect-automation/antidetect-automation.github.io) | **Live website** (User Pages). What Google indexes. | Prefer sync from `aff-saas/site` — treat as publish target |
| [`aff-saas`](https://github.com/antidetect-automation/aff-saas) | **Source of truth** — site HTML source + Telegram Worker + drafts | Yes — all product work |

## Should we merge profile + site?

**No.**

1. Profile repo `username/username` is a GitHub product feature — it renders on https://github.com/antidetect-automation  
2. Public site **must** live in `username.github.io` for free User Pages at that URL  
3. Mixing website files into the profile repo does **not** replace `*.github.io` and makes SEO/deploy messier  
4. Professional pattern = **1 profile door + 1 published site + 1 code monorepo**

## Should we put all source only in github.io?

Possible for tiny static sites, but weaker for affiliate ops:

- Worker bot, D1 schema, BotFather notes, Dev.to drafts, secrets docs → clutter SEO repo  
- Dirty commit history on the indexed site repo  
- **Better:** `aff-saas` = code & drafts · `github.io` = clean published output  

## Affiliate rule of thumb

- **Profile** → trust / first look on GitHub  
- **github.io** → rank & convert (money pages)  
- **aff-saas** → ship features, then publish to github.io + deploy Worker  

Do not host a second public site on Cloudflare Pages / pages.dev.
