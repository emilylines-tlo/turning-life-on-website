/* Shared helpers for the "near you" features on the Network and Events pages.
   Kept in one file so the distance maths and the ZIP lookup cannot drift apart. */
window.TLO = (function(){

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
      : fetch('data/zip-coords.json')
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

  function loadJSON(path){
    return fetch(path, {cache: 'no-cache'}).then(function(r){
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  return {esc: esc, miles: miles, milesLabel: milesLabel, distancePhrase: distancePhrase, lookupZip: lookupZip, place: place,
          byDistance: byDistance, loadJSON: loadJSON};
})();
