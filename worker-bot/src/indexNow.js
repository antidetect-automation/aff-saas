/**
 * IndexNow + sitemap ping after a new public URL goes live.
 * IndexNow → Bing / Yandex / partners (fast).
 * Google → best effort via sitemap URL ping + keeping sitemap.xml current (GSC).
 */
const HOST = "antidetect-automation.github.io";
const BASE = `https://${HOST}`;
/** Public key file already served at /{KEY}.txt on github.io */
const DEFAULT_KEY = "2e9a2b92dae006c1d55c3ec540f6c505";

function indexNowKey(env) {
  return String(env.INDEXNOW_KEY || DEFAULT_KEY).trim();
}

/**
 * @param {string[]} urls absolute https URLs on our host
 */
export async function submitIndexNow(env, urls) {
  const key = indexNowKey(env);
  const list = [...new Set((urls || []).filter(Boolean))];
  if (!list.length) return { ok: false, skipped: "no_urls" };

  const payload = {
    host: HOST,
    key,
    keyLocation: `${BASE}/${key}.txt`,
    urlList: list.slice(0, 100),
  };

  const endpoints = [
    "https://api.indexnow.org/indexnow",
    "https://www.bing.com/indexnow",
  ];

  const results = [];
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
      });
      results.push({ endpoint: ep, status: res.status, ok: res.status >= 200 && res.status < 300 });
    } catch (e) {
      results.push({ endpoint: ep, ok: false, error: String(e) });
    }
  }

  return {
    ok: results.some((r) => r.ok),
    key_used: key.slice(0, 6) + "…",
    urls: list,
    results,
  };
}

/** Soft signal to Google that sitemap changed (endpoint is legacy; still cheap). */
export async function pingGoogleSitemap(sitemapUrl = `${BASE}/sitemap.xml`) {
  const u = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
  try {
    const res = await fetch(u, { method: "GET", redirect: "follow" });
    return { ok: res.status >= 200 && res.status < 400, status: res.status };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/**
 * After Pages publish: IndexNow the article (+ hub + sitemap) and ping Google sitemap.
 */
export async function notifySearchEngines(env, { pageUrl } = {}) {
  const urls = [
    pageUrl,
    `${BASE}/digest/`,
    `${BASE}/sitemap.xml`,
  ].filter(Boolean);

  const indexnow = await submitIndexNow(env, urls);
  const google = await pingGoogleSitemap();
  return { indexnow, google, notified_at: new Date().toISOString() };
}

/**
 * Flush KV-queued IndexNow after Pages sync (each cron minute).
 * Waits until the public URL returns 2xx (up to ~8 minutes).
 */
export async function flushPendingIndexNow(env) {
  if (!env.LEADS) return { ok: false, skipped: "no_kv" };
  const raw = await env.LEADS.get("digest:indexnow_pending");
  if (!raw) return { ok: true, skipped: "none" };
  let pending;
  try {
    pending = JSON.parse(raw);
  } catch {
    await env.LEADS.delete("digest:indexnow_pending");
    return { ok: false, skipped: "bad_json" };
  }
  const pageUrl = pending.pageUrl;
  if (!pageUrl) {
    await env.LEADS.delete("digest:indexnow_pending");
    return { ok: false, skipped: "no_url" };
  }

  let live = false;
  try {
    const res = await fetch(pageUrl, {
      method: "GET",
      headers: { "User-Agent": "aa-indexnow-check" },
      redirect: "follow",
    });
    live = res.status >= 200 && res.status < 400;
  } catch {
    live = false;
  }

  const tries = Number(pending.tries || 0) + 1;
  if (!live && tries < 8) {
    await env.LEADS.put(
      "digest:indexnow_pending",
      JSON.stringify({ ...pending, tries, last_check: new Date().toISOString() }),
      { expirationTtl: 60 * 60 * 24 }
    );
    return { ok: true, waiting_live: true, tries, pageUrl };
  }

  const search = await notifySearchEngines(env, { pageUrl });
  await env.LEADS.put(
    "digest:indexnow_last",
    JSON.stringify({ pageUrl, search, at: new Date().toISOString(), tries, live }),
    { expirationTtl: 60 * 60 * 24 * 30 }
  );
  await env.LEADS.delete("digest:indexnow_pending");
  return { ok: true, flushed: true, live, tries, search };
}
