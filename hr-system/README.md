# Quorista Overseas HR System — Phase 1

This folder contains the source for a **separate, administrator-only Google Apps Script web app**. It is not the public website form endpoint.

## Important architecture and safety rules

- Do not replace or modify the existing public website form endpoint with this project.
- Keep the existing GitHub Pages site and 'google-apps-script/Code.gs' submission handler unchanged.
- Deploy this HR web app with **Who has access: Only myself**. Never deploy it to anyone or anonymous access.
- The public GitHub repository contains source code only. Never commit candidate data, resumes, identity documents, passwords, OAuth tokens, or other secrets here.
- This Phase 1 version reads the existing 'Career Applications' tab and adds HR workflow columns at the right edge. It preserves the existing form columns and rows.
- This phase schedules a Calendar event and sends the candidate a Calendar invitation. For now, create a Google Meet link separately and paste it into the interview form; automatic Meet-link generation is a later enhancement.
- A generated employee/intern ID is an internal identifier, not a login credential. It must never be used as the only authentication mechanism.

## Phase 1 features

- Recruitment dashboard with counts, search, and filters.
- Candidate review, resume/profile link, and application details.
- Internal HR notes and recruitment status tracking.
- Unique IDs when a candidate reaches Selected / Offer Sent / Offer Accepted / Joined:
  - 'QO-INT-YYYY-0001' for internships.
  - 'QO-EMP-YYYY-0001' for full-time employees.
- Interview scheduling into the administrator's Google Calendar with the candidate as a guest.
- Calendar invitation sent to the candidate, with the provided Meet URL in the event description.
- Original application data remains in the existing Google Sheet.

## Create the separate Apps Script project

1. Sign in to the Google account that owns or administers the existing spreadsheet.
2. Open [Google Apps Script](https://script.google.com/) and create a **new standalone project**. Do not add this code to the existing public form-handling project.
3. Add or replace these files in the new project:
   - Script file 'Code.gs' ← copy 'hr-system/Code.gs'.
   - HTML file 'Index' ← copy 'hr-system/Index.html'.
   - HTML file 'Styles' ← copy 'hr-system/Styles.html'.
   - HTML file 'Client' ← copy 'hr-system/Client.html'.
4. In **Project Settings**, enable the option to show the 'appsscript.json' manifest file in the editor. Replace its contents with 'hr-system/appsscript.json'.
5. Confirm the project time zone is **(GMT+05:30) India Standard Time — Kolkata** (the manifest specifies 'Asia/Kolkata').
6. Save the project.
7. Under **Project Settings → Script Properties**, optionally add 'HR_ADMIN_EMAIL' with the exact Google account email you use to administer the system. This is an additional identity check when Apps Script exposes the active user's email; deployment access restrictions remain essential.
8. Select **Deploy → New deployment → Web app**.
9. Set **Execute as: Me** (the account deploying the app) and **Who has access: Only myself**.
10. Click **Deploy** and complete Google's authorization prompt for Google Sheets and Calendar.
11. Open the resulting web app URL while signed in to the same administrator account.

Do not add the HR web app URL to the public website navigation. Bookmark it privately.

## Test safely

1. Open the dashboard. It should load candidate rows from 'Career Applications'.
2. Review a test application and change its recruitment status to 'Under Review'. Confirm the new HR columns appear to the right of existing columns.
3. Change a test candidate to 'Selected'. Confirm an ID is generated in the 'Employee/Intern ID' column.
4. Create a test Google Meet link, then use the Interview button with a future date/time and that link. Confirm an event appears in your Google Calendar and the test recipient receives a calendar invitation.
5. Verify that the original website enquiry form and career form still save records and send acknowledgements through the original endpoint.

Use a test application and a recipient you control for interview-invitation tests.

## Phase 1 limitations and next phases

- Interview setup requires the administrator to create a Meet link separately and paste it in.
- Offer letter generation, offer acceptance/signatures, document uploads, employee login, and employee dashboards are not included yet.
- Do not collect Aadhaar, passport, or PAN uploads through a public GitHub Pages form. The employee portal must have authenticated access and private document storage before those features are added.
- The current app is designed for one administrator. Supporting additional HR staff requires an explicit access-control design and testing.
- Review Google Apps Script quotas and applicable privacy/legal requirements before production use.
