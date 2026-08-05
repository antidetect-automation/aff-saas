/**
 * Multilogin blog → AI commentary → Telegram channel (1×/day).
 * Official RSS only. Does NOT republish Multilogin’s full article body.
 * Dedupe forever by source URL in KV (digest:posted:*).
 */
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
  const tags = new Set(["#multilogin", "#antidetect", "#antidetectbrowser", "#multiaccount"]);
  const map = [
    [/facebook|meta|bm\b/, ["#facebookads", "#metaads", "#mediabuying"]],
    [/google\s*ads|mcc/, ["#googleads", "#ppcm"]],
    [/cloud\s*phone|android/, ["#cloudphone", "#androidfarm", "#MIN50"]],
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
  tags.add("#SAAS50");
  return [...tags].slice(0, 12).join(" ");
}

function topicOk(item) {
  if (DENY_TITLE.test(item.title)) return false;
  const blob = `${item.title} ${item.categories.join(" ")}`;
  return ALLOW_CAT.test(blob);
}

async function writeCommentary(env, item) {
  const tags = nicheHashtags(item);
  const system = [
    "You write Telegram channel posts for antidetect-automation, a Multilogin affiliate desk.",
    "ORIGINAL ops commentary only. Never mirror Multilogin’s blog wording or structure.",
    "Never promise free Multilogin trials, free forever seats, undetectable, or never-ban.",
    "Facts you MAY state: Free plan = 5 profiles (no API); Pro needed for API; coupons SAAS50 (browser) and MIN50 (Cloud Phone) via OUR Telegram bot.",
    "Telegram SEO: first line must include Multilogin + a niche keyword (ads, Cloud Phone, Playwright, proxy, affiliate).",
    "No URLs in body. Buttons carry links. No “read the Multilogin blog” / source links.",
  ].join(" ");

  const prompt = [
    "Write a Telegram post in English, 110–150 words.",
    "",
    "FORMAT:",
    "1) Headline line with keywords (Multilogin + niche).",
    "2) Blank line.",
    "3) 2 sentences: why media-buyers / multi-account desks care (our desk voice).",
    "4) Exactly 3 bullets starting with • (proxy, warmup/cookies, browser vs Cloud Phone or API/Pro).",
    "5) CTA: message our Telegram bot for SAAS50 or MIN50, then open Multilogin via our partner button.",
    "6) Final line EXACTLY:",
    tags,
    "",
    "Inspiration title only (do not rewrite their article):",
    item.title,
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
      `Multilogin Cloud Phone vs browser — desk note`,
      "",
      "Free marketing pages and free tiers are different things. For money lanes, pick the product that matches the surface (Android app vs Chromium), then isolate profiles properly.",
      "",
      "• Cloud Phone path → ask our bot for MIN50",
      "• Browser / ads / Playwright → SAAS50 (Pro if you need API)",
      "• Sticky proxy + warmup before spend",
      "",
      "Get codes on Telegram, then Multilogin via our partner button.",
      "",
      tags,
    ].join("\n");
  text = String(text).trim();
  if (!text.includes("#multilogin")) text = `${text}\n\n${tags}`;
  return text.slice(0, 1900);
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
 * Once per UTC day (unless force). Posts at most `limit` NEW articles (default 1).
 * Marks link in KV only after Telegram succeeds → no duplicate channel spam.
 */
export async function runMlxBlogDigest(env, { force = false, limit = 1 } = {}) {
  if (!env.LEADS) return { ok: false, reason: "no_kv" };
  if (!env.AI) return { ok: false, reason: "no_ai" };

  const dayKey = new Date().toISOString().slice(0, 10);
  if (!force) {
    const last = await env.LEADS.get("digest:last_day");
    if (last === dayKey) return { ok: true, skipped: "day_budget", day: dayKey };
  }

  let xml;
  try {
    const res = await fetch(FEED, {
      headers: {
        "User-Agent": "aa-mlx-digest/1.0 (+https://antidetect-automation.github.io)",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
    });
    if (!res.ok) return { ok: false, reason: `feed_${res.status}` };
    xml = await res.text();
  } catch (e) {
    return { ok: false, reason: String(e) };
  }

  const chatId = String(env.DIGEST_CHAT_ID || DEFAULT_CHANNEL);
  const items = parseRssItems(xml).filter(topicOk);
  const created = [];
  const errors = [];
  const skippedDup = [];

  for (const item of items) {
    if (created.length >= limit) break;

    const pKey = postedKey(item.link);
    if (await env.LEADS.get(pKey)) {
      skippedDup.push(item.link);
      continue;
    }
    // also honor legacy guid keys
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
        item.title,
        "",
        "Multilogin published a relevant ops post. We write our own desk notes — not reprints.",
        "",
        "• Browser automation / ads lanes → coupon SAAS50",
        "• Cloud Phone / Android lanes → coupon MIN50",
        "",
        "Open the Telegram bot for codes, then check hub pricing before you scale.",
      ].join("\n");
    }

    const tags = nicheHashtags(item);
    let postBody = body.slice(0, 1200);
    if (!postBody.includes("#multilogin")) postBody = `${postBody}\n\n${tags}`;

    const msg = [
      postBody,
      "",
      "———",
      `Bot codes: ${BOT}?start=aa_digest`,
      `Multilogin: ${AFF}`,
      `Hub: ${HUB}/deal/`,
      "",
      "Affiliate disclosure: SAAS50 / MIN50 / a_aid=saas may earn a commission. Not Multilogin Support.",
    ].join("\n");

    let tg;
    try {
      tg = await tgSend(env, chatId, msg, {
        inline_keyboard: [
          [
            { text: "📲 SAAS50 / MIN50", url: `${BOT}?start=aa_digest` },
            { text: "Multilogin", url: AFF },
          ],
          [
            { text: "Deal desk", url: `${HUB}/deal/` },
            { text: "Pricing notes", url: `${HUB}/pricing/` },
          ],
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
      // Do NOT mark posted — retry next day
      continue;
    }

    // Persist link forever ( ~2y TTL; refreshed on touch conceptually via long TTL )
    await env.LEADS.put(
      pKey,
      JSON.stringify({
        link: item.link,
        title: item.title,
        posted_at: new Date().toISOString(),
        chat_id: chatId,
        message_id: tg.result?.message_id,
      }),
      { expirationTtl: 60 * 60 * 24 * 730 }
    );
    await env.LEADS.put(guidKey, "1", { expirationTtl: 60 * 60 * 24 * 730 });

    const record = {
      title: item.title,
      source: item.link,
      categories: item.categories,
      body,
      created_at: new Date().toISOString(),
      hub: `${HUB}/deal/`,
      channel: chatId,
    };
    let latest = [];
    try {
      latest = JSON.parse((await env.LEADS.get("digest:latest")) || "[]");
    } catch {
      latest = [];
    }
    latest.unshift(record);
    await env.LEADS.put("digest:latest", JSON.stringify(latest.slice(0, 40)));

    created.push({ title: item.title, link: item.link, message_id: tg.result?.message_id });
  }

  // Only consume day budget if we posted OR there was nothing new (avoid blocking retries on TG fail)
  if (created.length > 0 || (skippedDup.length > 0 && errors.length === 0 && created.length === 0)) {
    await env.LEADS.put("digest:last_day", dayKey);
  }
  // If all candidates failed TG, don't set last_day so cron retries later today

  await env.LEADS.put(
    "digest:last_run",
    JSON.stringify({
      at: new Date().toISOString(),
      day: dayKey,
      created: created.length,
      skipped_dup: skippedDup.length,
      errors: errors.length,
      chat_id: chatId,
    })
  );

  return {
    ok: true,
    day: dayKey,
    chat_id: chatId,
    created,
    scanned: items.length,
    skipped_dup: skippedDup.slice(0, 10),
    errors,
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
