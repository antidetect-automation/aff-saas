# Daily Multilogin blog → channel digest

## AI — cần mua API không?

**Không.** Dùng **Cloudflare Workers AI** (`@cf/meta/llama-3.2-3b-instruct`) đã bind trên Worker `aa-telegram-bot`. Free tier đủ cho ~1 bài/ngày.

Chỉ cân nhắc OpenAI/Anthropic trả phí nếu muốn giọng viết “đắt” hơn — không bắt buộc.

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

## Prompt định hướng

Commentary gốc (không copy Multilogin) → CTA Telegram `SAAS50`/`MIN50` + hub + **affiliate** `https://multilogin.com/?a_aid=saas`.

**Không** đưa link bài blog Multilogin ra channel (tránh mất click aff). URL gốc chỉ lưu KV để dedupe.

## Manual

```
GET /run-digest?key=STATS_KEY&force=1
```

`force=1` bỏ qua day budget nhưng **vẫn skip URL đã posted**.

## Owner checklist

1. Add `@antidetect_automation_bot` as channel admin  
2. Secret đã set: `DIGEST_CHAT_ID=-1004445803393`  
3. Optional test: `/run-digest?key=...&force=1`
