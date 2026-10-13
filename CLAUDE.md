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
| `community-grants/` | Community Grants | Static copy (not in the navigation) |
| `privacy/` | Privacy policy | Static copy |
| `pact/` | Community pact | Placeholder until the statewide pact is live |

`attend.html`, `network.html`, `resources.html` and `take-action.html` are
redirects from older addresses. Keep them so old links still work.

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
  `#F67800`, blue `#339797`, light grey `#F5F5F5`. Italics show in blue.
  Headings are lower case where the wireframe has them that way.
- **Photos are kept small**: resize to at most 1000px on the long side before
  adding them to `assets/img/`.

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
- **Smartphone Alternatives page.** Not built yet; links point at
  turninglifeon.org/smartphone-alternatives.
- **Team headshots and partner logos.** Initials and partner names stand in
  until headshots and logo permissions arrive.
