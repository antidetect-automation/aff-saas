# Playwright + Multilogin X

Start a Mimic profile, attach Playwright over CDP.

- Guide: https://antidetect-automation.github.io/guides/playwright-mlx/
- API map: https://antidetect-automation.github.io/guides/mlx-api/
- Official Playwright sample: https://multilogin.com/help/en_US/api-multilogin/playwright-automation-example
- Postman documenter: https://documenter.getpostman.com/view/28533318/2s946h9Cv9

## Setup

```bash
cp .env.example .env
npm install
```

**Mode A:** Start the profile in Multilogin UI or Postman, put `CDP_URL=http://127.0.0.1:PORT` in `.env`.

**Mode B:** Set `MLX_EMAIL`, `MLX_PASSWORD` (plain — script MD5-hashes like Multilogin’s sample), `MLX_FOLDER_ID`, `MLX_PROFILE_ID`. Leave `CDP_URL` empty. Multilogin agent must be running. API needs Pro+.

```bash
node index.mjs
```

Deal desk: https://t.me/antidetect_automation_bot?start=aa_kit_pw

Affiliate disclosure: we may earn a commission via Multilogin codes/links.
