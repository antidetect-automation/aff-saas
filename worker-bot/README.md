# aa-telegram-bot (Cloudflare free max)

Public site: https://antidetect-automation.github.io/ only.

## Live stack
- Worker + `workers.dev` **webhook** (realtime)
- Cron every minute as **fallback poll** if webhook mode off
- KV counters + D1 `aa-leads` lead log
- Workers AI for `/ask`
- Secrets: `BOT_TOKEN`, `WEBHOOK_SECRET`, `STATS_KEY`

Webhook: `https://aa-telegram-bot.antidetect-automation.workers.dev/webhook`

## Stats
`GET /stats?key=$STATS_KEY`

## BotFather manual
See [BOTFATHER_MANUAL.md](./BOTFATHER_MANUAL.md)
