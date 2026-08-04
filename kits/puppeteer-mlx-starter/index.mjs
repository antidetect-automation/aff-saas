import puppeteer from "puppeteer-core";
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

const { CDP_URL, TARGET_URL = "https://example.com" } = process.env;

async function main() {
  if (!CDP_URL) {
    console.error("Set CDP_URL in .env (start Multilogin profile first)");
    console.error("https://antidetect-automation.github.io/guides/playwright-mlx/");
    process.exit(1);
  }
  const browser = await puppeteer.connect({
    browserURL: CDP_URL.replace(/^ws:/, "http:").replace(/\/devtools.*$/, ""),
    defaultViewport: null,
  });
  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());
  await page.goto(TARGET_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  console.log("OK", await page.title(), page.url());
  console.log("Stop profile via Multilogin when done.");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
