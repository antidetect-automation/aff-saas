/**
 * Google Sheets backup via Apps Script Web App (doPost).
 *
 * SETUP (one-time, ~2 min):
 * 1. Create a Google Sheet → rename first tab to `digests` (or leave blank; script creates it).
 * 2. Extensions → Apps Script → paste this whole file → Save.
 * 3. Deploy → New deployment → Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the Web app URL.
 * 5. Worker secret:
 *      cd worker-bot && printf '%s' 'WEB_APP_URL' | npx wrangler secret put SHEETS_WEBHOOK_URL
 *
 * Optional shared secret (same value in Script Properties + Worker):
 *      Script Properties: SHEETS_HOOK_SECRET=...
 *      wrangler secret put SHEETS_HOOK_SECRET
 */

var SHEET_NAME = "digests";
var HEADERS = [
  "posted_at",
  "feed",
  "title",
  "source_url",
  "github_url",
  "telegram_message_id",
  "channel_id",
  "body",
  "cta_footer",
];

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) || "{}";
    var data = JSON.parse(raw);

    var expected = PropertiesService.getScriptProperties().getProperty("SHEETS_HOOK_SECRET");
    if (expected) {
      var got = String((data && data.secret) || "");
      if (got !== expected) {
        return json_({ ok: false, error: "unauthorized" });
      }
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }
    ensureHeaders_(sheet);

    sheet.appendRow([
      data.posted_at || new Date().toISOString(),
      data.feed || "",
      data.title || "",
      data.source_url || "",
      data.github_url || "",
      data.telegram_message_id || "",
      data.channel_id || "",
      data.body || "",
      data.cta_footer || "",
    ]);

    return json_({ ok: true, sheet: SHEET_NAME, rows: sheet.getLastRow() });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json_({
    ok: true,
    service: "aa-digest-sheets-backup",
    hint: "POST JSON rows from Cloudflare Worker",
  });
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    return;
  }
  var first = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (String(first[0]).toLowerCase() !== "posted_at") {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
