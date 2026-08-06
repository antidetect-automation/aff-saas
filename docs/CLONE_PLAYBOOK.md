# Clone playbook — nhiều account aff (không đụng AFF-SAAS hiện tại)

**Mô hình khóa:** mỗi account / brand = **1 folder máy local riêng** + GitHub org/user riêng + Cloudflare account (hoặc account + Worker name riêng) + Sheet riêng + Telegram bot/channel riêng.

Project gốc **`/Users/k/Downloads/AFF-SAAS`** (Multilogin · `antidetect-automation`) **không sửa** khi clone. Chỉ `cp` / `git clone` sang folder mới rồi đổi identity.

---

## 1. Quy trình đang chạy (project gốc)

```text
Nguồn (RSS Multilogin / sitemap AdsPower / …)
    → Cloudflare Worker cron + Workers AI (rewrite)
    → Telegram channel + bot CTA (SAAS50/MIN50)
    → GitHub API → aff-saas site/digest → github.io
    → IndexNow + sitemap
    → Google Sheets (Apps Script webhook) backup
```

| Lớp | Gốc (ví dụ) |
|-----|-------------|
| Site | `antidetect-automation.github.io` |
| Source monorepo | `antidetect-automation/aff-saas` |
| Worker | `aa-telegram-bot` (CF account hiện tại) |
| Bot / channel | `@antidetect_automation_bot` / `-100…` |
| Aff | `https://multilogin.com?a_aid=saas` + SAAS50/MIN50 |
| Sheet | Apps Script `SHEETS_WEBHOOK_URL` |
| Đối thủ phụ | AdsPower sitemap (vs Multilogin) |

Chi tiết vận hành: `docs/DIGEST_CHANNEL.md`, `docs/OFFLINE_AUTOMATION.md`, `docs/ARCHITECTURE.md`.

---

## 2. Ma trận 1 account mới (điền trước khi clone)

Copy bảng này cho mỗi brand:

| Field | Ví dụ brand GoLogin-ES |
|-------|-------------------------|
| `BRAND_SLUG` | `gologin-es-desk` |
| `LOCAL_FOLDER` | `/Users/k/Downloads/AFF-GOLOGIN-ES` |
| Ngôn ngữ site/post | `es` |
| Hero product / aff | GoLogin affiliate URL + codes (hoặc Multilogin nếu vẫn bán MLX) |
| Đối thủ chính (nguồn cào) | GoLogin RSS **hoặc** Multilogin làm “vs” |
| GitHub user/org **mới** | (không dùng org `antidetect-automation`) |
| Pages URL | `https://<user>.github.io/` |
| CF account / Worker name | Worker name unique, vd `gl-es-telegram-bot` |
| Telegram bot + channel | BotFather mới + channel mới |
| Gmail + Sheet + Apps Script | Webhook URL mới |
| `STATS_KEY` / secrets | Generate mới, không tái dùng secret gốc |

**Rule cứng**

- **Không** tạo thêm public repo spam dưới org `antidetect-automation`.
- **Không** trộn `.env` / wrangler secret giữa 2 folder.
- **Không** dùng chung `DIGEST_CHAT_ID` / Sheet / Pages giữa 2 brand.
- Mỗi folder Cursor = 1 workspace root riêng.

---

## 2b. Template sẵn (khuyến nghị)

Golden folder đã seed:

`/Users/k/Downloads/AFF-DESK-TEMPLATE`

```bash
cp -R /Users/k/Downloads/AFF-DESK-TEMPLATE /Users/k/Downloads/AFF-<BRAND>
# Open Folder trong Cursor → sửa brand.config.json → chat: bootstrap + deploy
```

Chi tiết owner/agent: `AFF-DESK-TEMPLATE/START_HERE.md`, `AGENTS.md`.

## 3. Cách clone hợp lý (filesystem)

### Bước A — Copy code (không ảnh hưởng gốc)

```bash
# Từ máy local — KHÔNG xóa / rename AFF-SAAS
rsync -a --exclude node_modules --exclude .git \
  /Users/k/Downloads/AFF-SAAS/ \
  /Users/k/Downloads/AFF-GOLOGIN-ES/

cd /Users/k/Downloads/AFF-GOLOGIN-ES
git init   # hoặc: giữ .git rồi đổi remote (xem dưới)
```

**Khuyến nghị remote**

```bash
cd /Users/k/Downloads/AFF-GOLOGIN-ES
# Nếu đã copy cả .git từ gốc:
git remote remove origin
git remote add origin git@github.com:<ORG_MOI>/<repo-moi>.git
# Đổi tên project trong README; push main mới
```

