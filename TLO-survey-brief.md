# Brief: add the families and educators survey to the TLO website

For Claude Code, working in the `turning-life-on-website` repo. Work on a new branch from `main` (for example `survey`), open a pull request, and don't merge it.

## What this adds

A survey page at `/survey/` (Technology in Massachusetts Schools: What Families and Educators Think). It shows one section per screen, branches by role (parents see "your child"; educators see "the school"; teacher-, staff- and administrator-only questions are hidden for others), and sends each completed survey as one row to a Google Sheet through a small Google Apps Script. No names or emails are collected.

All files below are written and tested (49 browser checks and 10 Google Sheet checks, see `test/`).

## Files to add

| File | What it is |
|---|---|
| `survey/index.html` | The survey page. **Wrap it in the site's shared head, header and footer**, like the other pages, keeping the two survey scripts and `survey.css`. Keep `<meta name="robots" content="noindex">` until launch. |
| `assets/survey/questions.js` | All survey content and branching rules. Edit wording here only. |
| `assets/survey/survey.js` | Renders the survey, applies branching, validates, submits. Don't change unless needed. |
| `assets/survey/survey.css` | Survey styles. Adjust to match the site's design system (fonts, colors, buttons); keep the class names. |
| `data/ma-districts.json` | **Create this:** a JSON array of every Massachusetts public school district name, including regional, vocational-technical and charter districts, sorted A to Z, e.g. `["Abington", "Acton-Boxborough", ...]`. Source: DESE's directory (profiles.doe.mass.edu, Search for Districts, export). If you can't reach it, ask Adrienne to download the export and upload it. Until this file exists, the survey shows a type-in box instead of a dropdown. |

Do not add `apps-script/` or `test/` to the published site; keep them in a folder that isn't served (for example `tools/survey/`), or leave them out of the repo.

## Settings in `assets/survey/questions.js`

- `endpoint`: the Google Apps Script web app URL (Adrienne sets this up, see below)
- `emailFormUrl`: a separate Google Form for "send me the results" (optional; the button is hidden until set)
- `dashboardUrl`: leave blank for now

## Google Sheet setup (Adrienne)

1. Create a Google Sheet in the TLO Google Drive named "TLO Survey Responses (families and educators)". Keep it private.
2. In the Sheet: Extensions → Apps Script. Delete what's there, paste `apps-script/Code.gs`, save.
3. Deploy → New deployment → type **Web app**. Execute as **Me**, Who has access **Anyone**. Deploy, approve the permissions, and copy the **Web app URL** (ends in `/exec`).
4. Put that URL in `endpoint` in `questions.js`.

The Sheet creates its own "Responses" tab and columns on the first response. Each grid statement gets its own column (for example `q13_phone_agree__bell_to_bell`), and "select all" answers are separated by semicolons.

## Test plan

1. On the branch preview (or after merging), take the survey once as a parent and once as a teacher. Check both rows appear in the Sheet with the right columns.
2. Check branching: the storage question appears only for "stored away for the entire school day"; teacher questions don't appear for parents or school committee members; "No" to Massachusetts ends the survey.
3. Delete the test rows from the Sheet.

If the page shows "We couldn't save your answers" but rows do appear in the Sheet, the browser couldn't read Google's reply. In that case, change the `fetch` call in `survey.js` to `mode: 'no-cors'` and treat any completed request as success.

## Later: the dashboard

Keep the Sheet private. The dashboard should read **summary counts only**, published by a separate `doGet` in the Apps Script that applies the 20-response minimum for any district or role. Don't publish the raw Sheet.
