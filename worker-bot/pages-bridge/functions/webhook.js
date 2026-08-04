const HUB = "https://antidetect-automation.github.io";
const BOT_PUBLIC = "https://t.me/antidetect_automation_bot";
const DISCLOSURE =
  "Affiliate disclosure: if you buy Multilogin with our codes/links, we may earn a commission. We are not Multilogin Support.";

function tgApi(token, method, body) {
  return fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function track(env, source, event, extra = {}) {
  if (!env.LEADS) return;
  const day = new Date().toISOString().slice(0, 10);
  const key = `src:${source || "unknown"}:${day}`;
  const raw = (await env.LEADS.get(key)) || "0";
  await env.LEADS.put(key, String((Number(raw) || 0) + 1));
  await env.LEADS.put(
    `evt:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    JSON.stringify({ t: Date.now(), source, event, ...extra }),
    { expirationTtl: 60 * 60 * 24 * 90 }
  );
}

function intentKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "Browser → SAAS50", callback_data: "intent:browser" },
        { text: "Cloud Phone → MIN50", callback_data: "intent:phone" },
      ],
      [{ text: "Open hub", url: HUB }],
    ],
  };
}

async function sendWelcome(env, chatId, source) {
  const src = (source || "direct").slice(0, 64);
  await track(env, src, "start", { chatId });
  await tgApi(env.BOT_TOKEN, "sendMessage", {
    chat_id: chatId,
    text: [
      "Welcome to antidetect-automation.",
      "",
      DISCLOSURE,
      "",
      "What do you need?",
      "• Browser profiles / Playwright / ads / scraping → SAAS50",
      "• Android cloud phone workflows → MIN50",
      "",
      `Source: ${src}`,
      `Hub: ${HUB}`,
    ].join("\n"),
    reply_markup: intentKeyboard(),
    disable_web_page_preview: true,
  });
}

async function sendDeal(env, chatId, intent, source) {
  const browser = intent === "browser" || intent === "saas50";
  const code = browser ? "SAAS50" : "MIN50";
  const product = browser
    ? "Multilogin Antidetect Browser (50% lifetime)"
    : "Multilogin Cloud Phone (50% lifetime)";
  await track(env, source || "callback", "deal", { intent: code, chatId });
  await tgApi(env.BOT_TOKEN, "sendMessage", {
    chat_id: chatId,
    text: [
      `Your code: ${code}`,
      product,
      "",
      "Apply it on Multilogin’s official checkout.",
      "Then assign proxies carefully and warm profiles before scale.",
      "",
      DISCLOSURE,
      "",
      `Guides: ${HUB}/guides/playwright-mlx/`,
      `Deal page: ${HUB}/deal/`,
    ].join("\n"),
    reply_markup: {
      inline_keyboard: [
        [{ text: "Hub", url: HUB }],
        [{ text: "Deal page", url: `${HUB}/deal/` }],
      ],
    },
    disable_web_page_preview: true,
  });
}

async function handleUpdate(env, update) {
  if (update.callback_query) {
    const cq = update.callback_query;
    const chatId = cq.message?.chat?.id;
    await tgApi(env.BOT_TOKEN, "answerCallbackQuery", {
      callback_query_id: cq.id,
    });
    if ((cq.data || "").startsWith("intent:") && chatId) {
      await sendDeal(env, chatId, cq.data.split(":")[1], "callback");
    }
    return;
  }

  const msg = update.message;
  if (!msg?.chat?.id) return;
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();

  if (text.startsWith("/start")) {
    await sendWelcome(env, chatId, text.split(/\s+/)[1] || "direct");
    return;
  }
  if (text === "/deal" || text === "/codes") {
    await sendWelcome(env, chatId, "cmd_deal");
    return;
  }
  if (text === "/help") {
    await tgApi(env.BOT_TOKEN, "sendMessage", {
      chat_id: chatId,
      text: [
        "Commands: /start /deal /help",
        `Bot: ${BOT_PUBLIC}`,
        `Hub: ${HUB}`,
      ].join("\n"),
    });
    return;
  }
  await tgApi(env.BOT_TOKEN, "sendMessage", {
    chat_id: chatId,
    text: "Send /start to pick SAAS50 (browser) or MIN50 (cloud phone).",
    reply_markup: intentKeyboard(),
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
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
    await handleUpdate(env, update);
  } catch (err) {
    console.error(err);
  }
  return new Response("ok");
}
