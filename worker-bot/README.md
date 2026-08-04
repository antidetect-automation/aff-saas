# aa-telegram-bot

Cloudflare Worker for `@antidetect_automation_bot`.

## Runtime mode: cron long-poll

This account’s `*.workers.dev` / `*.pages.dev` inbound TLS was failing (handshake failure) for both local clients and Telegram webhooks. The bot therefore uses:

- **Cron:** `* * * * *` → Worker calls Telegram `getUpdates`
- **No webhook required**

Secrets (already set on CF): `BOT_TOKEN`, optional `WEBHOOK_SECRET`, `STATS_KEY`.

## Deploy

```bash
cd worker-bot
npx wrangler deploy
```

## Manual test

Open https://t.me/antidetect_automation_bot?start=aa_home — within ~1 minute cron should answer.
