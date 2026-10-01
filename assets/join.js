/* "Join the movement" form.
   One definition, rendered into every <div data-joinform></div> on the site, so
   the form cannot drift from page to page.

   WHERE SIGN-UPS GO: for now, submitting opens an email to the team. The
   intended destination is the Four Norms Supporters API, which needs a host
   that can run server-side code so the API key stays private. GitHub Pages
   cannot. When that moves, `submitSignup` below is the only function to change.
*/
(function(){
  var TEAM_EMAIL = 'info@turninglifeon.org';
  var PRIVACY = 'privacy/';

  function esc(t){
    return String(t == null ? '' : t).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function markup(id){
    return '' +
    '<form class="joinform" id="' + id + '" novalidate>' +
      '<div class="field"><label for="' + id + '-fn">First name</label>' +
        '<input id="' + id + '-fn" name="fn" type="text" autocomplete="given-name" required>' +
        '<span class="err" hidden></span></div>' +
      '<div class="field"><label for="' + id + '-ln">Last name</label>' +
        '<input id="' + id + '-ln" name="ln" type="text" autocomplete="family-name" required>' +
        '<span class="err" hidden></span></div>' +
      '<div class="field"><label for="' + id + '-em">Email</label>' +
        '<input id="' + id + '-em" name="em" type="email" autocomplete="email" required>' +
        '<span class="err" hidden></span></div>' +
      '<div class="field"><label for="' + id + '-zip">Zip code</label>' +
        '<input id="' + id + '-zip" name="zip" type="text" inputmode="numeric" maxlength="5" autocomplete="postal-code" required>' +
        '<span class="err" hidden></span></div>' +
      '<div class="field wide"><label for="' + id + '-grp">Join a community <i>Optional</i></label>' +
        '<select id="' + id + '-grp" name="grp"><option value="">Choose your community</option></select></div>' +
      '<div class="field wide"><label for="' + id + '-nt">What\'s going on? <i>Optional</i></label>' +
        '<textarea id="' + id + '-nt" name="nt"></textarea></div>' +
      '<p class="tierq">How involved do you want to be?</p>' +
      '<div class="tiers">' +
        '<button class="tier" type="button" data-t="loop" aria-pressed="false">' +
          '<b>Stay in the loop</b>' +
          '<span>A short monthly email, events near you, and a heads-up when there\'s a pact to sign or a legislator worth calling.</span></button>' +
        '<button class="tier" type="button" data-t="involved" aria-pressed="false">' +
          '<b>Get involved</b>' +
          '<span>Join the coalition calls and work with us on what happens in your community.</span></button>' +
      '</div>' +
      '<span class="err" data-tiererr hidden></span>' +
      '<button class="btn btn-orange submit" type="submit">Keep me posted</button>' +
      '<p class="note">A person reads every one of these. No automated sequence, and we never share your info. ' +
        '<a href="' + PRIVACY + '">Privacy policy</a></p>' +
    '</form>';
  }

  /* Communities come from the same Four Norms data as the map, so the list
     cannot go stale. */
  function fillCommunities(select){
    var api = window.TLO;
    var notListed = function(){
      var o = document.createElement('option');
      o.value = 'not-listed';
      o.textContent = "My community isn't listed yet";
      select.appendChild(o);
    };
    if (!api || typeof api.loadJSON !== 'function'){ notListed(); return; }

    api.loadJSON('data/groups.json').then(function(d){
      var groups = (d.groups || []).filter(function(g){ return g.city; });
      groups.forEach(function(g){
        var o = document.createElement('option');
        o.value = g.slug || g.display_name || g.name;
        o.textContent = (g.display_name || g.name) + ' (' + g.city + ')';
        select.appendChild(o);
      });
      notListed();
    }).catch(notListed);
  }

  function fieldError(input, message){
    var wrap = input.closest('.field');
    var slot = wrap && wrap.querySelector('.err');
    if (!slot) return;
    slot.textContent = message || '';
    slot.hidden = !message;
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function validate(form){
    var ok = true;
    var required = [
      ['fn', 'Please add your first name.'],
      ['ln', 'Please add your last name.'],
      ['em', 'Please add your email.'],
      ['zip', 'Please add your zip code.']
    ];
    required.forEach(function(pair){
      var el = form.elements[pair[0]];
      var v = (el.value || '').trim();
      var msg = '';
      if (!v) msg = pair[1];
      else if (pair[0] === 'em' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) msg = 'That email does not look right.';
      else if (pair[0] === 'zip' && !/^\d{5}$/.test(v)) msg = 'Please use a 5 digit zip code.';
      fieldError(el, msg);
      if (msg && ok){ ok = false; el.focus(); }
    });

    var tier = form.querySelector('.tier[aria-pressed="true"]');
    var tierErr = form.querySelector('[data-tiererr]');
    tierErr.textContent = tier ? '' : 'Please choose how involved you want to be.';
    tierErr.hidden = !!tier;
    if (!tier) ok = false;

    return ok;
  }

  /* The one function to replace once sign-ups can reach Four Norms directly. */
  function submitSignup(values){
    var lines = [
      'How involved: ' + (values.tier === 'involved' ? 'Get involved' : 'Stay in the loop'),
      'Name: ' + values.fn + ' ' + values.ln,
      'Email: ' + values.em,
      'Zip code: ' + values.zip,
      'Community: ' + (values.grp || 'not given'),
      ''
    ];
    if (values.stuck) lines.push('Feeling stuck: ' + values.stuck, '');
    if (values.nt) lines.push(values.nt);

    window.location.href = 'mailto:' + TEAM_EMAIL +
      '?subject=' + encodeURIComponent('Join the movement: ' + (values.tier === 'involved' ? 'Get involved' : 'Stay in the loop')) +
      '&body=' + encodeURIComponent(lines.join('\n'));
    return Promise.resolve();
  }

  function thanks(form, firstName){
    form.innerHTML = '<p class="thanks">Thanks, ' + esc(firstName) + '. A real person on our team ' +
      'will read this, and if you chose "Get involved," we\'ll be in touch soon. In the meantime, ' +
      '<a href="communities.html">find your local community</a> or ' +
      '<a href="attend.html">see upcoming events</a>.</p>';
  }

  function wire(form){
    var tiers = [].slice.call(form.querySelectorAll('.tier'));
    tiers.forEach(function(b){
      b.addEventListener('click', function(){
        tiers.forEach(function(o){ o.setAttribute('aria-pressed', String(o === b)); });
        form.querySelector('.submit').textContent =
          b.dataset.t === 'involved' ? 'Count me in' : 'Keep me posted';
        form.querySelector('[data-tiererr]').hidden = true;
      });
    });

    fillCommunities(form.elements.grp);

    form.addEventListener('submit', function(e){
      e.preventDefault();
      if (!validate(form)) return;
      var tier = form.querySelector('.tier[aria-pressed="true"]');
      var first = (form.elements.fn.value || '').trim();
      submitSignup({
        fn: first,
        ln: (form.elements.ln.value || '').trim(),
        em: (form.elements.em.value || '').trim(),
        zip: (form.elements.zip.value || '').trim(),
        grp: form.elements.grp.value,
        nt: (form.elements.nt.value || '').trim(),
        tier: tier.dataset.t,
        stuck: form.dataset.stuck || ''
      }).then(function(){ thanks(form, first); });
    });
  }

  var n = 0;
  [].slice.call(document.querySelectorAll('[data-joinform]')).forEach(function(host){
    var id = 'join' + (++n);
    host.innerHTML = markup(id);
    wire(document.getElementById(id));
  });
})();
