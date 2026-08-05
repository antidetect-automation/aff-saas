const HUB = "https://antidetect-automation.github.io";
const BOT_PUBLIC = "https://t.me/antidetect_automation_bot";
const DISCLOSURE =
  "Affiliate disclosure: if you buy Multilogin with our codes/links, we may earn a commission. We are not Multilogin Support.";

const LINKS = {
  deal: `${HUB}/deal/`,
  pricing: `${HUB}/pricing/`,
  vsHub: `${HUB}/vs/`,
  compare: `${HUB}/vs/adspower/`,
  gologin: `${HUB}/vs/gologin/`,
  dolphin: `${HUB}/vs/dolphin-anty/`,
  hidemium: `${HUB}/vs/hidemium/`,
  incogniton: `${HUB}/vs/incogniton/`,
  undetectable: `${HUB}/vs/undetectable/`,
  octo: `${HUB}/vs/octo-browser/`,
  linken: `${HUB}/vs/linken-sphere/`,
  morelogin: `${HUB}/vs/morelogin/`,
  bitbrowser: `${HUB}/vs/bitbrowser/`,
  kameleo: `${HUB}/vs/kameleo/`,
  vmlogin: `${HUB}/vs/vmlogin/`,
  vision: `${HUB}/vs/vision/`,
  blink: `${HUB}/vs/blink/`,
  guidesHub: `${HUB}/guides/`,
  guide: `${HUB}/guides/playwright-mlx/`,
  apiAuth: `${HUB}/guides/api-auth-mlx/`,
  mlxApi: `${HUB}/guides/mlx-api/`,
  mlxProxy: `${HUB}/guides/mlx-proxy/`,
  puppeteer: `${HUB}/guides/puppeteer-mlx/`,
  selenium: `${HUB}/guides/selenium-mlx/`,
  postman: `${HUB}/guides/postman-mlx/`,
  cookies: `${HUB}/guides/cookies-sessions/`,
  warmup: `${HUB}/guides/profile-warmup/`,
  useCases: `${HUB}/use-cases/`,
  ads: `${HUB}/use-cases/ads-multi-account/`,
  fbAds: `${HUB}/use-cases/facebook-ads/`,
  gAds: `${HUB}/use-cases/google-ads/`,
  affiliate: `${HUB}/use-cases/affiliate/`,
  start: `${HUB}/start/`,
  tools: `${HUB}/tools/`,
  webgl: `${HUB}/tools/webgl-check/`,
  proxy: `${HUB}/tools/proxy-format/`,
  fpcheck: `${HUB}/tools/fingerprint-checklist/`,
  uach: `${HUB}/tools/ua-ch-check/`,
  tz: `${HUB}/tools/timezone-locale/`,
  dns: `${HUB}/tools/dns-webrtc-check/`,
  errorsHub: `${HUB}/errors/`,
  errors: `${HUB}/errors/mlx-automation/`,
  proxyErr: `${HUB}/errors/proxy-mlx/`,
  cdpErr: `${HUB}/errors/cdp-attach/`,
  tokenErr: `${HUB}/errors/token-auth/`,
  faq: `${HUB}/faq/`,
  glossary: `${HUB}/glossary/`,
  scrape: `${HUB}/use-cases/scraping-isolation/`,
  social: `${HUB}/use-cases/social-multi-account/`,
  kits: `https://github.com/antidetect-automation/aff-saas/tree/main/kits`,
  kitPw: `https://github.com/antidetect-automation/playwright-mlx-starter`,
  kitPu: `https://github.com/antidetect-automation/puppeteer-mlx-starter`,
  sitemap: `${HUB}/sitemap.xml`,
};

async function tg(env, method, body) {
  return fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());
}

