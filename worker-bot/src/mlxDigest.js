/**
 * Multilogin RSS (+ AdsPower sitemap fallback) → AI desk commentary → Telegram + github.io.
 * Does NOT republish competitor/Multilogin article bodies. No competitor URLs in CTAs.
 */
import { publishDigestToGithub } from "./githubPublisher.js";
import { notifySearchEngines } from "./indexNow.js";
import { fetchAdsPowerCandidates } from "./competitorSources.js";

const FEED = "https://multilogin.com/blog/feed";
const HUB = "https://antidetect-automation.github.io";
const BOT = "https://t.me/antidetect_automation_bot";
/** Exact partner affiliate URL — do not add path/query except a_aid=saas */
const AFF = "https://multilogin.com?a_aid=saas";
/** Fallback if DIGEST_CHAT_ID secret missing */
const DEFAULT_CHANNEL = "-1004445803393";

const ALLOW_CAT =
  /ads|cloud phone|proxies|affiliate|web automation|browser fingerprint|cookie|multilogin update|product update|multiple accounting|review|guides/i;

const DENY_TITLE =
  /youtube downloader|tiktok story|shorts vs tiktok|watch tiktok from another|linkedin scraper|download linkedin contacts/i;

function stripHtml(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLink(url) {
  try {
    const u = new URL(String(url).trim());
    u.hash = "";
    let path = u.pathname.replace(/\/+$/, "") || "/";
    return `${u.origin}${path}`.toLowerCase();
  } catch {
    return String(url || "")
      .trim()
      .replace(/\/+$/, "")
      .toLowerCase();
  }
}

function postedKey(link) {
  return `digest:posted:${normalizeLink(link)}`;
}

function parseRssItems(xml) {
  const items = [];
  const blocks = xml.split(/<item>/i).slice(1);
  for (const block of blocks) {
    const chunk = block.split(/<\/item>/i)[0] || "";
    const title = (chunk.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/i) ||
      chunk.match(/<title>(.*?)<\/title>/i) || [])[1];
    const link = (chunk.match(/<link>(.*?)<\/link>/i) || [])[1];
    const guid = (chunk.match(/<guid[^>]*>(.*?)<\/guid>/i) || [])[1] || link;
    const desc = (chunk.match(
      /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i
    ) ||
      chunk.match(/<description>([\s\S]*?)<\/description>/i) ||
      [])[1];
    const cats = [...chunk.matchAll(/<category><!\[CDATA\[(.*?)\]\]><\/category>/gi)].map(
      (m) => m[1]
    );
    if (!title || !link) continue;
    items.push({
      title: stripHtml(title),
      link: link.trim(),
      guid: stripHtml(guid),
      summary: stripHtml(desc).slice(0, 600),
      categories: cats,
    });
  }
  return items;
}

function nicheHashtags(item) {
  const blob = `${item.title} ${(item.categories || []).join(" ")}`.toLowerCase();
  // Discovery tags only — never put coupon codes in hashtags
  const tags = new Set(["#multilogin", "#antidetect", "#antidetectbrowser", "#multiaccount"]);
  const map = [
    [/facebook|meta|bm\b/, ["#facebookads", "#metaads", "#mediabuying"]],
    [/google\s*ads|mcc/, ["#googleads", "#ppcm"]],
    [/cloud\s*phone|android/, ["#cloudphone", "#androidfarm"]],
    [/playwright|puppeteer|selenium|automation|cdp|api/, ["#playwright", "#browserautomation", "#mlxapi"]],
    [/prox/, ["#proxy", "#residentialproxy"]],
    [/cookie|warmup|warm-up|session/, ["#profilewarmup", "#cookies"]],
    [/affiliate|cpa|arbitrage/, ["#affiliatemarketing", "#cpa"]],
    [/social/, ["#socialmedia", "#socialaccounts"]],
    [/scrap/, ["#webscraping"]],
  ];
  for (const [re, hs] of map) {
    if (re.test(blob)) hs.forEach((h) => tags.add(h));
  }
  return [...tags].slice(0, 12).join(" ");
}

