/**
 * Puppeteer + Multilogin X starter
 * Mode A — CDP_URL known  |  Mode B — MD5 sign-in + Launcher (automation_type=puppeteer)
 * Guide: https://antidetect-automation.github.io/guides/puppeteer-mlx/
 * Official Postman: https://documenter.getpostman.com/view/28533318/2s946h9Cv9
 */
import puppeteer from "puppeteer-core";
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
    throw new Error("Set MLX_TOKEN or MLX_EMAIL + MLX_PASSWORD");
  }
  const res = await fetch(MLX_SIGNIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: MLX_EMAIL, password: md5(MLX_PASSWORD) }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Sign-in ${res.status}: ${JSON.stringify(body)}`);
  const token = body?.data?.token;
  if (!token) throw new Error("Missing data.token");
  return token;
}

async function startProfile(token) {
  if (!MLX_FOLDER_ID || !MLX_PROFILE_ID) {
    throw new Error("Set MLX_FOLDER_ID and MLX_PROFILE_ID");
  }
  const q = new URLSearchParams({
    automation_type: "puppeteer",
    headless_mode: HEADLESS === "true" ? "true" : "false",
  });
  const url = `${MLX_LAUNCHER_BASE}/api/v2/profile/f/${MLX_FOLDER_ID}/p/${MLX_PROFILE_ID}/start?${q}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Launcher ${res.status}: ${JSON.stringify(body)} — is Multilogin app running?`);
  }
  const port = body?.data?.port;
  if (!port) throw new Error(`No data.port: ${JSON.stringify(body)}`);
  return `http://127.0.0.1:${port}`;
}

async function resolveBrowserURL() {
  if (CDP_URL) {
    return CDP_URL.replace(/^ws:/, "http:").replace(/\/devtools.*$/, "");
  }
  if (MLX_FOLDER_ID && MLX_PROFILE_ID) {
    const token = await signIn();
    console.log("Starting profile via Launcher (puppeteer)…");
    return startProfile(token);
  }
  console.error(`
Missing CDP_URL (or MLX_FOLDER_ID + MLX_PROFILE_ID).
Guide: https://antidetect-automation.github.io/guides/puppeteer-mlx/
Deal: https://t.me/antidetect_automation_bot?start=aa_kit_puppeteer
`);
  process.exit(1);
}

async function main() {
  const browserURL = await resolveBrowserURL();
  console.log("Connecting:", browserURL);
  const browser = await puppeteer.connect({
    browserURL,
    defaultViewport: null,
  });
  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());
  await page.goto(TARGET_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  console.log("OK", await page.title(), page.url());
  console.log("Stop the Multilogin profile via Launcher/UI when finished.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