async function track(env, row) {
  const day = new Date().toISOString().slice(0, 10);
  const source = (row.source || "unknown").slice(0, 64);
  try {
    if (env.LEADS) {
      const key = `src:${source}:${day}`;
      const n = Number((await env.LEADS.get(key)) || "0") || 0;
      await env.LEADS.put(key, String(n + 1));
    }
  } catch (e) {
    console.error("kv track", e);
  }
  try {
    if (env.DB) {
      await env.DB.prepare(
        `INSERT INTO leads (tg_user_id, tg_username, chat_id, source, event, intent)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind(
          row.tg_user_id ?? null,
          row.tg_username ?? null,
          row.chat_id ?? null,
          source,
          row.event || "event",
          row.intent ?? null
        )
        .run();
    }
  } catch (e) {
    console.error("d1 track", e);
  }
}

function mainKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "Browser → SAAS50", callback_data: "intent:browser" },
        { text: "Cloud Phone → MIN50", callback_data: "intent:phone" },
      ],
      [
        { text: "Deal", url: LINKS.deal },
        { text: "Pricing", url: LINKS.pricing },
      ],
      [
        { text: "World compares", url: LINKS.vsHub },
        { text: "Tools", url: LINKS.tools },
      ],
      [
        { text: "Playwright", url: LINKS.guide },
        { text: "API map", url: LINKS.mlxApi },
      ],
      [
        { text: "Ads / Facebook", url: LINKS.fbAds },
        { text: "FAQ", url: LINKS.faq },
      ],
    ],
  };
}

async function sendWelcome(env, chatId, source, from) {
  await track(env, {
    chat_id: chatId,
    tg_user_id: from?.id,
    tg_username: from?.username,
    source,
    event: "start",
  });
  await tg(env, "sendMessage", {
    chat_id: chatId,
    text: [
      "Welcome to *antidetect-automation*.",
      "",
      "Multilogin is still our *#1* pick — now with *Free 5 profiles* + cheap Pro yearly.",
      "",
      DISCLOSURE,
      "",
      "Pick your product:",
      "• *Browser* / Playwright / ads → `SAAS50` (50%)",
      "• *Cloud Phone* / Android apps → `MIN50` (50%)",
      "",
      `Pricing: ${LINKS.pricing}`,
      `Compares: ${LINKS.vsHub}`,
      `Source tag: \`${(source || "direct").slice(0, 64)}\``,
    ].join("\n"),
    parse_mode: "Markdown",
    reply_markup: mainKeyboard(),
    disable_web_page_preview: true,
  });
}

async function sendDeal(env, chatId, intent, source, from) {
  const browser = intent === "browser" || intent === "saas50";
  const code = browser ? "SAAS50" : "MIN50";
  const product = browser
    ? "Multilogin Antidetect Browser — 50% lifetime"
    : "Multilogin Cloud Phone — 50% lifetime";
  await track(env, {
    chat_id: chatId,
    tg_user_id: from?.id,
    tg_username: from?.username,
    source: source || "callback",
    event: "deal",
    intent: code,
  });
  await tg(env, "sendMessage", {
    chat_id: chatId,
    text: [
      `Your code: *${code}*`,
      product,
      "",
      "2026 Multilogin: Free 5 profiles · Pro from ~$7/mo yearly · then stack this 50% code.",
      `Pricing: ${LINKS.pricing}`,
      "",
      "1. Open Multilogin’s official checkout (prefer yearly −35%)",
      "2. Apply the code",
      "3. Assign proxies carefully, then warm before scale",
      "",
      DISCLOSURE,
      "",
      `Deal: ${LINKS.deal}`,
      `Guide: ${LINKS.guide}`,
    ].join("\n"),
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Open hub", url: HUB },
          { text: "Deal page", url: LINKS.deal },
        ],
      ],
    },
    disable_web_page_preview: true,
  });
}

async function sendHelp(env, chatId) {
  await tg(env, "sendMessage", {
    chat_id: chatId,
    text: [
      "*Commands*",
      "/start — choose Browser or Cloud Phone",
      "/deal — deal desk",
      "/pricing — Free / Pro / Business 2026",
      "/saas50 — browser code",
      "/min50 — cloud phone code",
      "/auth — Multilogin X API auth",
      "/api — Multilogin X API map (Postman folders)",
      "/guide — Playwright + Multilogin X",
      "/puppeteer — Puppeteer + Multilogin X",
      "/selenium — Selenium + Multilogin X",
      "/postman — Postman starter",
      "/warmup — profile warm-up checklist",
      "/ads — ads / Facebook / Google / affiliate use-cases",
      "/tools — free client-side tools",
      "/compare — world antidetect scorecard",
      "/kits — Playwright / Puppeteer starters",
      "/errors — API / token / CDP / proxy",
      "/glossary — ops vocabulary",
      "/faq — FAQ page",
      "/ask <question> — Workers AI FAQ",
      "/help — this message",
      "",
      `Bot: ${BOT_PUBLIC}`,
      `Site: ${HUB}`,
    ].join("\n"),
    parse_mode: "Markdown",
    reply_markup: mainKeyboard(),
    disable_web_page_preview: true,
  });
}

