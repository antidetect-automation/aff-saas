# aa-telegram-bot

Telegram runtime for `@antidetect_automation_bot`.

**Public website is only** https://antidetect-automation.github.io/  
(No Cloudflare Pages / `pages.dev`.)

Worker uses **cron long-poll** (`* * * * *`) because this account’s `*.workers.dev` inbound TLS failed for Telegram webhooks.

```bash
cd worker-bot && npx wrangler deploy
```
