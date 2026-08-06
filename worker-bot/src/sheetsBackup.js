/**
 * Append digest rows to Google Sheets via Apps Script Web App.
 * Secrets: SHEETS_WEBHOOK_URL (required), SHEETS_HOOK_SECRET (optional).
 */

/** Keep real line breaks for Sheets (like site / Telegram body). */
export function formatBodyForSheets(raw) {
  return String(raw || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function backupDigestToSheets(env, row) {
  const url = String(env.SHEETS_WEBHOOK_URL || "").trim();
  if (!url) return { ok: false, skipped: "no_SHEETS_WEBHOOK_URL" };

  const body = formatBodyForSheets(row.body);
  const cta = formatBodyForSheets(row.cta_footer);
  // Full readable backup: desk body + CTA block (multiline)
  const bodyFull = [body, "", "———", cta].filter(Boolean).join("\n");

  const payload = {
    posted_at: row.posted_at || new Date().toISOString(),
    feed: row.feed || "",
    title: row.title || "",
    source_url: row.source_url || row.link || "",
    github_url: row.github_url || "",
    telegram_message_id: row.telegram_message_id || row.message_id || "",
    channel_id: row.channel_id || "",
    body: bodyFull.slice(0, 45000),
    cta_footer: cta,
    body_lines: bodyFull.split("\n").length,
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
    return {
      ok: true,
      status: res.status,
      sheet: data?.sheet,
      rows: data?.rows,
      body_lines: payload.body_lines,
      sheets_body_lines: data?.body_lines,
    };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
