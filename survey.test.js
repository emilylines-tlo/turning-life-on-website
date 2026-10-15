const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const A = p => fs.readFileSync(path.join(__dirname, '../site/assets/survey', p), 'utf8');
let pass = 0, fail = 0; const t = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); c ? pass++ : fail++; };

function boot(endpointReply) {
  const dom = new JSDOM('<!doctype html><body><div id="tlo-survey"></div></body>', { runScripts: 'outside-only', url: 'https://example.org/survey/' });
  const w = dom.window;
  w.scrollTo = () => {};
  w.__posts = [];
  w.fetch = (url, opts) => {
    if (url.includes('ma-districts')) return Promise.resolve({ ok: true, json: () => Promise.resolve(['Concord', 'Arlington', 'Acton-Boxborough']) });
    w.__posts.push({ url, opts });
    return Promise.resolve({ json: () => Promise.resolve(endpointReply) });
  };
  w.eval(A('questions.js'));
  w.TLO_SURVEY.endpoint = 'https://script.google.com/macros/s/TEST/exec';
  w.eval(A('survey.js'));
  return w;
}
const $ = (w, s) => w.document.querySelector(s);
const $$ = (w, s) => [...w.document.querySelectorAll(s)];
const title = w => $(w, '.sv-title').textContent;
const clickLabel = (w, qid, text) => { const fs = $(w, `[data-q="${qid}"]`); const lab = [...fs.querySelectorAll('label')].find(l => l.textContent.trim() === text); lab.querySelector('input').click(); };
const next = w => $(w, '.sv-next').click();
const tick = () => new Promise(r => setTimeout(r, 0));

