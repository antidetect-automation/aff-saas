/**
 * Conceptual starter — update API endpoints to match current Multilogin X docs:
 * https://multilogin.com/help/en_US/getting-started-with-multilogin-x-automation/multilogin-x-api-beginners-guide
 * https://documenter.getpostman.com/view/28533318/2s946h9Cv9
 */
import { chromium } from "playwright";

const {
  MLX_TOKEN,
  MLX_PROFILE_ID,
  CDP_URL,
} = process.env;

async function main() {
  if (!CDP_URL && (!MLX_TOKEN || !MLX_PROFILE_ID)) {
    console.error("Set CDP_URL or MLX_TOKEN + MLX_PROFILE_ID in .env");
    process.exit(1);
  }

  // If you already started the profile via Postman / launcher, set CDP_URL.
  const endpoint = CDP_URL;
  if (!endpoint) {
    console.log(
      "Fill start-profile API call here using current MLX docs, then pass CDP endpoint."
    );
    console.log(
      "Guide: https://antidetect-automation.github.io/guides/playwright-mlx/"
    );
    process.exit(0);
  }

  const browser = await chromium.connectOverCDP(endpoint);
  const context = browser.contexts()[0] || (await browser.newContext());
  const page = context.pages()[0] || (await context.newPage());
  await page.goto("https://example.com", { waitUntil: "domcontentloaded" });
  console.log("title:", await page.title());
  // await browser.close(); // usually stop profile via MLX API instead
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
