/* Small behaviours shared by every page. */

/* A link to another page always opens at its top, unless it names a section
   (#join, #zip ...). Some viewers otherwise keep the old scroll position. */
(function(){
  if (location.hash) return;
  /* Leave Back and Forward alone, so they still return to where you were. */
  var nav = window.performance && performance.getEntriesByType ? performance.getEntriesByType('navigation')[0] : null;
  if (nav && nav.type === 'back_forward') return;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  var top = function(){ window.scrollTo(0, 0); };
  top();
  window.addEventListener('load', top);
})();

(function(){
  /* Mobile menu. */
  var btn = document.getElementById('menubtn');
  if (btn){
    btn.addEventListener('click', function(){
      var nav = document.getElementById('nav');
      nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', nav.classList.contains('open'));
    });
    /* Close the menu after following a link on the same page, like Join Us. */
    document.getElementById('navlist').addEventListener('click', function(e){
      if (e.target.closest('a')){
        document.getElementById('nav').classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* Tabbed groups (Get Involved): one row of buttons, one panel showing.
     Without JavaScript every panel stays visible. */
  [].slice.call(document.querySelectorAll('[data-tabs]')).forEach(function(group){
    var tabs = [].slice.call(group.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function(t){ return document.getElementById(t.getAttribute('aria-controls')); });
    function show(i, focus){
      tabs.forEach(function(t, j){
        t.setAttribute('aria-selected', String(i === j));
        t.tabIndex = i === j ? 0 : -1;
        panels[j].hidden = i !== j;
      });
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function(t, i){
      t.addEventListener('click', function(){ show(i); });
      t.addEventListener('keydown', function(e){
        if (e.key === 'ArrowRight') show((i + 1) % tabs.length, true);
        if (e.key === 'ArrowLeft') show((i - 1 + tabs.length) % tabs.length, true);
      });
    });
    show(0);
  });
})();

/* Respect "reduce motion": keep background video still. */
(function(){
  var v = document.querySelector('video.hero-bg');
  if (v && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    v.removeAttribute('autoplay');
    v.pause();
  }
})();

/* Survey invitation: pops up on the first page someone opens during a visit
   (one browser session), not again as they move between pages, and never on
   the survey itself. */
(function(){
  var KEY = 'tlo-survey-invite-seen';
  var script = document.currentScript;
  if (!script || !window.HTMLDialogElement) return;
  var surveyUrl = new URL('../survey/', script.src).href;
  var onSurvey = location.pathname.indexOf('/survey/') !== -1;

  var seen;
  try {
    seen = sessionStorage.getItem(KEY);
    sessionStorage.setItem(KEY, '1');
  } catch (e) { return; }  /* No way to remember it, so don't risk showing it on every page. */
  if (seen || onSurvey) return;

  var d = document.createElement('dialog');
  d.className = 'invite';
  d.setAttribute('aria-labelledby', 'invite-title');
  d.innerHTML =
    '<button class="invite-x" type="button" aria-label="Close">&times;</button>' +
    '<div class="kick">Statewide survey</div>' +
    '<h2 id="invite-title">technology <em>at school</em></h2>' +
    '<p>Take our statewide survey on technology at school to help inform state legislation.</p>' +
    '<div class="btns">' +
      '<a class="btn btn-orange" href="' + surveyUrl + '">Take the survey</a>' +
      '<button class="btn btn-line" type="button" data-close>Maybe later</button>' +
    '</div>';
  var close = function(){ d.close(); };
  d.querySelector('.invite-x').addEventListener('click', close);
  d.querySelector('[data-close]').addEventListener('click', close);
  /* A click on the dimmed backdrop lands on the dialog itself. */
  d.addEventListener('click', function(e){ if (e.target === d) close(); });
  d.addEventListener('close', function(){ d.remove(); });

  setTimeout(function(){
    document.body.appendChild(d);
    d.showModal();
    d.querySelector('.btn-orange').focus();
  }, 1200);
})();
