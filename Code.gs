/**
 * Turning Life On survey receiver (Google Apps Script, bound to the results Google Sheet).
 * Saves each survey response as one row on the "Responses" tab.
 * New answer fields automatically get their own column.
 * Deploy as a web app: Execute as "Me", Who has access "Anyone".
 */
var SHEET_NAME = 'Responses';
var ALLOWED_SURVEYS = ['ma-tech-schools-2026'];
var MAX_LEN = 5000;

function doPost(e) {
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (data.website) return out_({ ok: true }); // honeypot: pretend success, save nothing
    if (ALLOWED_SURVEYS.indexOf(data.survey_id) === -1) return out_({ ok: false, error: 'Unknown survey' });
    delete data.website;

    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
      var lastCol = sheet.getLastColumn();
      var headers = lastCol ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
      if (!headers.length || headers[0] !== 'received_at') {
        headers = ['received_at', 'response_id'];
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.setFrozenRows(1);
      }
      var keys = Object.keys(data).filter(function (k) { return /^[a-z0-9_]{1,80}$/.test(k); });
      var added = keys.filter(function (k) { return headers.indexOf(k) === -1; });
      if (added.length) {
        sheet.getRange(1, headers.length + 1, 1, added.length).setValues([added]);
        headers = headers.concat(added);
      }
      var row = headers.map(function (h) {
        if (h === 'received_at') return new Date();
        if (h === 'response_id') return Utilities.getUuid();
        return clean_(data[h]);
      });
      sheet.appendRow(row);
    } finally {
      lock.releaseLock();
    }
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: 'Could not save' });
  }
}

function doGet() {
  return out_({ ok: true, service: 'TLO survey receiver' });
}

// Text is stored as plain text: values starting with = + - @ are prefixed so they can't run as formulas.
function clean_(v) {
  if (v === undefined || v === null) return '';
  var s = String(v).slice(0, MAX_LEN);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
