/* Shared helpers for the live data on the site: communities, events and the
   "near you" searches. Kept in one file so the distance maths, the ZIP lookup
   and the community list cannot drift apart between pages. */
window.TLO = (function(){

  /* Pages in a folder (privacy/, community-grants/) load this file as
     ../assets/nearby.js, so data paths are worked out from this script's own
     address rather than the page's. */
  var BASE = (function(){
    var s = document.currentScript && document.currentScript.src;
    return s ? s.replace(/assets\/nearby\.js(\?.*)?$/, '') : '';
  })();

  /* Escape text before putting it into the page, so a stray quote or angle
     bracket in a title from Four Norms cannot break the markup. */
  function esc(t){
    return String(t == null ? '' : t).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  /* Straight-line distance in miles between two points on the globe. */
  function miles(lat1, lon1, lat2, lon2){
    var R = 3958.8, rad = Math.PI / 180;
    var dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1*rad) * Math.cos(lat2*rad) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  /* The ZIP table is a large file, so it is fetched only when someone
     actually searches, and then kept for the rest of the visit. */
  var zipTable = null;
  function lookupZip(zip){
    if (!/^\d{5}$/.test(zip)) return Promise.reject(new Error('bad-zip'));
    var get = zipTable
      ? Promise.resolve(zipTable)
      : fetch(BASE + 'data/zip-coords.json')
          .then(function(r){ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
          .then(function(d){ zipTable = d; return d; });
    return get.then(function(table){
      var here = table[zip];
      if (!here) throw new Error('unknown-zip');
      return here;
    });
  }

  /* "1 mile" / "6 miles" - avoids the "1 miles" slip. */
  function milesLabel(m){
    var r = Math.round(m);
    if (r === 0) return 'under a mile';
    return r + (r === 1 ? ' mile' : ' miles');
  }

  /* A whole phrase, so "0 miles" never reaches the page and "about" is not
     glued onto "under a mile". */
  function distancePhrase(m){
    var r = Math.round(m);
    if (r === 0) return 'under a mile away';
    return 'about ' + milesLabel(m) + ' away';
  }

  function place(g){
    if (!g || !g.city) return '';
    return g.state ? g.city + ', ' + g.state : g.city;
  }

  /* Sort a list of things that have lat/lon by distance from a point,
     adding a _miles property to each. */
  function byDistance(items, here){
    items.forEach(function(x){
      x._miles = (typeof x.lat === 'number' && typeof x.lon === 'number')
        ? miles(here[0], here[1], x.lat, x.lon) : Infinity;
    });
    return items.sort(function(a, b){ return a._miles - b._miles; });
  }


  /* The full community list: the Massachusetts groups Four Norms returns, plus
     the hand-maintained rows in data/communities-extra.json for groups that are
     real but not registered on Four Norms yet. A supplement row is dropped
     automatically once a matching community appears in the live data, so the
     same place never shows twice. Groups outside Massachusetts are left out.

     Each community gets two links where we have them: fournorms_url, its page
     on Four Norms, and website, its own site (from the "websites" table in
     communities-extra.json, keyed by Four Norms slug). Slugs listed under
     "hide" in that file are never shown. */
  var STATE = 'MA';
  function loadCommunities(){
    return Promise.all([
      loadJSON('data/groups.json').catch(function(){ return {groups: []}; }),
      loadJSON('data/communities-extra.json').catch(function(){ return {communities: [], websites: {}}; })
    ]).then(function(res){
      var sites = res[1].websites || {};
      var hide = res[1].hide || [];
      var live = (res[0].groups || []).filter(function(g){
        return g.city && g.state === STATE && hide.indexOf(g.slug) === -1;
      });
      live.forEach(function(g){
        g.registered = true;
        g.fournorms_url = g.web_url || null;
        g.website = sites[g.slug] || null;
      });

      var seen = {};
      live.forEach(function(g){ seen[g.city.toLowerCase()] = true; });

      var extra = (res[1].communities || []).filter(function(c){
        return c.city && c.state === STATE && !seen[c.city.toLowerCase()];
      });

      return live.concat(extra).sort(function(a, b){
        return a.city.localeCompare(b.city) ||
          (a.display_name || a.name || '').localeCompare(b.display_name || b.name || '');
      });
    });
  }

  /* Longitude/latitude to a point on the Massachusetts map in assets/ma-map.js.
     Same Mercator projection the map outline was drawn with. */
  function maProject(lat, lon){
    var m = window.TLO_MA;
    var rad = Math.PI / 180;
    return [m.ox + m.k * lon * rad,
            m.oy - m.k * Math.log(Math.tan(Math.PI / 4 + lat * rad / 2))];
  }

  /* Short descriptions for resource cards, taken from the Four Norms library
     (data/library.json) so they always match what Four Norms says. Any card
     in `selector` whose title links to a library item and has no text of its
     own gets that item's description added under the title. */
  function addLibraryBlurbs(selector, maxLen){
    var cards = [].slice.call(document.querySelectorAll(selector));
    if (!cards.length) return;
    loadJSON('data/library.json').then(function(d){
      var bySlug = {};
      (d.items || []).forEach(function(it){ bySlug[it.slug] = it; });
      cards.forEach(function(card){
        if (card.querySelector('p')) return;
        var a = card.querySelector('a[href*="/library/"]');
        var m = a && a.getAttribute('href').match(/\/library\/([a-z0-9-]+)/);
        var item = m && bySlug[m[1]];
        var text = item && String(item.description || '').replace(/\s+/g, ' ').trim();
        if (!text) return;
        var max = maxLen || 170;
        if (text.length > max) text = text.slice(0, max).replace(/\s+\S*$/, '') + '\u2026';
        var p = document.createElement('p');
        p.textContent = text;
        card.appendChild(p);
      });
    }).catch(function(){ /* titles alone still work */ });
  }

  function loadJSON(path){
    return fetch(BASE + path, {cache: 'no-cache'}).then(function(r){
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  return {esc: esc, miles: miles, milesLabel: milesLabel, distancePhrase: distancePhrase, lookupZip: lookupZip, place: place,
          loadCommunities: loadCommunities, addLibraryBlurbs: addLibraryBlurbs, maProject: maProject, base: BASE,
          byDistance: byDistance, loadJSON: loadJSON};
})();
