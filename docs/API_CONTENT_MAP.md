# Multilogin X API → content / SEO map

Source of truth for endpoints: [Official Postman documenter](https://documenter.getpostman.com/view/28533318/2s946h9Cv9)  
Supporting help: [Configure Postman](https://multilogin.com/help/en_US/configure-postman-for-multilogin) · [Start profile](https://multilogin.com/help/en_US/postman/starting-a-profile-with-postman) · [Playwright example](https://multilogin.com/help/en_US/api-multilogin/playwright-automation-example)

**Repo freeze:** no new GitHub repos. Pages live under `site/`; kits under `kits/` or existing PW/PP mirrors.

## Official collection folders (what we cover)

| API domain | Operator need | Our URL |
|------------|---------------|---------|
| Profile Access Management (sign-in, refresh, automation token) | Auth / 401 hell | `/guides/api-auth-mlx/` · `/errors/token-auth/` |
| Launcher (start/stop profile, automation_type, port) | CDP attach | `/guides/playwright-mlx/` · `/guides/postman-mlx/` · `/errors/cdp-attach/` |
| Profile Management (create/search/update/remove) | Farm ops | `/guides/mlx-api/` · use-cases |
| Proxy | Geo match | `/guides/mlx-proxy/` · `/errors/proxy-mlx/` · `/tools/proxy-format/` |
| Browser Profile Data / Pre-made Cookies | Warmth | `/guides/cookies-sessions/` · `/guides/profile-warmup/` |
| Folders / PAM team access | Agencies | `/guides/mlx-api/` · Business plan notes on `/pricing/` |
| Script Runner / bookmarks / object storage | Power users | Point to official docs from `/guides/mlx-api/` |

## Audience → search intent → page

| Who | Queries (EN / mixed) | Page |
|-----|----------------------|------|
| Media buyers / MMO ads | facebook ads multilogin, antidetect ads accounts, multi ad accounts browser | `/use-cases/ads-multi-account/` · `/use-cases/facebook-ads/` |
| Google Abs / agencies | google ads multilogin, antidetect google ads | `/use-cases/google-ads/` |
| Affiliates / arbitrage | affiliate antidetect, multi account affiliate | `/use-cases/affiliate/` |
| Automation / MMO tech | multilogin api playwright, mlx start profile, postman multilogin | `/guides/playwright-mlx/` · `/guides/postman-mlx/` · `/guides/mlx-api/` |
| Cheap trial seekers | multilogin free, multilogin price, saas50 | `/pricing/` · `/deal/` · `/faq/` |
| Competitor switchers | multilogin vs adspower / gologin / dolphin / octo | `/vs/*` essays |

## Accuracy rule
Never invent request bodies. Quote patterns from Multilogin help (launcher host, `folder_id`/`profile_id`, MD5 password, 30‑minute token) and always tell readers to re-check the Postman documenter when paths change.
