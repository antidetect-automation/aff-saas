/**
 * Playwright + Multilogin X starter
 *
 * Mode A — CDP_URL already known (profile started via Postman/launcher)
 * Mode B — stub hooks where you plug current MLX HTTP start/stop calls
 *
 * Docs: https://antidetect-automation.github.io/guides/playwright-mlx/
 * Official: https://multilogin.com/help/en_US/getting-started-with-multilogin-x-automation/multilogin-x-api-beginners-guide
 */
import { chromium } from "playwright";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const p = resolve(process.cwd(), ".env");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m || process.env[m[1]]) continue;
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

loadEnv();

const {
  CDP_URL,
  TARGET_URL = "https://example.com",
  HEADLESS = "false",
} = process.env;

async function main() {
  if (!CDP_URL) {
    console.log(`
Missing CDP_URL.

1) Start a Multilogin X profile (UI / Postman / API).
2) Copy the remote debugging address from the start response.
3) Put it in .env as CDP_URL=http://127.0.0.1:PORT

Or follow: https://antidetect-automation.github.io/guides/playwright-mlx/
Deal desk: https://t.me/antidetect_automation_bot?start=aa_kit_pw
`);
    process.exit(1);
  }

  console.log("Connecting over CDP:", CDP_URL);
  const browser = await chromium.connectOverCDP(CDP_URL);
  const context = browser.contexts()[0] || (await browser.newContext());
  const page = context.pages()[0] || (await context.newPage());

  await page.goto(TARGET_URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
  console.log("OK title:", await page.title());
  console.log("OK url:", page.url());

  if (HEADLESS === "demo-wait") {
    await page.waitForTimeout(5000);
  }

  console.log("Done. Stop the Multilogin profile when finished (do not rely on browser.close()).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
