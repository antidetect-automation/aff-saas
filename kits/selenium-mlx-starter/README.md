# Selenium + Multilogin X (monorepo kit)

Prefer Playwright for new CDP work. This kit exists for desks stuck on Selenium.

Mode A: `SELENIUM_URL=http://127.0.0.1:PORT` after Launcher start.  
Mode B: sign-in + Launcher with `automation_type=selenium`.

Guide: https://antidetect-automation.github.io/guides/selenium-mlx/  
Deal: https://t.me/antidetect_automation_bot?start=aa_kit_selenium

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt  # or selenium requests python-dotenv
cp .env.example .env
python main.py
```

Stays in `aff-saas` — no new public GitHub repo.
