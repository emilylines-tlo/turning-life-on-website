# Turning Life On — website

Static HTML site for [turninglifeon.org](https://www.turninglifeon.org), a
Massachusetts 501(c)(3) helping local leaders build grassroots digital-wellness
movements. Seven pages, no framework, no build step.

**This repository is live.** Anything pushed to `main` publishes to
https://emilylines-tlo.github.io/turning-life-on-website/ within about a minute.
There is no staging step, so check before you push.

---

## The pages

| File | Page | What drives it |
| --- | --- | --- |
| `index.html` | Home | Live: next event, list of towns |
| `about.html` | About | Static copy |
| `take-action.html` | Take Action | Static copy |
| `network.html` | Network | Live: map, ZIP search, directory |
| `resources.html` | Resources | Live: resource library |
| `events.html` | Events | Live: event list, "what's happening near you" |
| `support.html` | Support | Static copy |

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
- `data/zip-coords.json` — US ZIP centroids from the 2023 Census gazetteer,
  used for the "near you" searches. Loaded only when someone searches.

**`data/*.json` is generated output. Never edit it by hand** — the next
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

- **CSS is inlined in each page's `<style>` block.** This is duplicated across
  pages and is known debt; when changing shared styling — header, footer,
  buttons — change every page, or the site splits visually at the seams.
- **Shared JavaScript lives in `assets/nearby.js`** (`TLO.esc`, `TLO.miles`,
  `TLO.lookupZip`, `TLO.loadJSON`, `TLO.byDistance`, `TLO.distancePhrase`).
  Distance and ZIP logic belongs there, not copied into a page.
- **Escape anything from the API before putting it in the DOM** — `TLO.esc()`.
- **External scripts need a correct Subresource Integrity hash.** A wrong hash
  does not error visibly; the browser silently refuses to load the file. Verify
  with `openssl dgst -sha512 -binary file | openssl base64 -A`.
- **Photos belong in `assets/img/`.** Do not hot-link images from elsewhere.
- Fonts are Poppins (headings) and Mulish (body). Brand colors are defined as
  CSS variables at the top of each page.

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
  cannot do this. Swapping it is one function in `index.html`.
- **Per-issue pages.** The home page describes four issues; none has its own
  page yet, and the links point at existing pages instead.
- **Brand values.** Colors and fonts are close approximations pending exact
  values from the previous Squarespace site.
- **Photos.** `assets/img/hero.jpg`, `gathering.jpg` and `donate.jpg` are
  referenced but do not exist. Each slot falls back to a placeholder describing
  the shot needed; drop the file in and it appears.
