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

## Search engines (auto after digest → github.io)

Google **does not** support IndexNow. Stack we automate:

1. **Update `site/sitemap.xml`** in the same GitHub commit as the new digest page → GSC sitemap crawl finds it.
2. **IndexNow** (Bing / Yandex / partners) for the new URL + `/digest/` + sitemap — immediate + retry each cron minute until the page is live.
3. **Google sitemap ping** (`google.com/ping?sitemap=…`) — soft signal only.

Manual:
```
GET /indexnow?key=STATS_KEY&url=https://antidetect-automation.github.io/digest/.../
GET /indexnow?key=STATS_KEY   # flush pending queue
```

One-time GSC: property `antidetect-automation.github.io` → Sitemaps → submit `https://antidetect-automation.github.io/sitemap.xml` (once). New URLs appear via sitemap updates after that.

## GitHub Pages auto-publish (after Telegram)

After a successful channel `sendMessage`, the Worker calls `publishDigestToGithub`:

1. Builds Jekyll-style Markdown → `content/digest/_posts/YYYY-MM-DD-slug.md`
2. Builds live HTML → `site/digest/YYYY-MM-DD-slug/index.html`
3. Commits both via **GitHub Git Data API** (no `git` CLI) on `aff-saas` `main`
4. Existing Action `deploy-pages.yml` syncs `site/**` → `antidetect-automation.github.io`

### Secret (owner, once)

```bash
cd worker-bot
# Fine-grained or classic PAT: Contents read/write on antidetect-automation/aff-saas
printf '%s' 'ghp_...' | npx wrangler secret put GITHUB_TOKEN
```

Optional overrides (also via wrangler secrets / vars): `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH`.

Without `GITHUB_TOKEN`, Telegram still posts; GitHub step returns `skipped: no_GITHUB_TOKEN`.

### Local Python mirror

```bash
export GITHUB_TOKEN=...
python3 scripts/github_publisher.py --title "..." --body-file /tmp/post.txt
```

### CTA on site pages

Desk funnel only: bot `@antidetect_automation_bot`, codes **SAAS50** / **MIN50**, partner URL `https://multilogin.com?a_aid=saas`. No “bypass Cloudflare/Datadome” claims.

## GitHub Actions free (alternative / hybrid)

- 2 000 min/month on free private; public repos more generous
- Can schedule `0 */6 * * *` to run digest script + optional `git commit` to Pages
- Use when you want **HTML pages** on github.io without a PC — CF alone cannot push git without a PAT secret

## What does *not* work without a always-on PC

- Local `nohup` loops / Cursor overnight loops
- Scraping Multilogin in a desktop browser session

**Bottom line:** CF Worker = digests + Telegram while you sleep. GitHub Actions = only if you also need auto HTML on github.io.
