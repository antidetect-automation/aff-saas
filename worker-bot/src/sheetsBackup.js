/**
 * Append digest rows to Google Sheets via Apps Script Web App.
 * Secrets: SHEETS_WEBHOOK_URL (required), SHEETS_HOOK_SECRET (optional).
 */

export async function backupDigestToSheets(env, row) {
  const url = String(env.SHEETS_WEBHOOK_URL || "").trim();
  if (!url) return { ok: false, skipped: "no_SHEETS_WEBHOOK_URL" };

  const payload = {
    posted_at: row.posted_at || new Date().toISOString(),
    feed: row.feed || "",
    title: row.title || "",
    source_url: row.source_url || row.link || "",
    github_url: row.github_url || "",
    telegram_message_id: row.telegram_message_id || row.message_id || "",
    channel_id: row.channel_id || "",
    body: String(row.body || "").slice(0, 45000),
    cta_footer: row.cta_footer || "",
  };
  const secret = String(env.SHEETS_HOOK_SECRET || "").trim();
  if (secret) payload.secret = secret;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
    });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text.slice(0, 300) };
    }
    if (!res.ok || data?.ok === false) {
      return {
        ok: false,
        status: res.status,
        error: data?.error || text.slice(0, 200),
      };
    }
    return { ok: true, status: res.status, sheet: data?.sheet, rows: data?.rows };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