Hoặc sạch hơn: `git clone` từ template private (sau khi push 1 lần “template” không brand), rồi rename.

### Bước B — File identity cần đổi (checklist)

Làm theo thứ tự trong folder **mới** only:

1. **`worker-bot/wrangler.toml`**
   - `name` = Worker name mới  
   - `account_id` = CF account mới (nếu account khác)  
   - KV / D1: tạo namespace + database **mới**, dán id mới  

2. **`worker-bot/src/*.js` + site**
   - `HUB`, `BOT`, `AFF`, channel fallback  
   - Brand string `antidetect-automation` → brand mới  
   - Hashtag / ngôn ngữ prompt AI  

3. **`worker-bot/src/competitorSources.js` (+ mlxDigest feeds)**
   - Brand A: Multilogin primary + AdsPower vs  
   - Brand B: GoLogin RSS primary + Multilogin hoặc AdsPower vs  
   - 1 account ≈ 1 đối thủ “vs” chính (đúng ý bạn)

4. **`site/`**
   - Domain canonical, OG, nav, deal copy, ngôn ngữ HTML  
   - IndexNow key file riêng (generate key mới + file `{key}.txt`)

5. **`.github/workflows/deploy-pages.yml`**
   - Target repo `*.github.io` của org mới  
   - Secret `PAGES_PUSH_TOKEN` của org mới  

6. **Secrets Worker (wrangler secret put)** — account mới
   - `BOT_TOKEN`, `STATS_KEY`, `DIGEST_CHAT_ID`, `GITHUB_TOKEN`, `SHEETS_WEBHOOK_URL`  

7. **Apps Script**
   - Copy `scripts/google_sheets_backup.gs` vào Sheet Gmail mới → Deploy Web app → URL mới  

8. **Telegram**
   - BotFather bot mới; channel mới; bot = admin channel  

### Bước C — Smoke test trên folder mới

```bash
cd /Users/k/Downloads/AFF-<BRAND>/worker-bot
npx wrangler deploy
# /run-digest?key=...&force=1&source=auto
# Check: channel → github.io/digest → Sheet row (body multiline)
```

Gốc `AFF-SAAS` không deploy lại trừ khi cố ý.

---

## 4. Ngôn ngữ khác (ES / RU / …)

| Chỗ | Việc |
|-----|------|
| AI digest prompt | System/user prompt trong `mlxDigest.js` → `"Write in Spanish/Russian…"` |
| Site HTML | Viết / dịch money pages (pricing, deal, vs) — hoặc bắt đầu ES-only stub |
| Hashtags | `#multilogin` giữ; thêm `#navegadorantidetect` / niche local |
| Bot strings | `index.js` welcome / deal copy theo locale |
| Channel | Description + posts cùng ngôn ngữ |

**Không** copy nguyên site EN rồi chỉ đổi AI — Google phạt thin translate. Ưu tiên: deal + pricing + 1 vs + digest locale trước.

---

## 5. Đối thủ khác (GoLogin, Dolphin, …)

| Nguồn | Cách lấy | File |
|-------|----------|------|
| Multilogin | RSS `…/blog/feed` | `mlxDigest.js` |
| AdsPower | Sitemap `…/__sitemap__/en-US.xml` | `competitorSources.js` |
| GoLogin | RSS thường `https://gologin.com/blog/feed/` | thêm `fetchGoLoginCandidates` (mirror pattern AdsPower/RSS) |
| Dolphin / Octo | Probe `/feed` hoặc sitemap; nếu không có → KV evergreen | không spam HTML scrape nặng |

Pattern: **primary feed = brand bạn affiliate**; **secondary = đối thủ** để bài “vs” → CTA code/aff của bạn.  
Public post: **không** nhét URL đối thủ (giữ click); nút về `/vs/...` + deal.

---

## 6. Nói với Cursor / agent thế nào (quan trọng)

### Mở đúng folder

1. **File → Open Folder** → `/Users/k/Downloads/AFF-GOLOGIN-ES` (folder clone)  
2. Chat mới trong workspace đó  
3. (Khuyến nghị) gọi tool `move_agent_to_root` nếu agent còn dính AFF-SAAS  

### Prompt mẫu — lần đầu trên folder mới

