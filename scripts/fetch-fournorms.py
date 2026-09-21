#!/usr/bin/env python3
"""
Fetches Turning Life On data from the Four Norms API and saves it into the
data/ folder as plain files the website can read.

Why this exists: the Four Norms API does not allow a visitor's web browser to
call it directly (it sends no CORS permission headers). So instead of the
website asking Four Norms for data while someone is looking at the page, this
script asks Four Norms ahead of time and saves the answer. The website then
reads the saved answer, which is fast and always works.

Runs automatically via GitHub Actions. Can also be run by hand:
    python3 scripts/fetch-fournorms.py
"""

import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ORG = "turning-life-on"
BASE = "https://www.fournorms.com/api/v1"
DATA = Path(__file__).resolve().parent.parent / "data"

# Set as a GitHub Actions secret. Only needed for groups and the library;
# events are public.
API_KEY = os.environ.get("FOURNORMS_API_KEY", "").strip()


def get(path, params=None, needs_key=False):
    """Call one API endpoint and return the parsed response, or None on failure."""
    if needs_key and not API_KEY:
        print(f"  skipped {path} - no API key set")
        return None

    url = f"{BASE}{path}.json"
    if params:
        url += "?" + "&".join(f"{k}={v}" for k, v in params.items())

    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    if API_KEY:
        req.add_header("X-API-Key", API_KEY)

    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        print(f"  FAILED {path} - HTTP {e.code} {e.reason}")
    except Exception as e:
        print(f"  FAILED {path} - {e}")
    return None


def write(name, payload):
    DATA.mkdir(exist_ok=True)
    path = DATA / name
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n")
    print(f"  wrote data/{name}")


def fetch_events():
    """Upcoming events. Public endpoint, no key needed."""
    res = get(f"/organizations/{ORG}/events", {"limit": "100"})
    if not res:
        return False

    now = datetime.now(timezone.utc)
    events = []
    for e in res.get("data", []):
        if not e.get("published", True):
            continue
        start = e.get("start_time")
        if not start:
            continue
        # Skip anything already finished.
        try:
            if datetime.fromisoformat(start) < now:
                continue
        except ValueError:
            pass

        host = e.get("host") or {}
        # An event carries no coordinates of its own. When a local group hosts
        # it, host.url ends with that group's slug, which lets the website place
        # the event at the group's location. Events hosted centrally by TLO or
        # by a partner organisation have no local location at all.
        host_slug = None
        if host.get("type") == "Group" and host.get("url"):
            host_slug = host["url"].rstrip("/").rsplit("/", 1)[-1] or None

        events.append({
            "slug": e.get("slug"),
            "title": e.get("title"),
            "description": e.get("description"),
            "start_time": start,
            "end_time": e.get("end_time"),
            "virtual": bool(e.get("virtual")),
            "virtual_link": e.get("virtual_link"),
            "external_link": e.get("external_link"),
            "location_name": e.get("location_name"),
            "location_notes": e.get("location_notes"),
            "cover_image_url": e.get("cover_image_url"),
            "featured": bool(e.get("featured")),
            "host_name": host.get("name"),
            "host_url": host.get("url"),
            "host_type": host.get("type"),
            "host_slug": host_slug,
            "tags": [t.get("name") if isinstance(t, dict) else t
                     for t in (e.get("tags") or [])],
            "links": e.get("links"),
        })

    events.sort(key=lambda x: x["start_time"])
    write("events.json", {
        "updated": now.isoformat(timespec="seconds"),
        "count": len(events),
        "events": events,
    })
    return True


# Fields the Four Norms Groups API returns that must NEVER be published on a
# public page: Community Lead names and emails, engagement tiers and activity
# counts, member/supporter counts, and each group's internal purpose text.
# See the privacy rules in TLO_Handoff_Brief_v2.md. This allow-list is the
# safeguard: anything not named here is discarded before being written to a file.
GROUP_PUBLIC_FIELDS = (
    "name", "display_name", "slug", "affiliation",
)


def fetch_groups():
    """Coalition groups for the map and directory. Needs an API key."""
    res = get(f"/organizations/{ORG}/groups", {"limit": "100"}, needs_key=True)
    if not res:
        return False

    now = datetime.now(timezone.utc)
    groups = []
    for g in res.get("data", []):
        # Respect each group's own choice not to be listed publicly.
        if g.get("discoverable") is False:
            continue

        loc = g.get("location") or {}
        links = g.get("links") or {}
        clean = {k: g.get(k) for k in GROUP_PUBLIC_FIELDS}
        clean.update({
            "city": loc.get("city"),
            "state": loc.get("state"),
            "lat": loc.get("lat"),
            "lon": loc.get("lon"),
            "web_url": links.get("web_url"),
        })
        groups.append(clean)

    groups.sort(key=lambda x: ((x.get("state") or ""), (x.get("city") or "")))
    write("groups.json", {
        "updated": now.isoformat(timespec="seconds"),
        "count": len(groups),
        "groups": groups,
    })
    return True


def main():
    print("Fetching from Four Norms...")
    ok_events = fetch_events()
    fetch_groups()  # Allowed to fail while we have no key.

    if not ok_events:
        print("Events fetch failed - stopping so the site keeps its last good data.")
        return 1
    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
