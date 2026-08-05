Media buyers and automation desks search “multilogin playwright” because UI clicking does not scale. The loop is simple:

1. Authenticate  
2. Ask the local **Launcher** to start a profile with `automation_type=playwright`  
3. `connectOverCDP` to the port Multilogin returns  

## Plan gate

**Free has no API.** You need Pro or higher — see [pricing](https://antidetect-automation.github.io/pricing/). Playwright attaches to **Mimic** cores; Multilogin’s docs say Stealthfox + Playwright is not available yet.

## Source of truth

- [Official Playwright automation example](https://multilogin.com/help/en_US/api-multilogin/playwright-automation-example)  
- [Start profile (Launcher v2)](https://multilogin.com/help/en_US/postman/starting-a-profile-with-postman)  
- [Postman API documenter](https://documenter.getpostman.com/view/28533318/2s946h9Cv9)  
- Our map: [Multilogin X API](https://antidetect-automation.github.io/guides/mlx-api/)

## Prerequisites

- Multilogin agent/app **running** (Launcher fails without it)  
- `folder_id` + `profile_id`  
- Node 18+ and Playwright  
- Password sent as **MD5 hex** on sign-in (per Multilogin’s samples)  
- Proxy/TZ coherent if you care about ads platforms  

## Flow (matches Multilogin’s sample)

```text
1. POST https://api.multilogin.com/user/signin
   { "email": "...", "password": "<md5 hex>" }
   → data.token   (~30 min; refresh or automation token)

2. GET https://launcher.mlx.yt:45001/api/v2/profile/f/{folder_id}/p/{profile_id}/start
     ?automation_type=playwright&headless_mode=false
   Authorization: Bearer {token}
   → data.port

3. playwright.chromium.connectOverCDP(`http://127.0.0.1:${port}`)

4. Use the existing context — don’t invent chromium.launch()

5. Stop via Launcher when done (browser.close() ≠ Multilogin stop)
```

Hosts/paths can change — if you 404, open the official **Launcher** folder before rewriting your script.

## Minimal connect

```js
import { chromium } from "playwright";

const browserURL = `http://127.0.0.1:${portFromLauncher}`;
const browser = await chromium.connectOverCDP(browserURL, { timeout: 10_000 });
const context = browser.contexts()[0];
const page = context.pages()[0] || await context.newPage();
await page.goto("https://example.com");
```

Starter kit (Mode A: `CDP_URL`, Mode B: sign-in + Launcher):  
[playwright-mlx-starter](https://github.com/antidetect-automation/playwright-mlx-starter)

## When connect fails

- App not running → no port  
- Missing `automation_type=playwright` → no automation port  
- Token expired → [token errors](https://antidetect-automation.github.io/errors/token-auth/)  
- Stale CDP → [CDP attach desk](https://antidetect-automation.github.io/errors/cdp-attach/)

Longer guide: [Playwright + Multilogin X](https://antidetect-automation.github.io/guides/playwright-mlx/)  
Browser coupon **`SAAS50`** · Cloud Phone **`MIN50`**: [Telegram](https://t.me/antidetect_automation_bot?start=devto_playwright)

**Affiliate disclosure:** we may earn a commission via Multilogin codes/links. Not Multilogin Support. No “undetectable” claims.