/** Strip AI coupon-hashtags; always end with our niche tag line. */
function finalizePostBody(raw, tags) {
  let t = String(raw || "")
    .replace(/#SAAS50\b/gi, "SAAS50")
    .replace(/#MIN50\b/gi, "MIN50")
    .trim();
  const lines = t.split("\n");
  let cut = lines.length;
  for (let i = lines.length - 1; i >= 0; i--) {
    const s = lines[i].trim();
    if (!s) continue;
    // hashtag-only line (discovery tags AI may invent)
    if (/^#[\w]+(?:\s+#[\w]+)*$/i.test(s)) {
      cut = i;
      continue;
    }
    break;
  }
  t = lines.slice(0, cut).join("\n").trim();
  return `${t}\n\n${tags}`.slice(0, 1400);
}

function topicOk(item) {
  if (DENY_TITLE.test(item.title)) return false;
  const blob = `${item.title} ${item.categories.join(" ")}`;
  return ALLOW_CAT.test(blob);
}

async function writeCommentary(env, item) {
  const isComp = item.source === "adspower";
  const system = [
    "You write Telegram channel posts for antidetect-automation, a Multilogin partner desk.",
    "ORIGINAL ops commentary only. Never paste or closely paraphrase any vendor’s marketing page.",
    "Never promise free Multilogin trials, free forever seats, undetectable, or never-ban.",
    "Facts you MAY state: Free plan = 5 profiles (no API); Pro needed for API.",
    "Deal facts: exclusive desk codes SAAS50 (browser) and MIN50 (Cloud Phone) ≈50% off via our Telegram bot.",
    "Telegram SEO: first line must include Multilogin + a niche keyword.",
    "No URLs in body. No hashtag lines. Never invent #SAAS50 or #MIN50.",
    isComp
      ? "Angle: a competitor (AdsPower) published on this topic — explain when Multilogin is the better desk fit (API/Playwright, Cloud Phone under one vendor, 2026 Free/Pro math). Be fair, not trash-talk. Do not name-drop long AdsPower feature lists."
      : "Angle: Multilogin-ecosystem ops note inspired by a Multilogin blog headline only.",
  ].join(" ");

  const prompt = [
    "Write a Telegram post in English, 110–150 words.",
    "",
    "FORMAT:",
    "1) Headline: Multilogin + niche keyword" +
      (isComp ? " (may mention vs AdsPower briefly)." : "."),
    "2) Blank line.",
    "3) 2 sentences desk voice.",
    "4) Exactly 3 bullets starting with • (proxy, warmup/cookies, browser vs Cloud Phone or API/Pro).",
    "5) CTA: bot for SAAS50 / MIN50 → Multilogin partner button at checkout.",
    "6) STOP. No hashtags. No competitor URLs.",
    "",
    isComp
      ? `Competitor headline (inspire only): ${item.title}`
      : `Inspiration title only: ${item.title}`,
    `Categories: ${item.categories.join(", ") || "n/a"}`,
    `Loose context (do not quote): ${item.summary.slice(0, 280)}`,
  ].join("\n");

  const result = await env.AI.run("@cf/meta/llama-3.2-3b-instruct", {
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
    max_tokens: 400,
  });
  let text =
    (typeof result === "string" ? result : result?.response || "") ||
    [
      isComp
        ? `Multilogin vs AdsPower — desk note for ops`
        : `Multilogin Cloud Phone vs browser — desk note`,
      "",
      isComp
        ? "When a competitor ships another how-to, check whether you actually need RPA habits or a scriptable Multilogin X + Cloud Phone stack under one bill."
        : "Free marketing pages and free tiers are different things. For money lanes, pick the product that matches the surface, then isolate profiles properly.",
      "",
      "• Browser / ads / Playwright → exclusive SAAS50 (~50% off; Pro if you need API)",
      "• Cloud Phone / Android → exclusive MIN50 (~50% off)",
      "• Sticky proxy + warmup before spend",
      "",
      "Tap the bot for your exclusive 50% code, then open Multilogin on the partner button.",
    ].join("\n");
  return String(text).trim().slice(0, 1800);
}

async function tgSend(env, chatId, text, replyMarkup) {
  if (!env.BOT_TOKEN || !chatId) return { ok: false, description: "missing token/chat" };
  const res = await fetch(
    `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: false,
        reply_markup: replyMarkup,
      }),
    }
  );
  return res.json();
}

/**
 * Once per UTC day (unless force). Posts at most `limit` NEW notes (default 1).
 * Priority: Multilogin RSS; if gap / forced → AdsPower sitemap (vs Multilogin angle).
 * No competitor URLs in public CTAs. KV mark only after Telegram succeeds.
 * @param {{ force?: boolean, limit?: number, source?: 'auto'|'multilogin'|'adspower' }} opts
 */
export async function runMlxBlogDigest(
  env,
  { force = false, limit = 1, source = "auto" } = {}
) {
  if (!env.LEADS) return { ok: false, reason: "no_kv" };
  if (!env.AI) return { ok: false, reason: "no_ai" };

  const dayKey = new Date().toISOString().slice(0, 10);
  if (!force) {
    const last = await env.LEADS.get("digest:last_day");
    if (last === dayKey) return { ok: true, skipped: "day_budget", day: dayKey };
  }

  const chatId = String(env.DIGEST_CHAT_ID || DEFAULT_CHANNEL);
  const created = [];
  const errors = [];
  const skippedDup = [];
  let queue = [];

  const wantMlx = source === "auto" || source === "multilogin";
  const wantAds = source === "auto" || source === "adspower";

  if (wantMlx) {
    try {
      const res = await fetch(FEED, {
        headers: {
          "User-Agent": "aa-mlx-digest/1.0 (+https://antidetect-automation.github.io)",
          Accept: "application/rss+xml, application/xml, text/xml",
        },
      });
      if (!res.ok) errors.push({ feed: `mlx_${res.status}` });
      else {
        const xml = await res.text();
        queue = queue.concat(
          parseRssItems(xml)
            .filter(topicOk)
            .map((it) => ({ ...it, source: "multilogin" }))
        );
      }
    } catch (e) {
      errors.push({ feed: String(e) });
    }
  }

  if (wantAds && (source === "adspower" || queue.length < 8)) {
    try {
      const ads = await fetchAdsPowerCandidates({ limit: 10 });
      queue = source === "adspower" ? ads : queue.concat(ads);
    } catch (e) {
      errors.push({ adspower: String(e) });
    }
  }

  for (const item of queue) {
    if (created.length >= limit) break;

    const pKey = postedKey(item.link);
    if (await env.LEADS.get(pKey)) {
      skippedDup.push(item.link);
      continue;
    }
    const guidKey = `digest:seen:${item.guid}`;
    if (await env.LEADS.get(guidKey)) {
      skippedDup.push(item.link);
      continue;
    }

    let body;
    try {
      body = await writeCommentary(env, item);
    } catch (e) {
      console.error("digest ai", e);
      errors.push({ title: item.title, error: String(e) });
      body = [
        item.source === "adspower"
          ? "Multilogin vs AdsPower — desk note"
          : item.title,
        "",
        "Ops commentary from our Multilogin partner desk — not a vendor reprint.",
        "",
        "• Browser / ads → exclusive SAAS50 (~50% off)",
        "• Cloud Phone → exclusive MIN50 (~50% off)",
        "",
        "Tap the bot for your exclusive 50% code, then open Multilogin on the partner button.",
      ].join("\n");
    }

    let tagLine = nicheHashtags(item);
    if (item.source === "adspower") {
      tagLine = [...new Set(`${tagLine} #adspower #compare`.split(/\s+/))]
        .slice(0, 12)
        .join(" ");
    }
    const postBody = finalizePostBody(body, tagLine);

    const msg = [
      postBody,
      "",
      "———",
      "🔥 Exclusive desk deal: ~50% off Multilogin",
      "• Browser → code SAAS50",
      "• Cloud Phone → code MIN50",
      "Tap the bot → grab your code → open Multilogin → paste at checkout.",
    ].join("\n");

    const row2 =
      item.source === "adspower"
        ? [
            { text: "vs AdsPower notes", url: `${HUB}/vs/adspower/` },
            { text: "Deal desk", url: `${HUB}/deal/` },
          ]
        : [
            { text: "How the deal works", url: `${HUB}/deal/` },
            { text: "Pricing math", url: `${HUB}/pricing/` },
          ];

    let tg;
    try {
      tg = await tgSend(env, chatId, msg, {
        inline_keyboard: [
          [
            { text: "🔥 Get 50% — SAAS50 / MIN50", url: `${BOT}?start=aa_digest` },
            { text: "Open Multilogin · apply code", url: AFF },
          ],
          row2,
        ],
      });
    } catch (e) {
      errors.push({ title: item.title, notify: String(e) });
      continue;
    }

    if (!tg?.ok) {
      errors.push({
        title: item.title,
        telegram: tg?.description || JSON.stringify(tg).slice(0, 200),
      });
      continue;
    }

    await env.LEADS.put(
      pKey,
      JSON.stringify({
        link: item.link,
        title: item.title,
        source: item.source || "multilogin",
        posted_at: new Date().toISOString(),
        chat_id: chatId,
        message_id: tg.result?.message_id,
      }),
      { expirationTtl: 60 * 60 * 24 * 730 }
    );
    await env.LEADS.put(guidKey, "1", { expirationTtl: 60 * 60 * 24 * 730 });

    let github = { ok: false, skipped: "not_attempted" };
    try {
      github = await publishDigestToGithub(env, {
        title: item.title,
        body: postBody,
        item,
      });
      if (github?.ok) {
        await env.LEADS.put(
          `digest:gh:${normalizeLink(item.link)}`,
          JSON.stringify({
            url: github.url,
            commit_sha: github.commit_sha,
            at: new Date().toISOString(),
          }),
          { expirationTtl: 60 * 60 * 24 * 730 }
        );
        await env.LEADS.put(
          "digest:indexnow_pending",
          JSON.stringify({
            pageUrl: github.url,
            tries: 0,
            at: new Date().toISOString(),
          }),
          { expirationTtl: 60 * 60 * 24 }
        );
        try {
          github.search = await notifySearchEngines(env, { pageUrl: github.url });
        } catch (e) {
          console.error("indexnow immediate", e);
          github.search = { ok: false, error: String(e) };
        }
      } else if (github?.error) {
        console.error("digest github", github.error);
        errors.push({ title: item.title, github: github.error });
      }
    } catch (e) {
      console.error("digest github", e);
      errors.push({ title: item.title, github: String(e) });
      github = { ok: false, error: String(e) };
    }

    const record = {
      title: item.title,
      source: item.link,
      feed: item.source || "multilogin",
      categories: item.categories,
      body: postBody,
      created_at: new Date().toISOString(),
      hub: `${HUB}/deal/`,
      channel: chatId,
      github_url: github?.url || null,
      github_ok: Boolean(github?.ok),
    };
    let latest = [];
    try {
      latest = JSON.parse((await env.LEADS.get("digest:latest")) || "[]");
    } catch {
      latest = [];
    }
    latest.unshift(record);
    await env.LEADS.put("digest:latest", JSON.stringify(latest.slice(0, 40)));

    created.push({
      title: item.title,
      link: item.link,
      feed: item.source || "multilogin",
      message_id: tg.result?.message_id,
      github_url: github?.url || null,
      github_ok: Boolean(github?.ok),
      github_error: github?.error || github?.skipped || null,
      search: github?.search || null,
    });
  }

  if (
    created.length > 0 ||
    (skippedDup.length > 0 && errors.length === 0 && created.length === 0)
  ) {
    await env.LEADS.put("digest:last_day", dayKey);
  }

  await env.LEADS.put(
    "digest:last_run",
    JSON.stringify({
      at: new Date().toISOString(),
      day: dayKey,
      created: created.length,
      skipped_dup: skippedDup.length,
      errors: errors.length,
      chat_id: chatId,
      source,
    })
  );

  return {
    ok: true,
    day: dayKey,
    chat_id: chatId,
    source,
    created,
    scanned: queue.length,
    skipped_dup: skippedDup.slice(0, 10),
    errors: errors.slice(0, 8),
  };
}

export async function latestDigests(env, n = 5) {
  if (!env.LEADS) return [];
  try {
    const latest = JSON.parse((await env.LEADS.get("digest:latest")) || "[]");
    return latest.slice(0, n);
  } catch {
    return [];
  }
}
