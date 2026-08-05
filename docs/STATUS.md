# Project status

Updated: 2026-08-05 — offline MLX blog digest on Cloudflare

## Offline automation
- **Cloudflare Worker cron** pulls `multilogin.com/blog/feed`, AI commentary, KV store, optional Telegram `DIGEST_CHAT_ID`
- Bot: `/digest` · HTTP: `/digests` · `/run-digest?key=`
- Docs: `docs/OFFLINE_AUTOMATION.md`

## Owner once
```bash
printf '%s' '<your_tg_chat_id>' | npx wrangler secret put DIGEST_CHAT_ID
```