(async () => {
  // Parent path
  let w = boot({ ok: true }); await tick();
  t('starts on Welcome', title(w) === 'Welcome');
  next(w); t('consent is required', $(w, '.sv-error').textContent.includes('*'));
  clickLabel(w, 'consent', "Yes, I've read the information above and I'd like to take the survey"); next(w);
  t('role page next', title(w) === 'Your role');
  clickLabel(w, 'role', 'Parent or guardian of a child in kindergarten through 12th grade');
  t('parent wording for in_ma', $(w, '[data-q="in_ma"] legend').textContent.startsWith("Is your child's school"));
  clickLabel(w, 'in_ma', 'Yes'); next(w);
  t('school page', title(w) === 'Your school');
  t('district dropdown loaded', $$(w, '.sv-select option').some(o => o.value === 'Concord'));
  t('parent grade is single choice', $(w, '[data-q="grades"] input').type === 'radio');
  t('child birthday note shown to parents', !!$(w, '.sv-note'));
  next(w); t('district required', $(w, '.sv-error').textContent.includes('*'));
  const sel = $(w, '.sv-select'); sel.value = 'Concord'; sel.dispatchEvent(new w.Event('change'));
  $(w, '.sv-zip').value = '123'; $(w, '.sv-zip').dispatchEvent(new w.Event('input'));
  next(w); t('bad zip rejected', $(w, '.sv-error').textContent.includes('five-digit'));
  $(w, '.sv-zip').value = '01742'; $(w, '.sv-zip').dispatchEvent(new w.Event('input'));
  clickLabel(w, 'grades', '5th'); next(w);
  t('phones page', title(w).startsWith('Part 1'));
  t('parent reminder shown', !!$(w, '.sv-reminder'));
  t('storage question hidden at first', !$(w, '[data-q="q8a_storage"]'));
  t('educator-only question hidden for parents', !$(w, '[data-q="q15_minutes_managing"]'));
  clickLabel(w, 'q8_policy', 'Devices must be stored away for the entire school day');
  t('storage question appears for all-day storage', !!$(w, '[data-q="q8a_storage"]'));
  clickLabel(w, 'q8a_storage', 'Locked pouches');
  clickLabel(w, 'q11_phone_benefits', 'Staying in touch with family');
  clickLabel(w, 'q11_phone_benefits', "I don't see significant benefits");
  t('exclusive option clears others', JSON.stringify(w.TLOSurveyInternals.answers().q11_phone_benefits) === JSON.stringify(["I don't see significant benefits"]));
  clickLabel(w, 'q12_phone_concerns', 'Cheating'); clickLabel(w, 'q12_phone_concerns', 'Distraction in class');
  const grid = $(w, '[data-q="q13_phone_agree"]');
  grid.querySelector('.sv-grid-row input').click();
  clickLabel(w, 'q14_state_law', 'Strongly support');
  next(w); t('edtech page', title(w).startsWith('Part 2'));
  t('parent wording one-to-one', $(w, '[data-q="q16_one_to_one"] legend').textContent.includes('your child'));
  next(w); t('ai page', title(w).startsWith('Part 3'));
  t('parent-only chatbot question shown', !!$(w, '[data-q="q31_child_chatbot"]'));
  t('educator training hidden', !$(w, '[data-q="q36_ai_training"]'));
  clickLabel(w, 'q35_ai_grades', '11th'); clickLabel(w, 'q35_ai_grades', '12th');
  next(w); t('thoughts page', title(w) === 'Your thoughts');
  next(w); t('about page', title(w) === 'A little about you');
  t('IEP shown to parents', !!$(w, '[data-q="q43_iep_504"]'));
  t('years hidden for parents', !$(w, '[data-q="q44_years"]'));
  t('last page says Submit', $(w, '.sv-next').textContent === 'Submit');
  next(w); await tick(); await tick();
  t('posted once to endpoint', w.__posts.length === 1 && w.__posts[0].opts.headers['Content-Type'].startsWith('text/plain'));
  const row = JSON.parse(w.__posts[0].opts.body);
  t('row has role group parent', row.role_group === 'parent');
  t('row has district and zip', row.district === 'Concord' && row.zip === '01742');
  t('multi joined with ;', row.q12_phone_concerns === 'Cheating; Distraction in class');
  t('grid row column', row.q13_phone_agree__keep_phones === 'Strongly agree');
  t('hidden educator fields blank', row.q15_minutes_managing === '' && row.q44_years === '');
  t('conditional answer kept', row.q8a_storage === 'Locked pouches');
  t('ai grades', row.q35_ai_grades === '11th; 12th');
  t('no email collected', !Object.keys(row).some(k => /email/i.test(k)));
  t('thank-you shown', title(w) === 'Thank you');

  // Educator path + pruning
  w = boot({ ok: true }); await tick();
  clickLabel(w, 'consent', "Yes, I've read the information above and I'd like to take the survey"); next(w);
  clickLabel(w, 'role', 'Teacher');
  t('educator wording for in_ma', $(w, '[data-q="in_ma"] legend').textContent.startsWith('Is the school where you work'));
  clickLabel(w, 'in_ma', 'Yes'); next(w);
  t('educator grades multi', $(w, '[data-q="grades"] input').type === 'checkbox');
  t('no child note for educators', !$(w, '.sv-note'));
  const s2 = $(w, '.sv-select'); s2.value = 'Arlington'; s2.dispatchEvent(new w.Event('change')); next(w);
  t('teacher sees minutes managing', !!$(w, '[data-q="q15_minutes_managing"]'));
  t('no parent reminder for educators', !$(w, '.sv-reminder'));
  next(w); next(w);
  clickLabel(w, 'q36_ai_training', 'Yes');
  t('training source appears', !!$(w, '[data-q="q36b_training_source"]'));
  clickLabel(w, 'q36b_training_source', 'A technology company');
  clickLabel(w, 'q36_ai_training', 'No');
  t('training source hides and clears', !$(w, '[data-q="q36b_training_source"]') && !w.TLOSurveyInternals.answers().q36b_training_source);
  t('parent chatbot hidden', !$(w, '[data-q="q31_child_chatbot"]'));

  // School committee member: educator wording but no teacher-only questions
  w = boot({ ok: true }); await tick();
  clickLabel(w, 'consent', "Yes, I've read the information above and I'd like to take the survey"); next(w);
  clickLabel(w, 'role', 'School committee member'); clickLabel(w, 'in_ma', 'Yes'); next(w);
  const s3 = $(w, '.sv-select'); s3.value = 'Acton-Boxborough'; s3.dispatchEvent(new w.Event('change')); next(w);
  t('committee member skips teacher-only', !$(w, '[data-q="q15_minutes_managing"]'));

  // Other role with description
  w = boot({ ok: true }); await tick();
  clickLabel(w, 'consent', "Yes, I've read the information above and I'd like to take the survey"); next(w);
  clickLabel(w, 'role', 'Other (please describe)');
  const oth = $(w, '.sv-other'); oth.value = 'Grandparent'; oth.dispatchEvent(new w.Event('input'));
  t('other description captured', w.TLOSurveyInternals.flatten(w.TLOSurveyInternals.answers()).role_other === 'Grandparent');

  // Decline and outside MA
  w = boot({ ok: true }); await tick();
  clickLabel(w, 'consent', "No, I'd rather not take the survey"); next(w);
  t('declining ends politely', title(w) === 'Thank you' && w.__posts.length === 0);
  w = boot({ ok: true }); await tick();
  clickLabel(w, 'consent', "Yes, I've read the information above and I'd like to take the survey"); next(w);
  clickLabel(w, 'role', 'Teacher'); clickLabel(w, 'in_ma', 'No'); next(w);
  t('outside Massachusetts ends', $(w, '.sv-intro').textContent.includes('Massachusetts schools') && w.__posts.length === 0);

  // Save failure keeps answers and lets them retry
  w = boot({ ok: false, error: 'x' }); await tick();
  clickLabel(w, 'consent', "Yes, I've read the information above and I'd like to take the survey"); next(w);
  clickLabel(w, 'role', 'Teacher'); clickLabel(w, 'in_ma', 'Yes'); next(w);
  const s4 = $(w, '.sv-select'); s4.value = 'Concord'; s4.dispatchEvent(new w.Event('change'));
  for (let i = 0; i < 5; i++) next(w);
  next(w); await tick(); await tick();
  t('failure shows message and re-enables', $(w, '.sv-error').textContent.includes("couldn't save") && !$(w, '.sv-next').disabled);

  console.log(`\n${pass} passed, ${fail} failed`);
})();
