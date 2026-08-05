/**
 * Multilogin blog → AI commentary digest (Cloudflare cron-safe).
 * Uses official RSS only. Does NOT republish Multilogin body copy.
 */
const FEED = "https://multilogin.com/blog/feed";
const HUB = "https://antidetect-automation.github.io";
const BOT = "https://t.me/antidetect_automation_bot";

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

function topicOk(item) {
  if (DENY_TITLE.test(item.title)) return false;
  const blob = `${item.title} ${item.categories.join(" ")}`;
  return ALLOW_CAT.test(blob);
}

async function writeCommentary(env, item) {
  const prompt = [
    "You write short Multilogin-desk commentary for antidetect-automation (affiliate hub).",
    "Rules: do NOT copy Multilogin's wording; 120-180 words max; no undetectable/never-ban claims;",
    "mention when Cloud Phone vs browser / SAAS50 vs MIN50 might matter if relevant;",
    "end with one practical next step pointing readers to our hub paths.",
    "",
    `Title: ${item.title}`,
    `Categories: ${item.categories.join(", ") || "n/a"}`,
    `RSS blurb: ${item.summary}`,
    "",
    "Write plain text paragraphs only.",
  ].join("\n");

  const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
    messages: [
      {
        role: "system",
        content:
          "Concise Multilogin ops commentator. Original wording only. Affiliate desk, not Multilogin Support.",
      },
      { role: "user", content: prompt },
    ],
    max_tokens: 280,
  });
  const text =
    (typeof result === "string" ? result : result?.response || "") ||
    `${item.title} — see Multilogin’s post and our deal desk for SAAS50 / MIN50.`;
  return String(text).slice(0, 1600).trim();
}

async function tgSend(env, chatId, text, replyMarkup) {
  if (!env.BOT_TOKEN || !chatId) return null;
  const body = {
    chat_id: chatId,
    text,
    disable_web_page_preview: false,
    reply_markup: replyMarkup,
  };
  const res = await fetch(
    `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  return res.json();
}

/**
 * Run at most once per hour unless force=true.
 * Stores drafts in KV; optional Telegram notify via DIGEST_CHAT_ID secret.
 */
export async function runMlxBlogDigest(env, { force = false, limit = 2 } = {}) {
  if (!env.LEADS) return { ok: false, reason: "no_kv" };
  if (!env.AI) return { ok: false, reason: "no_ai" };

  const hourKey = new Date().toISOString().slice(0, 13);
  if (!force) {
    const last = await env.LEADS.get("digest:last_hour");
    if (last === hourKey) return { ok: true, skipped: "hour_budget" };
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

  const items = parseRssItems(xml).filter(topicOk);
  const created = [];
  const errors = [];
  for (const item of items) {
    if (created.length >= limit) break;
    const seenKey = `digest:seen:${item.guid}`;
    if (!force && (await env.LEADS.get(seenKey))) continue;

    let body;
    try {
      body = await writeCommentary(env, item);
    } catch (e) {
      console.error("digest ai", e);
      errors.push({ title: item.title, error: String(e) });
      // still publish a stub so the pipeline is observable
      body = `${item.title}\n\nMultilogin published a related post. Commentary AI was busy — read the source, then grab SAAS50 / MIN50 on our deal desk if you need browser or Cloud Phone seats.\n\nHub: ${HUB}/deal/`;
    }

    const record = {
      title: item.title,
      source: item.link,
      categories: item.categories,
      body,
      created_at: new Date().toISOString(),
      hub: `${HUB}/deal/`,
    };

    await env.LEADS.put(seenKey, "1", { expirationTtl: 60 * 60 * 24 * 120 });
    await env.LEADS.put(
      `digest:item:${encodeURIComponent(item.guid).slice(0, 200)}`,
      JSON.stringify(record),
      { expirationTtl: 60 * 60 * 24 * 90 }
    );

    let latest = [];
    try {
      latest = JSON.parse((await env.LEADS.get("digest:latest")) || "[]");
    } catch {
      latest = [];
    }
    latest.unshift(record);
    await env.LEADS.put("digest:latest", JSON.stringify(latest.slice(0, 25)));

    const msg = [
      "MLX desk note (commentary — not a Multilogin reprint)",
      "",
      item.title,
      "",
      body.slice(0, 900),
      "",
      `Source: ${item.link}`,
      `Deal desk: ${BOT}?start=aa_digest`,
      `Hub: ${HUB}/deal/`,
      "",
      "Affiliate disclosure: SAAS50 / MIN50 may earn us a commission.",
    ].join("\n");

    if (env.DIGEST_CHAT_ID) {
      try {
        await tgSend(env, env.DIGEST_CHAT_ID, msg, {
          inline_keyboard: [
            [
              { text: "Read Multilogin", url: item.link },
              { text: "SAAS50 / MIN50", url: `${BOT}?start=aa_digest` },
            ],
            [
              { text: "Pricing", url: `${HUB}/pricing/` },
              { text: "Deal", url: `${HUB}/deal/` },
            ],
          ],
        });
      } catch (e) {
        errors.push({ title: item.title, notify: String(e) });
      }
    }

    created.push({ title: item.title, link: item.link });
  }

  await env.LEADS.put("digest:last_hour", hourKey);
  await env.LEADS.put(
    "digest:last_run",
    JSON.stringify({ at: new Date().toISOString(), created: created.length, errors })
  );

  return { ok: true, created, scanned: items.length, errors };
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