```text
Đây là CLONE tách biệt của aff desk, KHÔNG phải project antidetect-automation gốc.

Folder này: /Users/k/Downloads/AFF-GOLOGIN-ES
Brand: …
Ngôn ngữ: es
Aff URL + codes: …
Đối thủ nguồn: GoLogin RSS (primary) / … (vs)
GitHub org/repo + pages: …
CF Worker name + account: …
Telegram bot + DIGEST_CHAT_ID: …
SHEETS_WEBHOOK_URL: (secret riêng)

Nhiệm vụ: đọc docs/CLONE_PLAYBOOK.md + docs/DIGEST_CHANNEL.md,
đổi toàn bộ identity còn sót brand cũ, tạo KV/D1 nếu thiếu,
deploy Worker, chạy 1 /run-digest force end-to-end.
Không đụng /Users/k/Downloads/AFF-SAAS.
```

### Prompt khi quay lại gốc

```text
Workspace: /Users/k/Downloads/AFF-SAAS (Multilogin antidetect-automation).
Không merge thay đổi từ các folder AFF-* khác.
```

### Tránh

- Mở multi-root vừa AFF-SAAS vừa clone rồi bảo “sửa brand” → agent dễ commit nhầm  
- Copy `wrangler` state / `.env` từ gốc sang clone  
- Dùng chung `GITHUB_TOKEN` PAT hẹp scope chỉ repo gốc  

---

## 7. Thứ tự triển khai 1 brand mới (checklist ngắn)

1. Gmail mới → Sheet + Apps Script deploy (`google_sheets_backup.gs`)  
2. GitHub user/org mới → repo `aff-…` + `user.github.io`  
3. Cloudflare (account hoặc Worker name mới) → KV + D1 + AI  
4. `rsync` code → folder mới → đổi identity (mục 3B)  
5. Telegram BotFather + channel  
6. Partner aff codes/link đúng sản phẩm  
7. `wrangler secret put` đủ bộ  
8. Deploy + `/run-digest?force=1` → verify channel / pages / Sheet newlines  
9. GSC + Bing cho domain mới (1 lần)  
10. Pin channel + avatar  

---

## 8. Scale nhiều account mà còn tỉnh táo

| Làm | Không làm |
|-----|-----------|
| 1 folder = 1 brand = 1 spreadsheet theo dõi secrets | Copy-paste 20 repo dưới cùng org → spam flag |
| Spreadsheet “fleet”: brand, folder path, Worker URL, last digest | Shared DIGEST_CHAT giữa brand |
| Cải thiện pipeline ở **gốc** rồi cherry-pick / rsync có kiểm soát sang clone | “Automate” mass join Telegram / reprint full blog đối thủ |
| AI locale + 1 đối thủ chính / account | Cào tất cả đối thủ vào 1 channel |

**Đồng bộ cải tiến từ gốc → clone**

```bash
# Chỉ kéo file “engine”, không đè brand
rsync -a --relative \
  /Users/k/Downloads/AFF-SAAS/./worker-bot/src/mlxDigest.js \
  /Users/k/Downloads/AFF-SAAS/./worker-bot/src/sheetsBackup.js \
  /Users/k/Downloads/AFF-SAAS/./worker-bot/src/githubPublisher.js \
  /Users/k/Downloads/AFF-SAAS/./worker-bot/src/indexNow.js \
  /Users/k/Downloads/AFF-GOLOGIN-ES/
# Rồi diff: giữ AFF/HUB/BOT/prompts locale của clone
```

---

## 9. Template env fleet (local only — không commit)

`/tmp/aff-fleet/<brand>.env` ví dụ:

```bash
LOCAL_FOLDER=/Users/k/Downloads/AFF-GOLOGIN-ES
BRAND_SLUG=gologin-es-desk
HUB=https://xxxxx.github.io
BOT=https://t.me/xxxxx_bot
AFF=https://…
DIGEST_CHAT_ID=-100…
SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/…/exec
WORKER_URL=https://….workers.dev
PRIMARY_SOURCE=gologin
LOCALE=es
```

Khi gọi agent: “đọc `/tmp/aff-fleet/gologin-es.env` rồi làm theo CLONE_PLAYBOOK”.

---

## 10. Liên quan docs gốc

| Doc | Dùng khi |
|-----|----------|
| `ARCHITECTURE.md` | Lock org gốc — clone = org **khác** |
| `DIGEST_CHANNEL.md` | Cron, source, Sheets |
| `OFFLINE_AUTOMATION.md` | PC off |
| `CHANNEL_GROWTH.md` | Aff volume / không spam |
| `scripts/google_sheets_backup.gs` | Mỗi Gmail 1 deploy |

---

**Tóm lại:** clone = **folder mới + remote mới + secrets mới**; Cursor chỉ hiểu đúng khi **Open Folder đúng clone** và prompt nói rõ “không đụng AFF-SAAS”. Gốc Multilogin giữ nguyên làm “máy mẫu”; các brand khác là bản sao đổi identity + nguồn + ngôn ngữ.
