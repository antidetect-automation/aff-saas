/**
 * Playwright + Multilogin X starter
 *
 * Mode A — CDP_URL only (profile already started via UI/Postman)
 * Mode B — sign-in + Launcher start (official Multilogin Playwright pattern)
 *
 * Official:
 * https://multilogin.com/help/en_US/api-multilogin/playwright-automation-example
 * https://documenter.getpostman.com/view/28533318/2s946h9Cv9
 *
 * Hub: https://antidetect-automation.github.io/guides/playwright-mlx/
 */
import { chromium } from "playwright";
import { createHash } from "node:crypto";
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
  MLX_EMAIL,
  MLX_PASSWORD,
  MLX_TOKEN,
  MLX_FOLDER_ID,
  MLX_PROFILE_ID,
  MLX_SIGNIN_URL = "https://api.multilogin.com/user/signin",
  MLX_LAUNCHER_BASE = "https://launcher.mlx.yt:45001",
  TARGET_URL = "https://example.com",
  HEADLESS = "false",
} = process.env;

function md5(s) {
  return createHash("md5").update(String(s), "utf8").digest("hex");
}

async function signIn() {
  if (MLX_TOKEN) return MLX_TOKEN;
  if (!MLX_EMAIL || !MLX_PASSWORD) {
    throw new Error("Set MLX_TOKEN or MLX_EMAIL + MLX_PASSWORD for Launcher start");
  }
  const res = await fetch(MLX_SIGNIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: MLX_EMAIL, password: md5(MLX_PASSWORD) }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Sign-in failed ${res.status}: ${JSON.stringify(body)}`);
  }
  const token = body?.data?.token;
  if (!token) throw new Error("Sign-in OK but data.token missing — check Multilogin docs");
  return token;
}

async function startProfile(token) {
  if (!MLX_FOLDER_ID || !MLX_PROFILE_ID) {
    throw new Error("Set MLX_FOLDER_ID and MLX_PROFILE_ID");
  }
  const q = new URLSearchParams({
    automation_type: "playwright",
    headless_mode: HEADLESS === "true" ? "true" : "false",
  });
  const url = `${MLX_LAUNCHER_BASE}/api/v2/profile/f/${MLX_FOLDER_ID}/p/${MLX_PROFILE_ID}/start?${q}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `Launcher start failed ${res.status}: ${JSON.stringify(body)} — is Multilogin app running?`
    );
  }
  const port = body?.data?.port;
  if (!port) throw new Error(`No data.port in start response: ${JSON.stringify(body)}`);
  return `http://127.0.0.1:${port}`;
}

async function resolveCdpUrl() {
  if (CDP_URL) return CDP_URL;
  if (MLX_FOLDER_ID && MLX_PROFILE_ID) {
    const token = await signIn();
    console.log("Starting profile via Launcher…");
    return startProfile(token);
  }
  console.log(`
Missing CDP_URL (or MLX_FOLDER_ID + MLX_PROFILE_ID).

Mode A: Start profile in UI/Postman, set CDP_URL=http://127.0.0.1:PORT
Mode B: Set MLX_EMAIL, MLX_PASSWORD, MLX_FOLDER_ID, MLX_PROFILE_ID
        (Multilogin agent must be running; Pro+ API)

Guide: https://antidetect-automation.github.io/guides/playwright-mlx/
Official: https://multilogin.com/help/en_US/api-multilogin/playwright-automation-example
Deal: https://t.me/antidetect_automation_bot?start=aa_kit_pw
`);
  process.exit(1);
}

async function main() {
  const browserURL = await resolveCdpUrl();
  console.log("Connecting over CDP:", browserURL);
  const browser = await chromium.connectOverCDP(browserURL, { timeout: 15_000 });
  const context = browser.contexts()[0] || (await browser.newContext());
  const page = context.pages()[0] || (await context.newPage());

  await page.goto(TARGET_URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
  console.log("OK title:", await page.title());
  console.log("OK url:", page.url());
  console.log("Done. Stop the Multilogin profile via Launcher/UI when finished.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