async function sendLink(env, chatId, label, url) {
  await tg(env, "sendMessage", {
    chat_id: chatId,
    text: `${label}\n${url}`,
    reply_markup: {
      inline_keyboard: [[{ text: "Open", url }]],
    },
    disable_web_page_preview: false,
  });
}

async function askAI(env, chatId, question) {
  if (!env.AI) {
    await tg(env, "sendMessage", {
      chat_id: chatId,
      text: `AI FAQ unavailable. See hub: ${HUB}`,
    });
    return;
  }
  const prompt = [
    "You are the antidetect-automation Telegram assistant.",
    "Answer briefly in English (max 120 words).",
    "Topics: Multilogin X API (PAM sign-in, Launcher, Playwright CDP), Free/Pro/Business pricing 2026, ads/Facebook/Google multi-account hygiene, SAAS50/MIN50, antidetect comparisons.",
    "State Multilogin is our #1 recommendation for serious automation, but stay factual; no undetectable claims.",
    "If asked about price: Free 5 profiles; Pro from ~$7.08/mo yearly ($85/yr @10) then SAAS50 ~50% (verify checkout).",
    "Always mention affiliate disclosure in one short clause if recommending purchase.",
    "Never claim undetectable / never-ban.",
    "If off-topic, point to the hub.",
    `Hub: ${HUB}`,
    `Pricing: ${LINKS.pricing}`,
    `Compares: ${LINKS.vsHub}`,
    `User question: ${question}`,
  ].join("\n");

  try {
    const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: "Helpful, concise Multilogin ops assistant." },
        { role: "user", content: prompt },
      ],
      max_tokens: 220,
    });
    const text =
      (typeof result === "string" ? result : result?.response || "") ||
      `See ${HUB}`;
    await tg(env, "sendMessage", {
      chat_id: chatId,
      text: text.slice(0, 3500),
      reply_markup: mainKeyboard(),
      disable_web_page_preview: true,
    });
    await track(env, {
      chat_id: chatId,
      source: "ask",
      event: "ask",
      intent: question.slice(0, 80),
    });
  } catch (e) {
    console.error("ai", e);
    await tg(env, "sendMessage", {
      chat_id: chatId,
      text: `AI busy. Read the guide instead: ${LINKS.guide}`,
    });
  }
}

