# Contributing

Thanks for helping antidetect-automation stay useful (not spammy).

## Hard rules
- **No new GitHub repositories** — work only in the locked set (see `docs/ARCHITECTURE.md`)
- Value-first content only — no mass DM / fake engagement
- Always include affiliate disclosure on money pages
- No “undetectable / never ban” claims
- Never commit bot tokens, Multilogin tokens, or proxy credentials
- Prefer **deepening existing pages** over adding thin `/vs/*` stubs

## How we work
1. Edit `site/` in **aff-saas** (quality copy, SEO, internal links)
2. Push → Action syncs → Pages deploys `antidetect-automation.github.io`
3. Worker changes: `worker-bot/` via `wrangler deploy`
4. Kit changes: folders under `kits/` (or existing public kit repos only)

## Good PR types
- Human editorial rewrites of pricing / compare / guides that can rank
- Internal-link silos + schema fixes
- Bot UX that improves `SAAS50` vs `MIN50` routing
- Kit README clarity (no new repos)

Open an issue first for large ideas: use the Content template.

## Pre-ship checks
```bash
python3 scripts/rebuild_sitemap.py
python3 scripts/quality_check.py
bash scripts/sync_github_io.sh
cd worker-bot && npm run deploy
python3 scripts/indexnow_ping.py
```
