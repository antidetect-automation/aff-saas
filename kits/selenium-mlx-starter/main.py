"""
Selenium + Multilogin X starter
Mode A — SELENIUM_URL already known (Launcher returned port)
Mode B — MD5 sign-in + Launcher start with automation_type=selenium

Official:
https://multilogin.com/help/en_US/puppeteer-selenium-and-playwright/selenium-automation-example
Guide: https://antidetect-automation.github.io/guides/selenium-mlx/
"""
from __future__ import annotations

import hashlib
import os
import sys

import requests
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

load_dotenv()

SELENIUM_URL = os.getenv("SELENIUM_URL", "").rstrip("/")
CDP_HTTP = os.getenv("CDP_HTTP", "").rstrip("/")  # alias accepted
MLX_EMAIL = os.getenv("MLX_EMAIL", "")
MLX_PASSWORD = os.getenv("MLX_PASSWORD", "")
MLX_TOKEN = os.getenv("MLX_TOKEN", "")
MLX_FOLDER_ID = os.getenv("MLX_FOLDER_ID", "")
MLX_PROFILE_ID = os.getenv("MLX_PROFILE_ID", "")
MLX_SIGNIN_URL = os.getenv("MLX_SIGNIN_URL", "https://api.multilogin.com/user/signin")
MLX_LAUNCHER_BASE = os.getenv("MLX_LAUNCHER_BASE", "https://launcher.mlx.yt:45001")
TARGET_URL = os.getenv("TARGET_URL", "https://example.com")
HEADLESS = os.getenv("HEADLESS", "false").lower() == "true"


def sign_in() -> str:
    if MLX_TOKEN:
        return MLX_TOKEN
    if not MLX_EMAIL or not MLX_PASSWORD:
        raise SystemExit("Set MLX_TOKEN or MLX_EMAIL + MLX_PASSWORD")
    payload = {
        "email": MLX_EMAIL,
        "password": hashlib.md5(MLX_PASSWORD.encode()).hexdigest(),
    }
    r = requests.post(
        MLX_SIGNIN_URL,
        json=payload,
        headers={"Accept": "application/json", "Content-Type": "application/json"},
        timeout=60,
    )
    if r.status_code != 200:
        raise SystemExit(f"Sign-in failed {r.status_code}: {r.text}")
    token = (r.json().get("data") or {}).get("token")
    if not token:
        raise SystemExit(f"No data.token: {r.text}")
    return token


def start_profile(token: str) -> str:
    if not MLX_FOLDER_ID or not MLX_PROFILE_ID:
        raise SystemExit("Set MLX_FOLDER_ID and MLX_PROFILE_ID")
    url = (
        f"{MLX_LAUNCHER_BASE}/api/v2/profile/f/{MLX_FOLDER_ID}/p/{MLX_PROFILE_ID}/start"
        f"?automation_type=selenium&headless_mode={'true' if HEADLESS else 'false'}"
    )
    r = requests.get(
        url,
        headers={"Accept": "application/json", "Authorization": f"Bearer {token}"},
        timeout=90,
    )
    if r.status_code != 200:
        raise SystemExit(
            f"Launcher start failed {r.status_code}: {r.text}\n"
            "Is Multilogin app running? Pro+ API required."
        )
    port = (r.json().get("data") or {}).get("port")
    if not port:
        raise SystemExit(f"No data.port: {r.text}")
    return f"http://127.0.0.1:{port}"


def resolve_executor() -> str:
    raw = SELENIUM_URL or CDP_HTTP
    if raw:
        return raw if raw.startswith("http") else f"http://{raw}"
    if MLX_FOLDER_ID and MLX_PROFILE_ID:
        print("Starting profile via Launcher (selenium)…")
        return start_profile(sign_in())
    raise SystemExit(
        "Set SELENIUM_URL or MLX_FOLDER_ID + MLX_PROFILE_ID.\n"
        "https://antidetect-automation.github.io/guides/selenium-mlx/\n"
        "Deal: https://t.me/antidetect_automation_bot?start=aa_kit_selenium"
    )


def main() -> None:
    executor = resolve_executor()
    print("Selenium remote:", executor)
    # Mimic profiles use Chromium options in Multilogin’s sample
    driver = webdriver.Remote(command_executor=executor, options=Options())
    driver.get(TARGET_URL)
    print("OK", driver.title, driver.current_url)
    print("Stop the Multilogin profile via Launcher/UI when finished.")


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as e:
        print(e, file=sys.stderr)
        raise SystemExit(1) from e
