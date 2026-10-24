# Turning Life On — website

Static HTML site for [turninglifeon.org](https://www.turninglifeon.org), a
Massachusetts 501(c)(3) helping local leaders build grassroots digital-wellness
movements. Seven main pages plus grants, privacy and pact pages. No framework, no build step.

**This repository is live.** Anything pushed to `main` publishes to
https://emilylines-tlo.github.io/turning-life-on-website/ within about a minute.
There is no staging step, so check before you push.

---

## The pages

| File | Page | What drives it |
| --- | --- | --- |
| `index.html` | Home | Static copy; the sign-up form's community list |
| `about.html` | About | Static copy |
| `communities.html` | Communities | Live: Massachusetts map, ZIP search, directory |
| `learn.html` | Learn | Static copy; links into the Four Norms library |
| `get-involved.html` | Get Involved | Static copy |
| `events.html` | Events | Live: upcoming events grid |
| `support.html` | Support | Static copy |
| `jch.html` | Dr. Jared Cooney Horvath speaker event | Static copy; dates and registration links read from `data/events.json` (not in the navigation). **Follows the event design, not the site's usual look** — see below |
| `community-grants/` | Community Grants | Static copy (not in the navigation) |
| `privacy/` | Privacy policy | Static copy |
| `pact/` | Community pact | Placeholder until the statewide pact is live |
| `smartphone-alternatives/` | Smartphone Alternatives | Static copy from Tech-Wise Arlington's research (not in the navigation) |

`attend.html`, `network.html`, `resources.html`, `take-action.html` and
`turning-life-on-resources/smartphone-alternatives/` are redirects from older
addresses. Keep them so old links still work.

`jch.html` is the exception among the old addresses: it used to redirect, but
Four Norms points both Horvath events at `/jch`, so it is a real page again and
is deliberately absent from the map in `scripts/make-redirects.py`. The event
banner on the home page and the two night cards on that page both read their
dates from `data/events.json` and disappear on their own once the dates pass.
Each event's **venue** is written into the HTML, because the Four Norms API
returns `location_name` as null for both.

`jch.html` is also the one page that **deliberately departs from the site's
visual conventions**, because it follows the approved event design: headings are
Source Serif 4 rather than Poppins, in sentence case rather than lower case, and
the sections alternate teal `#349697` with a warm cream `#F9F8F4` instead of the
usual `#F5F5F5`. The design's other two shades, `#215F5D` and `#B35702`, appear
nowhere else. Every one of those values was sampled from the design file rather
than matched by eye. All of it is scoped under `body.jch` so none of it reaches
another page — keep it that way, and do not copy these styles outwards.

Every page has a `<section id="join">` holding the sign-up form; the **Join Us**
button in the navigation and **Sign up** in the footer jump to it.

---

## How the live data works — read this before touching anything in `data/`

The site pulls group, event and library data from the **Four Norms API**.

**A visitor's browser cannot call that API directly.** Four Norms sends no CORS
headers, so a `fetch()` from the page is blocked by the browser. This is a
restriction on their end and cannot be coded around.

So the data is fetched ahead of time instead:

```
GitHub Actions (twice daily)
  └─ scripts/fetch-fournorms.py
       └─ writes data/*.json into the repo
            └─ pages read those files same-origin
```

- `data/events.json` — upcoming events
- `data/groups.json` — coalition communities (map, directory, town chips)
- `data/library.json` — resource library
- `data/communities-extra.json` — **the one hand-maintained file in `data/`.**
  Massachusetts groups not yet registered on Four Norms, each group's own
  website keyed by Four Norms slug, and a `hide` list of Four Norms slugs
  never shown on the site. The fetch script never touches it.
- `data/zip-coords.json` — US ZIP centroids from the 2023 Census gazetteer,
  used for the "near you" searches. Loaded only when someone searches.

**Apart from `communities-extra.json`, `data/*.json` is generated output. Never edit it by hand** — the next
scheduled run overwrites your change and no one will know why it reverted.
To change what ends up there, change `scripts/fetch-fournorms.py`.

To run the fetch yourself: `python3 scripts/fetch-fournorms.py`. Without an API
key it will fetch events and library (both public) and skip groups.

**The API key lives in GitHub repository secrets as `FOURNORMS_API_KEY`.** It is
never committed, never pasted into a file, and never sent by email. If you need
one, ask rather than reusing someone else's.

---

## Rules that matter

**Never hardcode something that comes from `data/`.** If a town list, an event
date or a resource title is typed into a page, it is correct on the day it is
written and silently wrong afterwards. Read it from the JSON instead. The
helpers in `assets/nearby.js` make this short.

**The Groups API returns fields that must never reach a public page:**
`leadership` (Community Lead names and email addresses), `engagement`,
`membership` (member and supporter counts) and `purpose`. `fetch-fournorms.py`
uses an allow-list — only the named fields are written out, everything else is
discarded. Keep it that way. Groups with `discoverable: false` are excluded.

**Verify every factual claim before it goes on a page, and cite the source
inline.** Statistics about children, schools and legislation are the core of
TLO's credibility with school committees and legislators. A figure that does not
survive a reader checking it undermines the accurate ones beside it. Include the
publisher and date in a `<p class="src">` line.

**Never publish a quote attributed to a person unless that person approved it.**
Placeholder or illustrative quotes must not ship, even with a note attached.

**Resource library exclusions** live in `LIBRARY_EXCLUDE` in
`scripts/fetch-fournorms.py`. Items listed there are dropped when the data file
is built, so they never reach a visitor's browser. Add a slug there to withhold
something.

---

## Working locally

**You need a local web server.** Opening a page with `file://` looks like it
works, but the browser blocks the `fetch()` calls, so the map, events, town list
and resource library all come up empty. From the repo folder:

```
python3 -m http.server 8000
```

Then open http://localhost:8000. Stop it with Ctrl-C.

---

## Conventions

- **Shared CSS lives in `assets/site.css`**; each page's own `<style>` block
  holds only what is specific to that page. Brand colors are the variables at
  the top of `site.css`.
- **The header and footer are stamped in by `python3 scripts/apply-shell.py`.**
  Change the navigation or footer there, run it, and every page updates.
- **Shared JavaScript lives in `assets/nearby.js`** (`TLO.esc`, `TLO.miles`,
  `TLO.lookupZip`, `TLO.loadJSON`, `TLO.loadCommunities`, `TLO.byDistance`,
  `TLO.distancePhrase`, `TLO.maProject`). Distance, ZIP and community logic
  belongs there, not copied into a page. `assets/join.js` is the sign-up form,
  `assets/site.js` the mobile menu and tabs, and `assets/ma-map.js` the
  Massachusetts outline for the map (generated from US Census boundaries).
- **Only Massachusetts communities appear on the site.** `TLO.loadCommunities`
  filters on `state === "MA"`.
- **Escape anything from the API before putting it in the DOM** — `TLO.esc()`.
- **External scripts need a correct Subresource Integrity hash.** A wrong hash
  does not error visibly; the browser silently refuses to load the file. Verify
  with `openssl dgst -sha512 -binary file | openssl base64 -A`.
- **Photos belong in `assets/img/`.** Do not hot-link images from elsewhere.
- Fonts are Poppins (headings) and Mulish (body). Brand colors: orange
  `#F67800`, blue `#339797`, light grey `#F5F5F5`. Emphasized words in headings
  show in teal, upright (not italic). All buttons are orange. Headings are lower
  case where the wireframe has them that way.
- **Partner logos** live in `assets/img/partners/`, used with each partner's
  permission and never recolored. Logos published only in white sit on a dark
  tile (`<li class="dark">`).
- **Photos are kept small**: resize to at most 1000px on the long side before
  adding them to `assets/img/`. Full-width hero backgrounds (`about-hero.jpg`,
  `events-hero.jpg`) are the exception, at up to 1600px.
- **Issue tabs** (Learn, Get Involved) use the shared `.itabs` / `.ipanel` /
  `.icards` classes in `site.css` and the tab script in `site.js`, modeled on
  Tech-Wise Arlington's AI for Parents page. Without JavaScript every panel shows.

---

## Publishing and undoing

```
git add -A
git commit -m "what changed and why"
git push
```

Wait about a minute, then reload the live URL.

Nothing is ever lost. To undo a change that has already published:

```
git log --oneline          # find the commit
git revert <commit-hash>   # make a new commit undoing it
git push
```

---

## Currently undecided

- **Member sign-up.** The form on the home page opens an email to
  info@turninglifeon.org as an interim. The intended destination is the Four
  Norms Supporters API, which needs a host that can run server-side code
  (Cloudflare Pages or Netlify) so the API key stays private. GitHub Pages
  cannot do this. Swapping it is `submitSignup` in `assets/join.js`.
- **Per-issue pages.** The home page describes four issues; none has its own
  page yet, and the links point at existing pages instead.
- **Smartphone Alternatives prices.** Every device shows the date its price
  was checked on the manufacturer's own site. Re-check before those dates get
  stale, and send Jeff Miller (Tech-Wise Arlington) changes for an accuracy
  pass. Never change a verdict to suit a discount code. Jeff's build brief is
  internal and stays out of this repo.
- **Team headshots** live in `assets/img/team/` as 400px squares. Jennifer
  Henderson still shows initials until her photo arrives.
