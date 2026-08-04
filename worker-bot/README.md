# aa-telegram-bot

Cloudflare Worker webhook for `@antidetect_automation_bot`.

## Secrets

```bash
npx wrangler secret put BOT_TOKEN
npx wrangler secret put WEBHOOK_SECRET
npx wrangler secret put STATS_KEY   # optional
```

## Deploy

```bash
npx wrangler kv namespace create LEADS
npx wrangler kv namespace create LEADS --preview
# paste ids into wrangler.toml, then:
npx wrangler deploy
```

## Webhook

```bash
curl -s "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  -d "url=https://<worker>.workers.dev/webhook" \
  -d "secret_token=$WEBHOOK_SECRET"
```
