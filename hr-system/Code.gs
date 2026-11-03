/**
 * Quorista Overseas HR Admin — Phase 1
 * IMPORTANT: This is a separate Apps Script project from the public website
 * submission endpoint. Deploy this web app with access set to "Only myself".
 */
const HR_SPREADSHEET_ID = '1iKzYUrBlH-Xf3jJmxWRWevteetZUmD7_k5cRD7XmvUY';
const HR_CAREER_SHEET = 'Career Applications';
const HR_TIME_ZONE = 'Asia/Kolkata';

const HR_COLUMNS = [
  'HR Candidate ID',
  'Recruitment Status',
  'HR Notes',
  'Interview Date/Time',
  'Interview Duration (minutes)',
  'Google Meet URL',
  'Last HR Updated At',
  'Offer Status',
  'Offer Accepted At',
  'Planned Start Date',
  'Actual Joining Date',
  'Employee/Intern ID'
];

const HR_STATUSES = [
  'New',
  'Under Review',
  'Interview Scheduled',
  'Interviewed',
  'Selected',
  'Rejected',
  'On Hold',
  'Offer Sent',
  'Offer Accepted',
  'Joined'
];

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Quorista Overseas | HR Admin')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getDashboardData() {
  assertAdminDeployment_();
  const sheet = getCareerSheet_();
  const info = getHeaderInfo_(sheet);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return { candidates: [], statuses: HR_STATUSES, counts: countStatuses_([]) };
  }

  const values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  const candidates = values.map((row, index) => {
    const get = name => {
      const col = info.index[name];
      return col === undefined ? '' : row[col];
    };
    const asText = value => {
      if (value instanceof Date && !isNaN(value.getTime())) {
        return Utilities.formatDate(value, HR_TIME_ZONE, 'dd MMM yyyy, HH:mm');
      }
      return value == null ? '' : String(value);
    };

    return {
      rowNumber: index + 2,
      submittedAt: asText(get('Submitted At')),
      applicationType: asText(get('Application Type')),
      name: asText(get('Full Name')),
      phone: asText(get('Phone / WhatsApp')),
      email: asText(get('Email')),
      role: asText(get('Role / Internship Area')),
      experience: asText(get('Experience')),
      hours: asText(get('Hours Available / Week')),
      currentStatus: asText(get('Current Status')),
      city: asText(get('Current City')),
      college: asText(get('College / University')),
      course: asText(get('Course & Year')),
      duration: asText(get('Preferred Duration')),
      mode: asText(get('Mode')),
      resumeLink: asText(get('Resume / Profile Link')),
      message: asText(get('Message')),
      candidateId: asText(get('HR Candidate ID')),
      recruitmentStatus: asText(get('Recruitment Status')) || 'New',
      notes: asText(get('HR Notes')),
      interviewDateTime: asText(get('Interview Date/Time')),
      interviewDuration: asText(get('Interview Duration (minutes)')),
      meetUrl: asText(get('Google Meet URL')),
      offerStatus: asText(get('Offer Status')),
      offerAcceptedAt: asText(get('Offer Accepted At')),
      plannedStartDate: asText(get('Planned Start Date')),
      actualJoiningDate: asText(get('Actual Joining Date')),
      employeeId: asText(get('Employee/Intern ID'))
    };
  }).filter(candidate => candidate.name || candidate.email);

  candidates.sort((a, b) => b.rowNumber - a.rowNumber);
  return {
    candidates: candidates.slice(0, 500),
    statuses: HR_STATUSES,
    counts: countStatuses_(candidates)
  };
}

