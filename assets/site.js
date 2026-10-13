/* Small behaviours shared by every page. */
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