async function handleUpdate(env, update) {
  if (update.callback_query) {
    const cq = update.callback_query;
    const chatId = cq.message?.chat?.id;
    await tg(env, "answerCallbackQuery", { callback_query_id: cq.id });
    if ((cq.data || "").startsWith("intent:") && chatId) {
      await sendDeal(
        env,
        chatId,
        cq.data.split(":")[1],
        "callback",
        cq.from
      );
    }
    return;
  }

  const msg = update.message;
  if (!msg?.chat?.id) return;
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();
  const from = msg.from;

  if (text.startsWith("/start")) {
    await sendWelcome(env, chatId, text.split(/\s+/)[1] || "direct", from);
    return;
  }
  if (text.startsWith("/deal") || text.startsWith("/codes")) {
    await sendWelcome(env, chatId, "cmd_deal", from);
    return;
  }
  if (text.startsWith("/pricing") || text.startsWith("/price") || text.startsWith("/plans")) {
    await sendLink(env, chatId, "Multilogin pricing 2026 (Free / Pro / Business):", LINKS.pricing);
    return;
  }
  if (text.startsWith("/saas50")) {
    await sendDeal(env, chatId, "browser", "cmd_saas50", from);
    return;
  }
  if (text.startsWith("/min50")) {
    await sendDeal(env, chatId, "phone", "cmd_min50", from);
    return;
  }
  if (text.startsWith("/guide") || text.startsWith("/playwright")) {
    await sendLink(env, chatId, "Playwright + Multilogin X guide:", LINKS.guide);
    return;
  }
  if (text.startsWith("/auth") || text.startsWith("/signin")) {
    await sendLink(env, chatId, "Multilogin X API auth:", LINKS.apiAuth);
    return;
  }
  if (text.startsWith("/api") || text.startsWith("/mlxapi") || text.startsWith("/launcher")) {
    await tg(env, "sendMessage", {
      chat_id: chatId,
      text: "Multilogin X API — start with the map, then auth / Postman / Playwright.",
      reply_markup: {
        inline_keyboard: [
          [{ text: "API map", url: LINKS.mlxApi }],
          [
            { text: "Auth", url: LINKS.apiAuth },
            { text: "Postman", url: LINKS.postman },
          ],
          [
            { text: "Playwright", url: LINKS.guide },
            { text: "Proxy", url: LINKS.mlxProxy },
          ],
          [{ text: "Official Postman docs", url: "https://documenter.getpostman.com/view/28533318/2s946h9Cv9" }],
        ],
      },
      disable_web_page_preview: true,
    });
    return;
  }
  if (
    text.startsWith("/ads") ||
    text.startsWith("/facebook") ||
    text.startsWith("/fb") ||
    text.startsWith("/googleads") ||
    text.startsWith("/affiliate") ||
    text.startsWith("/mmo")
  ) {
    await tg(env, "sendMessage", {
      chat_id: chatId,
      text: "Ads / MMO use-cases — isolation hygiene, not ban insurance.",
      reply_markup: {
        inline_keyboard: [
          [{ text: "All use-cases", url: LINKS.useCases }],
          [
            { text: "Multi-account ads", url: LINKS.ads },
            { text: "Facebook ads", url: LINKS.fbAds },
          ],
          [
            { text: "Google Ads", url: LINKS.gAds },
            { text: "Affiliate", url: LINKS.affiliate },
          ],
          [{ text: "Deal SAAS50 / MIN50", url: LINKS.deal }],
        ],
      },
      disable_web_page_preview: true,
    });
    return;
  }
  if (text.startsWith("/guides")) {
    await sendLink(env, chatId, "Guides hub:", LINKS.guidesHub);
    return;
  }
  if (text.startsWith("/puppeteer")) {
    await sendLink(env, chatId, "Puppeteer + Multilogin X guide:", LINKS.puppeteer);
    return;
  }
  if (text.startsWith("/selenium")) {
    await sendLink(env, chatId, "Selenium + Multilogin X guide:", LINKS.selenium);
    return;
  }
  if (text.startsWith("/warmup") || text.startsWith("/warm")) {
    await sendLink(env, chatId, "Profile warm-up checklist:", LINKS.warmup);
    return;
  }
  if (text.startsWith("/glossary") || text.startsWith("/terms")) {
    await sendLink(env, chatId, "Ops glossary:", LINKS.glossary);
    return;
  }
  if (text.startsWith("/postman")) {
    await sendLink(env, chatId, "Postman + Multilogin X:", LINKS.postman);
    return;
  }
  if (
    text.startsWith("/tools") ||
    text.startsWith("/webgl") ||
    text.startsWith("/proxy") ||
    text.startsWith("/ua") ||
    text.startsWith("/tz") ||
    text.startsWith("/timezone") ||
    text.startsWith("/dns") ||
    text.startsWith("/webrtc")
  ) {
    await tg(env, "sendMessage", {
      chat_id: chatId,
      text: "Free tools (client-side):",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "WebGL", url: LINKS.webgl },
            { text: "UA / CH", url: LINKS.uach },
          ],
          [
            { text: "TZ / locale", url: LINKS.tz },
            { text: "DNS / WebRTC", url: LINKS.dns },
          ],
          [
            { text: "Proxy", url: LINKS.proxy },
            { text: "Checklist", url: LINKS.fpcheck },
          ],
          [{ text: "Tools hub", url: LINKS.tools }],
        ],
      },
    });
    return;
  }
  if (text.startsWith("/compare") || text.startsWith("/vs")) {
    await tg(env, "sendMessage", {
      chat_id: chatId,
      text: "World compares (Multilogin #1 recommendation):",
      reply_markup: {
        inline_keyboard: [
          [{ text: "Scorecard hub", url: LINKS.vsHub }],
          [{ text: "Pricing 2026", url: LINKS.pricing }],
          [
            { text: "AdsPower", url: LINKS.compare },
            { text: "GoLogin", url: LINKS.gologin },
          ],
          [
            { text: "Dolphin", url: LINKS.dolphin },
            { text: "Octo", url: LINKS.octo },
          ],
          [
            { text: "Undetectable", url: LINKS.undetectable },
            { text: "Linken", url: LINKS.linken },
          ],
          [
            { text: "BitBrowser", url: LINKS.bitbrowser },
            { text: "Kameleo", url: LINKS.kameleo },
          ],
          [
            { text: "MoreLogin", url: LINKS.morelogin },
            { text: "VMLogin", url: LINKS.vmlogin },
          ],
          [
            { text: "Vision", url: LINKS.vision },
            { text: "Blink", url: LINKS.blink },
          ],
        ],
      },
    });
    return;
  }
  if (text.startsWith("/kits") || text.startsWith("/starter")) {
    await tg(env, "sendMessage", {
      chat_id: chatId,
      text: "Open-source starters:",
      reply_markup: {
        inline_keyboard: [
          [{ text: "Playwright kit", url: LINKS.kitPw }],
          [{ text: "Puppeteer kit", url: LINKS.kitPu }],
          [{ text: "API auth", url: LINKS.apiAuth }],
          [{ text: "Selenium guide", url: LINKS.selenium }],
          [{ text: "All kits", url: LINKS.kits }],
          [{ text: "Onboarding", url: LINKS.start }],
        ],
      },
    });
    return;
  }
  if (text.startsWith("/onboarding") || text === "/begin") {
    await sendLink(env, chatId, "Start here:", LINKS.start);
    return;
  }
  if (text.startsWith("/errors")) {
    await tg(env, "sendMessage", {
      chat_id: chatId,
      text: "Troubleshooting:",
      reply_markup: {
        inline_keyboard: [
          [{ text: "Error desk", url: LINKS.errorsHub }],
          [{ text: "API errors", url: LINKS.errors }],
          [{ text: "Token auth", url: LINKS.tokenErr }],
          [{ text: "CDP attach", url: LINKS.cdpErr }],
          [{ text: "Proxy errors", url: LINKS.proxyErr }],
        ],
      },
    });
    return;
  }
  if (text.startsWith("/faq")) {
    await sendLink(env, chatId, "FAQ:", LINKS.faq);
    return;
  }
  if (text.startsWith("/ask")) {
    const q = text.replace(/^\/ask(@\w+)?\s*/i, "").trim();
    if (!q) {
      await tg(env, "sendMessage", {
        chat_id: chatId,
        text: "Usage: `/ask how do I attach Playwright to Multilogin X?`",
        parse_mode: "Markdown",
      });
      return;
    }
    await askAI(env, chatId, q);
    return;
  }
  if (text.startsWith("/help")) {
    await sendHelp(env, chatId);
    return;
  }

  // Free-text → light AI if short, else redirect
  if (text && !text.startsWith("/")) {
    if (text.length < 180) {
      await askAI(env, chatId, text);
    } else {
      await sendHelp(env, chatId);
    }
  }
}

