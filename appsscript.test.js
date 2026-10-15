const fs = require('fs'); const vm = require('vm');
let pass = 0, fail = 0; const t = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); c ? pass++ : fail++; };
function makeSheet() {
  const grid = [];
  const sheet = {
    getLastColumn: () => grid[0] ? grid[0].length : 0,
    getRange: (r, c, nr, nc) => ({
      getValues: () => [grid[r - 1].slice(c - 1, c - 1 + nc)],
      setValues: v => { if (!grid[r - 1]) grid[r - 1] = []; v[0].forEach((x, i) => grid[r - 1][c - 1 + i] = x); }
    }),
    setFrozenRows: () => {},
    appendRow: row => grid.push(row)
  };
  return { grid, sheet };
}
function load() {
  const S = makeSheet();
  const ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => S.sheet, insertSheet: () => S.sheet }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Utilities: { getUuid: () => 'uuid-' + Math.random().toString(36).slice(2, 6) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: s => ({ body: s, setMimeType() { return this; } }) },
    JSON, Date, String, Object
  };
  vm.createContext(ctx); vm.runInContext(fs.readFileSync(__dirname + '/../apps-script/Code.gs', 'utf8'), ctx);
  return { ctx, S };
}
const post = (ctx, obj) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(obj) } }).body);
let { ctx, S } = load();
let r = post(ctx, { survey_id: 'ma-tech-schools-2026', role_group: 'parent', district: 'Concord', q12_phone_concerns: 'Cheating; Distraction in class', website: '' });
t('first response ok', r.ok === true);
t('header row created', S.grid[0][0] === 'received_at' && S.grid[0].includes('district') && !S.grid[0].includes('website'));
t('row appended', S.grid.length === 2 && S.grid[1][S.grid[0].indexOf('district')] === 'Concord');
r = post(ctx, { survey_id: 'ma-tech-schools-2026', role_group: 'educator', district: 'Arlington', q15_minutes_managing: '5 to 10 minutes' });
t('new field gets new column', S.grid[0].includes('q15_minutes_managing') && S.grid.length === 3);
t('columns line up', S.grid[2][S.grid[0].indexOf('q15_minutes_managing')] === '5 to 10 minutes' && S.grid[2][S.grid[0].indexOf('district')] === 'Arlington');
r = post(ctx, { survey_id: 'ma-tech-schools-2026', role_group: 'parent', q38_one_change: '=HYPERLINK("http://x")' });
t('formula injection neutralized', S.grid[3][S.grid[0].indexOf('q38_one_change')].startsWith("'="));
const before = S.grid.length;
r = post(ctx, { survey_id: 'ma-tech-schools-2026', website: 'spam' });
t('honeypot pretends ok, saves nothing', r.ok && S.grid.length === before);
r = post(ctx, { survey_id: 'other', district: 'x' });
t('unknown survey rejected', r.ok === false && S.grid.length === before);
r = post(ctx, { survey_id: 'ma-tech-schools-2026', 'bad key!': 'x', role_group: 'parent' });
t('odd field names ignored', !S.grid[0].includes('bad key!'));
r = JSON.parse(ctx.doPost({ postData: { contents: '{not json' } }).body);
t('bad data handled', r.ok === false);
console.log(`\n${pass} passed, ${fail} failed`);
