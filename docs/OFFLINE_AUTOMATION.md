# Offline automation (no PC required)

## Cloudflare Worker (recommended — already wired)

The `aa-telegram-bot` Worker cron (`* * * * *`) also runs **Multilogin blog digests**:

1. Fetch official RSS: `https://multilogin.com/blog/feed`
2. Filter ads / cloud phone / proxies / automation topics (skip TikTok/YouTube junk)
3. Workers AI writes **short commentary** (not a reprint)
4. Store in KV (`digest:latest`)
5. Optional Telegram push if secret `DIGEST_CHAT_ID` is set

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /digests` | public | Last commentary JSON |
| `GET /run-digest?key=STATS_KEY&force=1` | `STATS_KEY` | Manual trigger |
| Bot `/digest` | Telegram | Show latest notes to users |

### One-time owner setup (phone OK)

```bash
# From a machine once — then laptop can stay off:
cd worker-bot
printf '%s' 'YOUR_TELEGRAM_CHAT_ID' | npx wrangler secret put DIGEST_CHAT_ID
npx wrangler deploy
```

Get chat id: message the bot, then check `/stats?key=` or any update logger. Or use `@userinfobot`.

### Limits (Cloudflare free)

- Cron + Workers AI + KV: fine for ~2 posts/hour max (we budget **1 run/hour**, ≤2 new items)
- Does **not** auto-commit to github.io (needs GitHub token). Site updates still via your existing `ship.sh` when you want — or add GitHub Actions later.

## GitHub Actions free (alternative / hybrid)

- 2 000 min/month on free private; public repos more generous
- Can schedule `0 */6 * * *` to run digest script + optional `git commit` to Pages
- Use when you want **HTML pages** on github.io without a PC — CF alone cannot push git without a PAT secret

## What does *not* work without a always-on PC

- Local `nohup` loops / Cursor overnight loops
- Scraping Multilogin in a desktop browser session

**Bottom line:** CF Worker = digests + Telegram while you sleep. GitHub Actions = only if you also need auto HTML on github.io.
