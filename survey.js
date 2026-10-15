/* Turning Life On survey renderer. Reads window.TLO_SURVEY (questions.js),
   shows one section per screen, applies role branching and skip logic,
   and sends one flat row of answers to a Google Apps Script web app. */
(function () {
  'use strict';
  var S = window.TLO_SURVEY;
  var answers = {};
  var districts = null;
  var step = 0;
  var root;

  // ---------- helpers (exposed for tests) ----------
  function roleGroup(a) {
    if (!a.role) return null;
    if (S.roleGroups.parent.indexOf(a.role) > -1) return 'parent';
    return 'educator';
  }
  function isTSA(a) { return S.roleGroups.teacherStaffAdmin.indexOf(a.role) > -1; }
  function pick(v, a) {
    if (v && typeof v === 'object' && !Array.isArray(v)) return roleGroup(a) === 'parent' ? v.parent : v.educator;
    return v;
  }
  function visible(q, a) {
    if (q.only === 'parent' && roleGroup(a) !== 'parent') return false;
    if (q.only === 'educator' && roleGroup(a) !== 'educator') return false;
    if (q.only === 'teacherStaffAdmin' && !isTSA(a)) return false;
    if (q.showIf && !q.showIf(a)) return false;
    return true;
  }
  function visibleSections(a) {
    // Before the role is known, only show welcome and role.
    return S.sections.filter(function (s, i) {
      if (i > 1 && !a.role) return false;
      return s.questions.some(function (q) { return visible(q, a); });
    });
  }
  function flatten(a) {
    var row = { survey_id: S.id, role_group: roleGroup(a) || '' };
    S.sections.forEach(function (s) {
      s.questions.forEach(function (q) {
        if (q.type === 'note') return;
        var shown = visible(q, a);
        if (q.type === 'grid') {
          q.rows.forEach(function (r) { var k = q.id + '__' + r[0]; row[k] = shown && a[k] ? a[k] : ''; });
          return;
        }
        var v = shown ? a[q.id] : '';
        if (Array.isArray(v)) v = v.join('; ');
        row[q.id] = v == null ? '' : String(v);
        if (q.other) row[q.id + '_other'] = shown && a[q.id] === q.other ? (a[q.id + '_other'] || '') : '';
      });
    });
    return row;
  }
  // Remove answers to questions that are no longer shown (e.g. after changing role).
  function prune(a) {
    S.sections.forEach(function (s) {
      s.questions.forEach(function (q) {
        if (visible(q, a)) return;
        if (q.type === 'grid') q.rows.forEach(function (r) { delete a[q.id + '__' + r[0]]; });
        delete a[q.id]; delete a[q.id + '_other'];
      });
    });
  }

  // ---------- rendering ----------
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'class') n.className = attrs[k];
      else if (k.indexOf('on') === 0) n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function choice(q, type, value, checked, onChange) {
    var id = 'f_' + q.id + '_' + Math.random().toString(36).slice(2, 8);
    var input = el('input', { type: type, name: q.id, id: id, value: value });
    input.checked = !!checked;
    input.addEventListener('change', onChange);
    return el('label', { class: 'sv-choice', for: id }, [input, el('span', { text: value })]);
  }
  function renderQuestion(q) {
    var a = answers;
    var type = pick(q.type, a);
    var text = pick(q.text, a);
    if (type === 'note') return el('p', { class: 'sv-note', text: text });
    var fs = el('fieldset', { class: 'sv-q', 'data-q': q.id });
    fs.appendChild(el('legend', { text: text + (q.req ? ' *' : '') }));
    if (q.help) fs.appendChild(el('p', { class: 'sv-help', text: pick(q.help, a) }));
    if (type === 'single') {
      q.options.forEach(function (o) {
        fs.appendChild(choice(q, 'radio', o, a[q.id] === o, function () { a[q.id] = o; prune(a); refreshConditional(); }));
      });
      if (q.other) {
        var oi = el('input', { type: 'text', class: 'sv-text sv-other', 'aria-label': 'Please describe', maxlength: '200', placeholder: 'Please describe' });
        oi.value = a[q.id + '_other'] || '';
        oi.addEventListener('input', function () { a[q.id + '_other'] = oi.value; });
        fs.appendChild(oi);
      }
    } else if (type === 'multi') {
      var cur = Array.isArray(a[q.id]) ? a[q.id] : [];
      var excl = q.exclusive || [];
      q.options.forEach(function (o) {
        fs.appendChild(choice(q, 'checkbox', o, cur.indexOf(o) > -1, function (e) {
          var list = Array.isArray(a[q.id]) ? a[q.id].slice() : [];
          if (e.target.checked) {
            if (excl.indexOf(o) > -1) list = [o];
            else list = list.filter(function (x) { return excl.indexOf(x) === -1; }).concat([o]);
          } else list = list.filter(function (x) { return x !== o; });
          a[q.id] = list;
          fs.querySelectorAll('input[type=checkbox]').forEach(function (cb) { cb.checked = list.indexOf(cb.value) > -1; });
          prune(a); refreshConditional();
        }));
      });
    } else if (type === 'dropdown') {
      var sel = el('select', { class: 'sv-select', 'aria-label': text });
      sel.appendChild(el('option', { value: '', text: 'Choose one' }));
      (districts || []).concat(q.extra || []).forEach(function (o) {
        var opt = el('option', { value: o, text: o }); if (a[q.id] === o) opt.selected = true; sel.appendChild(opt);
      });
      if (!districts) {
        var t = el('input', { type: 'text', class: 'sv-text', placeholder: 'Type your school district' });
        t.value = a[q.id] || '';
        t.addEventListener('input', function () { a[q.id] = t.value.trim(); });
        fs.appendChild(t);
      } else {
        sel.addEventListener('change', function () { a[q.id] = sel.value; });
        fs.appendChild(sel);
      }
    } else if (type === 'grid') {
      var tbl = el('div', { class: 'sv-grid', role: 'group' });
      q.rows.forEach(function (r) {
        var key = q.id + '__' + r[0];
        var row = el('fieldset', { class: 'sv-grid-row' }, [el('legend', { text: r[1] })]);
        var opts = el('div', { class: 'sv-grid-opts' });
        q.scale.forEach(function (o) {
          opts.appendChild(choice({ id: key }, 'radio', o, a[key] === o, function () { a[key] = o; }));
        });
        row.appendChild(opts); tbl.appendChild(row);
      });
      fs.appendChild(tbl);
    } else if (type === 'longtext') {
      var ta = el('textarea', { class: 'sv-textarea', rows: '4', maxlength: '3000', 'aria-label': text });
      ta.value = a[q.id] || '';
      ta.addEventListener('input', function () { a[q.id] = ta.value; });
      fs.appendChild(ta);
    } else if (type === 'zip') {
      var z = el('input', { type: 'text', inputmode: 'numeric', maxlength: '5', class: 'sv-text sv-zip', 'aria-label': text, autocomplete: 'postal-code' });
      z.value = a[q.id] || '';
      z.addEventListener('input', function () { z.value = z.value.replace(/\D/g, '').slice(0, 5); a[q.id] = z.value; });
      fs.appendChild(z);
    }
    return fs;
  }
  function refreshConditional() {
    // Re-render the current section so conditional questions appear or disappear.
    var keepScroll = window.scrollY;
    render();
    window.scrollTo(0, keepScroll);
  }
  function render() {
    var secs = visibleSections(answers);
    if (step >= secs.length) step = secs.length - 1;
    var s = secs[step];
    root.innerHTML = '';
    var pct = Math.round((step / Math.max(1, secs.length - 1)) * 100);
    root.appendChild(el('div', { class: 'sv-progress', role: 'progressbar', 'aria-valuenow': String(pct), 'aria-valuemin': '0', 'aria-valuemax': '100' }, [el('span', { style: 'width:' + pct + '%' })]));
    root.appendChild(el('h2', { class: 'sv-title', text: s.title }));
    if (s.reminder && roleGroup(answers) === 'parent') root.appendChild(el('p', { class: 'sv-reminder', text: s.reminder }));
    (s.intro || []).forEach(function (p) { root.appendChild(el('p', { class: 'sv-intro', text: p })); });
    s.questions.forEach(function (q) { if (visible(q, answers)) root.appendChild(renderQuestion(q)); });
    var err = el('p', { class: 'sv-error', role: 'alert' });
    root.appendChild(err);
    var last = step === secs.length - 1;
    var nav = el('div', { class: 'sv-nav' });
    if (step > 0) nav.appendChild(el('button', { type: 'button', class: 'sv-btn sv-back', text: 'Back', onclick: function () { step--; render(); window.scrollTo(0, root.offsetTop - 20); } }));
    var next = el('button', { type: 'button', class: 'sv-btn sv-next', text: last ? 'Submit' : 'Next' });
    next.addEventListener('click', function () {
      var problem = check(s);
      if (problem) { err.textContent = problem; return; }
      if (answers.consent && answers.consent.indexOf('No') === 0) return finish('declined');
      if (answers.in_ma === 'No') return finish('outside');
      if (last) return submit(next, err);
      step++; render(); window.scrollTo(0, root.offsetTop - 20);
    });
    nav.appendChild(next);
    root.appendChild(nav);
    // Honeypot: real people never see or fill this.
    var hp = el('div', { class: 'sv-hp', 'aria-hidden': 'true' }, [el('input', { type: 'text', name: 'website', tabindex: '-1', autocomplete: 'off', id: 'sv-website' })]);
    root.appendChild(hp);
  }
  function check(s) {
    for (var i = 0; i < s.questions.length; i++) {
      var q = s.questions[i];
      if (!visible(q, answers)) continue;
      var v = answers[q.id];
      if (q.req && (v == null || v === '' || (Array.isArray(v) && !v.length))) return 'Please answer the questions marked with *.';
      if (q.type === 'zip' && v && !/^\d{5}$/.test(v)) return 'Please enter a five-digit zip code, or leave it blank.';
    }
    return '';
  }
  function finish(kind) {
    root.innerHTML = '';
    var msg = {
      declined: "No problem. Thank you for stopping by. If you change your mind, you're welcome to come back anytime.",
      outside: 'Thank you. This survey is for families and educators connected to Massachusetts schools.',
      done: 'Thank you for taking the time to share your views. Your answers help us show school and state leaders what Massachusetts families and educators think.'
    }[kind];
    root.appendChild(el('h2', { class: 'sv-title', text: 'Thank you' }));
    root.appendChild(el('p', { class: 'sv-intro', text: msg }));
    if (kind === 'done') {
      if (S.emailFormUrl) root.appendChild(el('p', {}, [el('a', { class: 'sv-btn', href: S.emailFormUrl, target: '_blank', rel: 'noopener', text: 'Send me the results' })]));
      root.appendChild(el('p', { class: 'sv-help', text: "The results sign-up is a separate form, so your email can't be connected to anything you answered here." }));
      if (S.dashboardUrl) root.appendChild(el('p', {}, [el('a', { href: S.dashboardUrl, text: 'See what others are saying' })]));
    }
    window.scrollTo(0, root.offsetTop - 20);
  }
  var sending = false;
  function submit(btn, err) {
    if (sending) return;
    var hp = document.getElementById('sv-website');
    var row = flatten(answers);
    row.website = hp ? hp.value : '';
    row.submitted_at = new Date().toISOString();
    if (!S.endpoint) { err.textContent = 'This survey is not connected yet. Please try again later.'; return; }
    sending = true; btn.disabled = true; btn.textContent = 'Sending…'; err.textContent = '';
    fetch(S.endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(row) })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (d) {
        if (d && d.ok) return finish('done');
        throw new Error((d && d.error) || 'save failed');
      })
      .catch(function () {
        sending = false; btn.disabled = false; btn.textContent = 'Submit';
        err.textContent = "We couldn't save your answers just now. Please try again in a moment, or email info@turninglifeon.org.";
      });
  }

  function start() {
    root = document.getElementById('tlo-survey');
    if (!root) return;
    render();
    fetch(S.districtsUrl).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (d && d.length) { districts = d.slice().sort(); if (visibleSections(answers)[step] && visibleSections(answers)[step].id === 'school') render(); }
    }).catch(function () {});
  }

  window.TLOSurveyInternals = { roleGroup: roleGroup, visible: visible, visibleSections: visibleSections, flatten: flatten, prune: prune, answers: function () { return answers; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