async function ensureBotMeta(env) {
  if (!env.BOT_TOKEN) return { ok: false };
  const commands = [
    { command: "start", description: "Welcome + deal desk" },
    { command: "deal", description: "Coupon desk SAAS50 / MIN50" },
    { command: "pricing", description: "Free / Pro / Business 2026" },
    { command: "saas50", description: "Browser coupon" },
    { command: "min50", description: "Cloud Phone coupon" },
    { command: "guide", description: "Playwright + MLX guide" },
    { command: "auth", description: "MLX API authentication" },
    { command: "api", description: "MLX API map (Postman)" },
    { command: "ads", description: "Ads / FB / Google / affiliate" },
    { command: "puppeteer", description: "Puppeteer + MLX guide" },
    { command: "postman", description: "Postman kit" },
    { command: "warmup", description: "Profile warm-up checklist" },
    { command: "tools", description: "Free tools" },
    { command: "compare", description: "World antidetect scorecard" },
    { command: "kits", description: "Open-source starters" },
    { command: "onboarding", description: "Start here path" },
    { command: "errors", description: "API / token / CDP / proxy" },
    { command: "faq", description: "FAQ" },
    { command: "ask", description: "Ask AI FAQ" },
    { command: "help", description: "Command list" },
  ];
  const cmds = await tg(env, "setMyCommands", { commands });
  const short = await tg(env, "setMyShortDescription", {
    short_description: "Multilogin #1 hub — Free 5 + SAAS50 / MIN50 desk",
  });
  const desc = await tg(env, "setMyDescription", {
    description:
      "antidetect-automation: Multilogin stays #1 for serious ops. Free 5 profiles, cheap Pro yearly, world compares, kits. Coupons SAAS50 (browser) / MIN50 (cloud phone). Affiliate-supported; not official Multilogin Support.",
  });
  return { ok: !!(cmds.ok && short.ok && desc.ok), cmds, short, desc };
}

