/* "Join the movement" form.
   One definition, rendered into every <div data-joinform></div> on the site, so
   the form cannot drift from page to page.

   WHERE SIGN-UPS GO: the form posts to a small Cloudflare Worker (SIGNUP_URL),
   which holds the Four Norms API key and saves the supporter. GitHub Pages
   cannot keep a key private, so the browser never talks to Four Norms itself.
   `submitSignup` below is the only function that knows about the Worker.
*/
(function(){
  var SIGNUP_URL = 'https://tlo-signup.broad-forest-8301.workers.dev/';
  var TEAM_EMAIL = 'info@turninglifeon.org';
  var NETWORK_ERROR = 'We couldn\u2019t send your sign-up just now. Please try again, or email ' + TEAM_EMAIL + '.';
  function base(){ return (window.TLO && window.TLO.base) || ''; }

  function esc(t){
    return String(t == null ? '' : t).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function markup(id){
    return '' +
    '<form class="joinform" id="' + id + '" novalidate>' +
      '<p class="tierq">How involved do you want to be?</p>' +
      '<div class="tiers">' +
        '<button class="tier" type="button" data-t="loop" aria-pressed="false">' +
          '<b>Stay in the loop.</b>' +
          '<span>A short monthly email, events near you, and a heads-up when there\'s a pact to sign or a legislator worth calling.</span></button>' +
        '<button class="tier" type="button" data-t="involved" aria-pressed="false">' +
          '<b>Get involved.</b>' +
          '<span>Join the coalition calls and work with us on what happens in your community.</span></button>' +
      '</div>' +
      '<span class="err" data-tiererr hidden></span>' +
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
      '<div class="field wide"><label for="' + id + '-grp">Join a community</label>' +
        '<select id="' + id + '-grp" name="grp"><option value="">Choose your community</option></select></div>' +
      '<div class="field wide"><label for="' + id + '-nt">What\'s going on? <i>Optional</i></label>' +
        '<textarea id="' + id + '-nt" name="nt"></textarea></div>' +
      /* Honeypot: people never see or reach this field; bots that fill every
         input do, and the Worker drops their sign-up. Off-screen rather than
         display:none, which some bots skip. */
      '<div aria-hidden="true" style="position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden">' +
        '<label for="' + id + '-website">Website</label>' +
        '<input id="' + id + '-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>' +
      '<button class="btn btn-orange submit" type="submit">Keep me posted</button>' +
      '<p class="err" role="alert" data-senderr hidden></p>' +
      '<p class="fine">A person reads every one of these. You\'ll get a welcome email right away, and a real person reads every note. We never share your info. ' +
        '<a href="' + base() + 'privacy/">Privacy policy</a></p>' +
    '</form>';
  }

  /* Communities come from the same Four Norms data as the map (Massachusetts
     only), so the list cannot go stale. */
  function fillCommunities(select){
    var api = window.TLO;
    var notListed = function(){
      var o = document.createElement('option');
      o.value = 'not-listed';
      o.textContent = "My community isn't listed yet";
      select.appendChild(o);
    };
    if (!api || typeof api.loadCommunities !== 'function'){ notListed(); return; }

    api.loadCommunities().then(function(groups){
      groups.forEach(function(g){
        if (g.slug === 'massachusetts-hq') return;
        var name = g.display_name || g.name;
        var o = document.createElement('option');
        o.value = g.slug || name || g.city;
        o.textContent = name ? name + ' (' + g.city + ')' : g.city;
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

  /* Sends the sign-up to the Worker. Resolves on { ok: true }; otherwise
     rejects with a message to show the person. */
  function submitSignup(values){
    return fetch(SIGNUP_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(values)
    }).then(function(res){
      return res.json().catch(function(){ return {}; }).then(function(data){
        if (res.ok && data && data.ok === true) return;
        if (res.status === 403) throw new Error('Sign-ups can\u2019t be sent from this page. Please email ' + TEAM_EMAIL + '.');
        throw new Error((data && data.error) || NETWORK_ERROR);
      });
    }, function(){
      throw new Error(NETWORK_ERROR);
    });
  }

  function thanks(form, firstName, tier){
    var next = (tier === 'involved')
      ? 'Watch your inbox for an invitation from Four Norms, and Adrienne will be in touch personally soon.'
      : 'Check your inbox for a welcome email from us.';
    form.innerHTML = '<p class="thanks">Thanks, ' + esc(firstName) + '. ' + next + ' In the meantime, ' +
      '<a href="' + base() + 'communities.html#find">find your local group</a> or ' +
      '<a href="' + base() + 'events.html#upcoming">see upcoming events</a>.</p>';
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
      var button = form.querySelector('.submit');
      var sendErr = form.querySelector('[data-senderr]');
      if (button.disabled) return;
      sendErr.hidden = true;
      if (!validate(form)) return;
      var tier = form.querySelector('.tier[aria-pressed="true"]').dataset.t;
      var first = (form.elements.fn.value || '').trim();
      var label = button.textContent;
      button.disabled = true;
      button.textContent = 'Sending\u2026';
      submitSignup({
        fn: first,
        ln: (form.elements.ln.value || '').trim(),
        em: (form.elements.em.value || '').trim(),
        zip: (form.elements.zip.value || '').trim(),
        grp: form.elements.grp.value,
        nt: (form.elements.nt.value || '').trim(),
        tier: tier,
        website: form.elements.website.value
      }).then(function(){
        thanks(form, first, tier);
      }, function(err){
        button.disabled = false;
        button.textContent = label;
        sendErr.textContent = (err && err.message) || NETWORK_ERROR;
        sendErr.hidden = false;
      });
    });
  }

  var n = 0;
  [].slice.call(document.querySelectorAll('[data-joinform]')).forEach(function(host){
    var id = 'join' + (++n);
    host.innerHTML = markup(id);
    wire(document.getElementById(id));
  });
})();
