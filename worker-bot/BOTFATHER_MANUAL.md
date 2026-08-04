# Cloudflare free stack for Telegram

## Enabled (automated)
| Feature | Role |
|---------|------|
| Workers | Bot runtime |
| Workers.dev HTTPS | Public webhook URL |
| Cron Triggers (`* * * * *`) | Fallback poll if webhook drops |
| KV (`LEADS`) | Counters + mode/offset |
| D1 (`aa-leads`) | Lead event log |
| Workers AI (`@cf/meta/llama-3.1-8b-instruct`) | `/ask` FAQ |
| Secrets | `BOT_TOKEN`, `WEBHOOK_SECRET`, `STATS_KEY` |

**Public site stays** https://antidetect-automation.github.io/ only (no pages.dev).

## BotFather — you must do manually
Telegram Bot API cannot set these (BotFather only):
1. **Bot profile photo** — `/setuserpic` in @BotFather
2. **About / Description long text via BotFather** (we also set description via API; BotFather About is optional polish)
3. **Group privacy mode** — `/setprivacy` if you want bot reading group messages (default: privacy on; keep ON)
4. **Allow groups** — `/setjoingrouproups` (default allowed; keep as needed)
5. **Inline mode** — only if you want `/setinline` (we don’t use it yet)
6. **Payments / domain for Web App** — not used

We auto-set via Bot API: commands menu, short description, description, webhook.
