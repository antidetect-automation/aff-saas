# Daily Multilogin blog → channel digest

## AI — cần mua API không?

**Không.** Dùng **Cloudflare Workers AI** (`@cf/meta/llama-3.2-3b-instruct`) đã bind trên Worker `aa-telegram-bot`. Free tier đủ cho ~1 bài/ngày.

Chỉ cân nhắc OpenAI/Anthropic trả phí nếu muốn giọng viết “đắt” hơn — không bắt buộc.

## Google Sheets backup

After each successful Telegram digest post, Worker POSTs a row to an **Apps Script Web App**.

1. Copy `scripts/google_sheets_backup.gs` into a Sheet’s Apps Script project  
2. Deploy → Web app → Execute as **Me** → Who has access **Anyone**  
3. Secret:
   ```bash
   cd worker-bot
   printf '%s' 'https://script.google.com/macros/s/.../exec' | npx wrangler secret put SHEETS_WEBHOOK_URL
   # optional:
   # printf '%s' 'random-secret' | npx wrangler secret put SHEETS_HOOK_SECRET
   # (same value in Apps Script → Project Settings → Script properties → SHEETS_HOOK_SECRET)
   ```

Without `SHEETS_WEBHOOK_URL`, digest still posts; sheets step returns `skipped`.

Columns: `posted_at, feed, title, source_url, github_url, telegram_message_id, channel_id, body, cta_footer`

## Sources (auto)

1. **Multilogin** RSS `multilogin.com/blog/feed` (priority)
2. **AdsPower** public sitemap `…/__sitemap__/en-US.xml` → `/blog/*` (fallback / `?source=adspower`)

AI writes Multilogin-desk commentary (vs AdsPower when competitor). **No competitor URLs in CTAs** — button goes to our `/vs/adspower/` + deal.

```
GET /run-digest?key=STATS_KEY&force=1&source=adspower
GET /run-digest?key=STATS_KEY&force=1&source=multilogin
GET /run-digest?key=STATS_KEY&force=1&source=auto
```

## Cron

- `0 9 * * *` UTC — chạy digest  
- `* * * * *` — poll Telegram + gate ngày (KV `digest:last_day`)  
- **Tối đa 1 bài mới / ngày**

## Channel

Default / secret: `-1004445803393` (`DIGEST_CHAT_ID`)

Bot **phải là admin** channel ( quyền Post messages ).

## Dedupe (không trùng)

KV key: `digest:posted:<normalized-url>`  
Chỉ ghi **sau khi** `sendMessage` thành công → lỗi Telegram sẽ retry hôm sau, không mất slot “đã post ảo”.

## Affiliate URL (LOCKED)

**Exact only:** `https://multilogin.com?a_aid=saas`  
Do **not** add `/`, `/pricing`, or other path — partner tracking breaks.

## Telegram “SEO” + CTA

- Keyword-rich first lines (Multilogin, antidetect, Facebook ads, Cloud Phone…)
- Niche hashtags at end (`#multilogin` `#facebookads` `#cloudphone` …) — **never** `#SAAS50` / `#MIN50` (codes are CTA, not tags)
- Footer: exclusive ~50% deal — SAAS50 (browser) / MIN50 (Cloud Phone) → bot → Multilogin checkout
- Buttons: `Get 50% — SAAS50 / MIN50` + `Open Multilogin · apply code` + hub
- **Do not** paste legalese / `a_aid=` jargon on channel posts (disclosure lives on hub `/deal/` and `/about/`)

Also set channel **username / description / pinned** with those keywords — hashtags alone không đủ.

## Manual

```
GET /run-digest?key=STATS_KEY&force=1
```

`force=1` bỏ qua day budget nhưng **vẫn skip URL đã posted**.

## Pages mirror

After Telegram success (+ `GITHUB_TOKEN` secret): writes MD + HTML into **aff-saas**, syncs via Pages Action. See [OFFLINE_AUTOMATION.md](./OFFLINE_AUTOMATION.md#github-pages-auto-publish-after-telegram).

Hub: https://antidetect-automation.github.io/digest/

## Owner checklist

1. Add `@antidetect_automation_bot` as channel admin  
2. Secret: `DIGEST_CHAT_ID=-1004445803393`  
3. Secret: `GITHUB_TOKEN` (PAT with Contents write on `aff-saas`) for Pages mirror  
4. Optional test: `/run-digest?key=...&force=1`  
