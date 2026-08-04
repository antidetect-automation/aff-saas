"""
Selenium attach sketch for Multilogin X.
Start the profile first, set CDP_HTTP to the debugger HTTP endpoint.
"""
import os
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

load_dotenv()

CDP_HTTP = os.getenv("CDP_HTTP", "").rstrip("/")
TARGET_URL = os.getenv("TARGET_URL", "https://example.com")


def main() -> None:
    if not CDP_HTTP:
        raise SystemExit(
            "Set CDP_HTTP in .env after starting a Multilogin profile.\n"
            "https://antidetect-automation.github.io/guides/playwright-mlx/"
        )

    opts = Options()
    opts.add_experimental_option("debuggerAddress", CDP_HTTP.replace("http://", "").replace("https://", ""))
    driver = webdriver.Chrome(options=opts)
    driver.get(TARGET_URL)
    print("OK", driver.title, driver.current_url)
    print("Stop the Multilogin profile when finished.")


if __name__ == "__main__":
    main()
