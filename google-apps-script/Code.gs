/**
 * Quorista Overseas — Website enquiries and career applications → Google Sheets
 *
 * Spreadsheet: 1iKzYUrBlH-Xf3jJmxWRWevteetZUmD7_k5cRD7XmvUY
 * Website form endpoint: deployed Apps Script Web App URL ending in /exec
 */
const SPREADSHEET_ID = '1iKzYUrBlH-Xf3jJmxWRWevteetZUmD7_k5cRD7XmvUY';

const INQUIRY_SHEET = 'Website Inquiries';
const CAREER_SHEET = 'Career Applications';

const INQUIRY_HEADERS = [
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

const CAREER_HEADERS = [
  'Submitted At',
  'Application Type',
  'Full Name',
  'Phone / WhatsApp',
  'Email',
  'Role / Internship Area',
  'Experience',
  'Hours Available / Week',
  'Current Status',
  'Current City',
  'College / University',
  'Course & Year',
  'Preferred Duration',
  'Mode',
  'Resume / Profile Link',
  'Message',
  'Contact Consent',
  'Unpaid Internship Acknowledgement',
  'Source'
];

function doPost(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};

    // Quietly discard bot submissions caught by the website honeypot.
    if (String(params._honey || '').trim()) {
      return output_({ ok: true });
    }

    if (clean_(params.submission_type).toLowerCase() === 'career') {
      return saveCareerApplication_(params);
    }

    return saveWebsiteInquiry_(params);
  } catch (err) {
    console.error(err);
    return output_({ ok: false, error: 'Unable to save submission.' });
  }
}

function saveWebsiteInquiry_(params) {
  const name = clean_(params.name);
  const phone = clean_(params.phone);
  const email = clean_(params.email);
  const interest = clean_(params.interest);
  const destination = clean_(params.destination);

  if (!name || !phone || !email || !interest || !destination) {
    return output_({ ok: false, error: 'Missing required enquiry fields.' });
  }

  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getSheetWithHeaders_(spreadsheet, INQUIRY_SHEET, INQUIRY_HEADERS);
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

  appendLocked_(sheet, row);
  return output_({ ok: true });
}

function saveCareerApplication_(params) {
  const name = clean_(params.name);
  const phone = clean_(params.phone);
  const email = clean_(params.email);
  const applicationType = clean_(params.application_type);
  const role = clean_(params.role);
  const consent = clean_(params.consent);

  if (!name || !phone || !email || !applicationType || !role || consent !== 'Yes') {
    return output_({ ok: false, error: 'Missing required career application fields.' });
  }

  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getSheetWithHeaders_(spreadsheet, CAREER_SHEET, CAREER_HEADERS);
  const row = [
    new Date(),
    safeCell_(applicationType),
    safeCell_(name),
    safeCell_(phone),
    safeCell_(email),
    safeCell_(role),
    safeCell_(clean_(params.experience)),
    safeCell_(clean_(params.hours)),
    safeCell_(clean_(params.status)),
    safeCell_(clean_(params.city)),
    safeCell_(clean_(params.college)),
    safeCell_(clean_(params.course)),
    safeCell_(clean_(params.duration)),
    safeCell_(clean_(params.mode)),
    safeCell_(clean_(params.resume_link)),
    safeCell_(clean_(params.message)),
    'Yes',
    clean_(params.unpaid_ack) === 'Yes' ? 'Yes' : 'No',
    'https://quoristaoverseas.in/careers.html'
  ];

  appendLocked_(sheet, row);
  return output_({ ok: true });
}

function getSheetWithHeaders_(spreadsheet, sheetName, headers) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(sheetName);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function appendLocked_(sheet, row) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    sheet.appendRow(row);
  } finally {
    lock.releaseLock();
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