function updateCandidate(rowNumber, status, notes) {
  assertAdminDeployment_();
  const row = Number(rowNumber);
  if (!Number.isInteger(row) || row < 2) throw new Error('Invalid candidate row.');
  if (HR_STATUSES.indexOf(String(status)) === -1) throw new Error('Invalid recruitment status.');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getCareerSheet_();
    if (row > sheet.getLastRow()) throw new Error('Candidate record was not found.');
    const info = getHeaderInfo_(sheet);
    sheet.getRange(row, info.index['Recruitment Status'] + 1).setValue(status);
    sheet.getRange(row, info.index['HR Notes'] + 1).setValue(String(notes || '').slice(0, 5000));
    sheet.getRange(row, info.index['Last HR Updated At'] + 1).setValue(new Date());

    let employeeId = '';
    if (['Selected', 'Offer Sent', 'Offer Accepted', 'Joined'].indexOf(status) !== -1) {
      employeeId = ensureEmployeeId_(sheet, row, info);
    }
    return { ok: true, employeeId: employeeId };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Creates a Google Calendar event with the candidate as a guest.
 * The candidate receives a calendar invitation automatically.
 * Phase 1 accepts a Meet URL pasted by the admin; automatic Meet-link
 * generation can be added later with the Advanced Calendar API.
 */
function scheduleInterview(rowNumber, localDateTime, durationMinutes, meetUrl) {
  assertAdminDeployment_();
  const row = Number(rowNumber);
  const duration = Number(durationMinutes);
  const url = String(meetUrl || '').trim();

  if (!Number.isInteger(row) || row < 2) throw new Error('Invalid candidate row.');
  if (!localDateTime) throw new Error('Choose an interview date and time.');
  if (!Number.isFinite(duration) || duration < 15 || duration > 240) {
    throw new Error('Interview duration must be between 15 and 240 minutes.');
  }
  if (!/^https:\/\/(meet\.google\.com\/|[\w.-]*meet\.google\.com\/)/i.test(url)) {
    throw new Error('Enter a valid Google Meet URL.');
  }

  const sheet = getCareerSheet_();
  const info = getHeaderInfo_(sheet);
  if (row > sheet.getLastRow()) throw new Error('Candidate record was not found.');

  const record = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  const get = name => {
    const col = info.index[name];
    return col === undefined ? '' : record[col];
  };
  const name = String(get('Full Name') || '').trim();
  const email = String(get('Email') || '').trim();
  const role = String(get('Role / Internship Area') || '').trim();
  if (!name || !email) throw new Error('Candidate name or email is missing.');

  // datetime-local is interpreted in the script's configured Asia/Kolkata timezone.
  const start = new Date(String(localDateTime));
  if (isNaN(start.getTime()) || start.getTime() < Date.now() - 60000) {
    throw new Error('Choose a future interview date and time.');
  }
  const end = new Date(start.getTime() + duration * 60000);
  const title = 'Quorista Overseas Interview — ' + name;
  const description =
    'Interview invitation from Quorista Overseas\n\n' +
    'Candidate: ' + name + '\n' +
    'Role / internship area: ' + role + '\n\n' +
    'Join the Google Meet using this link:\n' + url + '\n\n' +
    'If you need to reschedule, reply to the interview email or contact Quorista Overseas.';

  const event = CalendarApp.getDefaultCalendar().createEvent(title, start, end, {
    description: description,
    guests: email,
    sendInvites: true
  });

  sheet.getRange(row, info.index['Recruitment Status'] + 1).setValue('Interview Scheduled');
  sheet.getRange(row, info.index['Interview Date/Time'] + 1).setValue(start);
  sheet.getRange(row, info.index['Interview Duration (minutes)'] + 1).setValue(duration);
  sheet.getRange(row, info.index['Google Meet URL'] + 1).setValue(url);
  sheet.getRange(row, info.index['Last HR Updated At'] + 1).setValue(new Date());

  return {
    ok: true,
    eventId: event.getId(),
    message: 'Interview added to your Google Calendar. The candidate should receive a calendar invitation.'
  };
}

function getCareerSheet_() {
  const spreadsheet = SpreadsheetApp.openById(HR_SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(HR_CAREER_SHEET);
  if (!sheet) {
    throw new Error('The Career Applications tab does not exist yet. Submit a test career application first.');
  }
  ensureHrColumns_(sheet);
  return sheet;
}

function ensureHrColumns_(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
  HR_COLUMNS.forEach(header => {
    if (headers.indexOf(header) === -1) {
      const nextColumn = sheet.getLastColumn() + 1;
      sheet.getRange(1, nextColumn).setValue(header);
      sheet.getRange(1, nextColumn).setFontWeight('bold');
      headers.push(header);
    }
  });
}

function getHeaderInfo_(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  const index = {};
  headers.forEach((header, i) => {
    if (header) index[header] = i;
  });
  return { headers: headers, index: index };
}

function ensureEmployeeId_(sheet, row, info) {
  const idColumn = info.index['Employee/Intern ID'] + 1;
  const existing = String(sheet.getRange(row, idColumn).getDisplayValue() || '').trim();
  if (existing) return existing;

  const type = String(sheet.getRange(row, info.index['Application Type'] + 1).getDisplayValue() || '').toLowerCase();
  const prefix = type.indexOf('intern') !== -1 ? 'QO-INT' : 'QO-EMP';
  const year = Utilities.formatDate(new Date(), HR_TIME_ZONE, 'yyyy');
  const targetPrefix = prefix + '-' + year + '-';
  const lastRow = sheet.getLastRow();
  const ids = lastRow >= 2
    ? sheet.getRange(2, idColumn, lastRow - 1, 1).getDisplayValues().flat()
    : [];
  let maxNumber = 0;
  ids.forEach(id => {
    const match = String(id).match(new RegExp('^' + targetPrefix + '(\\d+)$'));
    if (match) maxNumber = Math.max(maxNumber, Number(match[1]));
  });
  const newId = targetPrefix + String(maxNumber + 1).padStart(4, '0');
  sheet.getRange(row, idColumn).setValue(newId);
  return newId;
}

function countStatuses_(candidates) {
  const counts = { total: candidates.length, New: 0, 'Under Review': 0, 'Interview Scheduled': 0, Interviewed: 0, Selected: 0, Rejected: 0, 'On Hold': 0, 'Offer Sent': 0, 'Offer Accepted': 0, Joined: 0 };
  candidates.forEach(candidate => {
    const status = candidate.recruitmentStatus || 'New';
    if (counts[status] !== undefined) counts[status]++;
    else counts.New++;
  });
  return counts;
}

/**
 * Extra identity check when Apps Script exposes the active account.
 * The deployment must still be restricted to "Only myself"; do not publish
 * this admin app as a public/anonymous web app.
 */
function assertAdminDeployment_() {
  const activeEmail = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  const configuredEmail = String(PropertiesService.getScriptProperties().getProperty('HR_ADMIN_EMAIL') || '').trim().toLowerCase();
  if (configuredEmail && activeEmail && activeEmail !== configuredEmail) {
    throw new Error('Access denied. This HR dashboard is restricted to its administrator.');
  }
}
