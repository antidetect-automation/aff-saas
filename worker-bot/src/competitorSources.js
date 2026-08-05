/**
 * Competitor sources for desk digest (no official RSS on AdsPower).
 * Uses public sitemap → /blog/* URLs. Never put competitor URLs in public CTAs.
 */

const ADSP_SITEMAP = "https://www.adspower.com/__sitemap__/en-US.xml";
const UA =
  "aa-desk-digest/1.0 (+https://antidetect-automation.github.io; competitor-sitemap)";

const ALLOW =
  /antidetect|fingerprint|proxy|multi[- ]?account|facebook|meta ads|google ads|automation|rpa|api|playwright|puppeteer|browser|cloud phone|warmup|cookie|profile|media buy|affiliate|scrap/i;

const DENY =
  /youtube sign|tiktok success|taobao|music websites unblocked|reddit creator program|pinterest scraper|polymarket|instagram stories anonymous|passive income ideas|sell on facebook marketplace|smart logistics|outlook efficiently|reputation and reviews/i;

function slugToTitle(url) {
  try {
    const slug = new URL(url).pathname.split("/").filter(Boolean).pop() || "";
    return slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .replace(/\bAdspower\b/gi, "AdsPower")
      .replace(/\bApi\b/g, "API")
      .replace(/\bRpa\b/g, "RPA");
  } catch {
    return "AdsPower blog note";
  }
}

function parseSitemapBlog(xml) {
  const items = [];
  const blocks = String(xml || "").split(/<url>/i).slice(1);
  for (const block of blocks) {
    const chunk = block.split(/<\/url>/i)[0] || "";
    const loc = (chunk.match(/<loc>(.*?)<\/loc>/i) || [])[1];
    const lastmod = (chunk.match(/<lastmod>(.*?)<\/lastmod>/i) || [])[1] || "";
    if (!loc || !loc.includes("/blog/")) continue;
    if (/\/blog\/?$/.test(loc) || loc.includes("/blog-")) continue;
    items.push({
      link: loc.trim(),
      lastmod,
      title: slugToTitle(loc),
      guid: loc.trim(),
      summary: "",
      categories: ["AdsPower", "Competitor"],
      source: "adspower",
    });
  }
  items.sort((a, b) => String(b.lastmod).localeCompare(String(a.lastmod)));
  return items;
}

function topicOkCompetitor(item) {
  const blob = `${item.title} ${item.link}`;
  if (DENY.test(blob)) return false;
  return ALLOW.test(blob);
}

async function enrichMeta(item) {
  try {
    const res = await fetch(item.link, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      redirect: "follow",
    });
    if (!res.ok) return item;
    const html = await res.text();
    const og =
      (html.match(
        /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
      ) ||
        html.match(
          /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i
       ) ||
        [])[1];
    const desc =
      (html.match(
        /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
      ) ||
        html.match(
          /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i
        ) ||
        html.match(
          /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i
        ) ||
        [])[1];
    if (og) item.title = og.replace(/&#39;/g, "'").replace(/&amp;/g, "&").trim();
    if (desc)
      item.summary = desc
        .replace(/<[^>]+>/g, " ")
        .replace(/&mdash;/g, "—")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 400);
  } catch {
    /* keep slug title */
  }
  return item;
}

/**
 * Newest AdsPower blog candidates suitable for Multilogin desk commentary.
 */
export async function fetchAdsPowerCandidates({ limit = 12 } = {}) {
  const res = await fetch(ADSP_SITEMAP, {
    headers: { "User-Agent": UA, Accept: "application/xml,text/xml,*/*" },
  });
  if (!res.ok) throw new Error(`adsp_sitemap_${res.status}`);
  const xml = await res.text();
  const filtered = parseSitemapBlog(xml).filter(topicOkCompetitor).slice(0, limit);
  // Enrich only the first few (fetch cost)
  const out = [];
  for (const raw of filtered.slice(0, 5)) {
    out.push(await enrichMeta({ ...raw }));
  }
  return out;
}
