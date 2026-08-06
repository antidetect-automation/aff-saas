/**
 * Google Sheets backup via Apps Script Web App (doPost).
 *
 * After editing: Deploy → Manage deployments → ✏️ → New version → Deploy
 * (URL thường giữ nguyên.)
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

    var body = normalizeNewlines_(data.body || "");
    var cta = normalizeNewlines_(data.cta_footer || "");

    sheet.appendRow([
      data.posted_at || new Date().toISOString(),
      data.feed || "",
      data.title || "",
      data.source_url || "",
      data.github_url || "",
      data.telegram_message_id || "",
      data.channel_id || "",
      body,
      cta,
    ]);

    var last = sheet.getLastRow();
    // Column H = body — wrap + row height so line breaks look like the site
    var bodyCell = sheet.getRange(last, 8);
    bodyCell.setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
    bodyCell.setVerticalAlignment("top");
    sheet.getRange(last, 9).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
    var lines = body.split("\n").length;
    sheet.setRowHeight(last, Math.min(480, Math.max(60, 18 * (lines + 1))));
    sheet.setColumnWidth(8, 420);

    return json_({
      ok: true,
      sheet: SHEET_NAME,
      rows: last,
      body_lines: lines,
    });
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

function normalizeNewlines_(s) {
  return String(s)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(8, 420);
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