async function pollTelegram(env) {
  if (!env.BOT_TOKEN || !env.LEADS) return { ok: false };
  // Skip poll if webhook mode is healthy
  const mode = (await env.LEADS.get("mode")) || "webhook";
  if (mode === "webhook") return { ok: true, skipped: "webhook" };

  const offset = Number((await env.LEADS.get("tg:offset")) || "0") || 0;
  const res = await fetch(
    `https://api.telegram.org/bot${env.BOT_TOKEN}/getUpdates?timeout=0&offset=${offset}&allowed_updates=${encodeURIComponent(
      '["message","callback_query"]'
    )}`
  );
  const data = await res.json();
  if (!data.ok) return data;
  let next = offset;
  for (const update of data.result || []) {
    next = update.update_id + 1;
    try {
      await handleUpdate(env, update);
    } catch (e) {
      console.error(e);
    }
  }
  if (next !== offset) await env.LEADS.put("tg:offset", String(next));
  return { ok: true, processed: (data.result || []).length };
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(pollTelegram(env));
  },

  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({
        ok: true,
        hub: HUB,
        bot: BOT_PUBLIC,
        features: ["webhook", "cron-fallback", "d1", "kv", "workers-ai"],
      });
    }

    if (url.pathname === "/setup-bot") {
      const key = url.searchParams.get("key");
      if (!env.STATS_KEY || key !== env.STATS_KEY) {
        return new Response("unauthorized", { status: 401 });
      }
      const meta = await ensureBotMeta(env);
      return Response.json(meta);
    }

    if (url.pathname === "/stats") {
      const key = url.searchParams.get("key");
      if (!env.STATS_KEY || key !== env.STATS_KEY) {
        return new Response("unauthorized", { status: 401 });
      }
      let recent = [];
      try {
        if (env.DB) {
          const r = await env.DB.prepare(
            `SELECT source, event, intent, created_at FROM leads ORDER BY id DESC LIMIT 30`
          ).all();
          recent = r.results || [];
        }
      } catch (e) {
        recent = [{ error: String(e) }];
      }
      return Response.json({ ok: true, recent });
    }

    if (request.method === "POST" && url.pathname === "/webhook") {
      const secret = request.headers.get("x-telegram-bot-api-secret-token");
      if (env.WEBHOOK_SECRET && secret !== env.WEBHOOK_SECRET) {
        return new Response("forbidden", { status: 403 });
      }
      let update;
      try {
        update = await request.json();
      } catch {
        return new Response("bad json", { status: 400 });
      }
      try {
        if (env.LEADS) await env.LEADS.put("mode", "webhook");
        await handleUpdate(env, update);
      } catch (e) {
        console.error(e);
      }
      return new Response("ok");
    }

    return new Response(
      `aa-telegram-bot\nHub: ${HUB}\nPOST /webhook | GET /health | GET /stats?key=\n`,
      { headers: { "content-type": "text/plain" } }
    );
  },
};
