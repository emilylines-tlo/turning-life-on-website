# Getting set up on the Turning Life On website

Everything you need to make your first change and publish it. About twenty
minutes, most of it waiting on installers.

The project rules — how the live data works, what must never be published, local
preview — are in [CLAUDE.md](CLAUDE.md), which Claude reads automatically when
you work in this folder. Read it once yourself too; it is short.

---

## 1. Get access

Ask Emily (emilyl@turninglifeon.org) to add your GitHub account to
**emilylines-tlo/turning-life-on-website** as a collaborator. You will get an
email invitation — **you have to accept it** before anything below will work.

If you do not have a GitHub account, make one first at https://github.com/signup.

---

## 2. Install the two tools

**GitHub CLI** — handles logging in, so you never deal with tokens.

```
brew install gh
```

No Homebrew? Download the `.pkg` from https://github.com/cli/cli/releases/latest
and double-click it.

Then log in and let git use it:

```
gh auth login        # GitHub.com → HTTPS → Yes → Login with a web browser
gh auth setup-git
```

**Python 3** — already on macOS. Check with `python3 --version`.

---

## 3. Get the site onto your machine

```
gh repo clone emilylines-tlo/turning-life-on-website
cd turning-life-on-website
```

---

## 4. Look at it before you change anything

**A local web server is required.** Double-clicking an HTML file appears to work
but the browser blocks the data calls, so the map, events, town list and
resource library will all be empty and you will think something is broken.

```
python3 -m http.server 8000
```

Open http://localhost:8000. Ctrl-C to stop.

Compare against the live site: https://emilylines-tlo.github.io/turning-life-on-website/

---

## 5. Make a change and publish it

Edit a file, refresh your browser to check, then:

```
git add -A
git commit -m "short note on what changed and why"
git push
```

Give it a minute and reload the live URL.

**There is no staging site.** Pushing to `main` publishes. Check locally first.

**Nothing is ever lost.** To undo something already published:

```
git log --oneline
git revert <commit-hash>
git push
```

---

## 6. Before you start building

Three things that are easy to get wrong here and expensive to fix afterwards.

**The town lists, event dates and resource entries are live.** They come from
the Four Norms API via a scheduled job, not from the page source. If you type
one into a page it will be correct today and quietly wrong later. `CLAUDE.md`
explains how to read them properly.

**Facts on this site get checked by school committees and legislators.** Verify
every statistic against its primary source before it ships, and cite the
publisher and date next to it. One figure that does not hold up damages the
accurate ones around it.

**Quotes need the person's approval.** No placeholder or illustrative quotes,
even labelled ones.

---

## Who to ask

- **Access, publishing, anything broken** — Emily, emilyl@turninglifeon.org
- **Content, copy, what the board wants** — Adrienne
- **Four Norms API, group and event data** — Matt at Four Norms
