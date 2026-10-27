/**
 * Quorista Overseas — Website enquiry form → Google Sheets
 *
 * Deploy this file as a Google Apps Script Web App.
 * Spreadsheet: 1iKzYUrBlH-Xf3jJmxWRWevteetZUmD7_k5cRD7XmvUY
 *
 * The website sends application/x-www-form-urlencoded fields to this endpoint.
 */
const SPREADSHEET_ID = '1iKzYUrBlH-Xf3jJmxWRWevteetZUmD7_k5cRD7XmvUY';
const SHEET_NAME = 'Website Inquiries';

const HEADERS = [
  'Submitted At',
  'Full Name',
  'Phone / WhatsApp',
  'Email',
  'Interest',
  'Destination',
  'Preferred Contact',
  'Message',
  'Consent',
  'Source'
];

function doPost(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};

    // Quietly discard bot submissions caught by the website honeypot.
    if (String(params._honey || '').trim()) {
      return output_({ ok: true });
    }

    const name = clean_(params.name);
    const phone = clean_(params.phone);
    const email = clean_(params.email);
    const interest = clean_(params.interest);
    const destination = clean_(params.destination);

    if (!name || !phone || !email || !interest || !destination) {
      return output_({ ok: false, error: 'Missing required fields.' });
    }

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
    }

    const row = [
      new Date(),
      safeCell_(name),
      safeCell_(phone),
      safeCell_(email),
      safeCell_(interest),
      safeCell_(destination),
      safeCell_(clean_(params.contact_method)),
      safeCell_(clean_(params.message)),
      clean_(params.consent) === 'Yes' ? 'Yes' : 'No',
      'https://quoristaoverseas.in/'
    ];

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      sheet.appendRow(row);
    } finally {
      lock.releaseLock();
    }

    return output_({ ok: true });
  } catch (err) {
    console.error(err);
    return output_({ ok: false, error: 'Unable to save enquiry.' });
  }
}

function clean_(value) {
  return String(value == null ? '' : value).trim().slice(0, 5000);
}

// Prevent user-submitted text from being interpreted as a spreadsheet formula.
function safeCell_(value) {
  const text = clean_(value);
  return /^[=+@-]/.test(text) ? "'" + text : text;
}

function output_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
