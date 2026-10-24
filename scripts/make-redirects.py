#!/usr/bin/env python3
"""
Builds redirect pages for addresses that existed on the old Squarespace site.

Why this exists: the Squarespace site had 75 public addresses and this one has
about a dozen. Without these files, every old link in Google, in an email, on
Facebook or on a printed flyer would land on an error page the moment the
domain moves.

Each entry below creates a small page at the old address that sends the visitor
to the new one. Search engines are told the new address is the real one, so
rankings follow across rather than being lost.

Run after changing the map:
    python3 scripts/make-redirects.py

Addresses the new site already answers correctly on its own, such as /about and
/events, are deliberately absent.
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# old Squarespace address -> where it should land now
REDIRECTS = {
    # --- main pages ---
    "home":                        "index.html",
    "action":                      "get-involved.html",
    "ambassadors":                 "communities.html",
    "contact":                     "index.html#join",
    "join-our-list":               "index.html#join",
    "support-us":                  "support.html",
    "store":                       "support.html",
    "turning-life-on-resources":   "learn.html",

    # --- advocacy and legislation ---
    "s30":                         "get-involved.html#advocates",
    "s2581pfs":                    "get-involved.html#advocates",
    "ai-in-ed-public-comment":     "get-involved.html#advocates",
    "support-letter-landing-page": "get-involved.html#advocates",

    # --- one-off event pages ---
    # "jch" is deliberately absent: it is a real page now (jch.html), not a
    # redirect. Four Norms links both Horvath events straight at /jch, so it
    # must keep serving the speaker page.
    "growing-up-well":             "events.html",

    # --- guides and resources ---
    "turning-life-on-resources/philosophical-platform":            "learn.html#start",
    "turning-life-on-resources/screen-recommendations":            "learn.html#start",
    "turning-life-on-resources/values-based-parenting-in-a-digital-world": "learn.html#start",
    "turning-life-on-resources/holistic-approach-to-keeping-tech-in-check": "learn.html#start",
    "turning-life-on-resources/smartphone-alternatives":           "learn.html#issues",
    "turning-life-on-resources/tlo-playbooks":                     "get-involved.html#advocates",
    "turning-life-on-resources/why-were-using-four-norms":         "learn.html",
    "turning-life-on-resources/the-anxious-generation":            "learn.html",
    "turning-life-on-resources/culture-reframed-healthy-screen-time-habits-for-kids": "learn.html",
    "turning-life-on-resources/gaming-and-media-violence-what-parents-need-to-know":  "learn.html",
    "turning-life-on-resources/good-parenting-in-the-digital-age": "learn.html",
    "turning-life-on-resources/mental-health-and-devices-suggestions-amp-solutions-for-families": "learn.html",
    "turning-life-on-resources/mindfulness-an-antidote-to-too-much-screen-time": "learn.html",
    "turning-life-on-resources/parenting-in-the-age-of-ai-a-framework-for-thoughtful-families": "learn.html#issues",
    "turning-life-on-resources/protecting-kids-health-in-a-digital-world": "learn.html",
    "turning-life-on-resources/smartphone-tips-for-modern-parents": "learn.html",
    "turning-life-on-resources/social-media-amp-youth-what-families-need-to-know": "learn.html",
    "turning-life-on-resources/the-anxious-generation-supporting-teens-in-a-tech-driven-world": "learn.html#recordings",
}

# Books and films all land on Learn, where the new site lists them.
for slug in [
    "book-creating-a-tech-healthy-family-ten-must-have-conversations-to-help-you-worry-less-and-connect-more-with-your-kids",
    "book-generations-and-igen",
    "book-reclaiming-conversation-the-power-of-talk-in-a-digital-age",
    "book-stolen-focus-why-you-cant-pay-attention-and-how-to-think-deeply-again",
    "book-the-big-disconnect", "book-the-cyber-effect",
    "book-the-shallows-what-the-internet-is-doing-to-our-brains",
    "video-adolescence", "video-cant-look-away", "video-childhood-20",
    "video-the-social-dilemma",
]:
    REDIRECTS[f"turning-life-on-resources/{slug}"] = "learn.html"

# The old blog placeholders never held real content.
for slug in ["blog-post-title-one-g62jd", "blog-post-title-three-zwdfs",
             "blog-post-title-four-b6ylf"]:
    REDIRECTS[f"turning-life-on-resources/{slug}"] = "learn.html"

# Individual event pages. The new site lists what is coming up rather than
# keeping a page per past event.
for slug in [
    "ambassador-onboarding-730", "brainfree-braintree-introductory-meeting",
    "converting-events-to-action", "culture-reframed-731", "edtech",
    "event-three-t3yz5", "growing-up-well", "in-person-ambassador-meeting",
    "onboarding-call-716", "phone-free-schools-policies",
    "raising-resilient-happy-children-how-to-provide-children-and-teens-with-the-play-and-independent-activity-they-need-to-mental-wellbeing-and-long-term-success",
    "south-shore-digital-wellness-an-introduction-to-play-clubs",
    "south-shore-digital-wellness-initiative-meeting",
    "the-anxious-generation-supporting-teens-in-a-tech-driven-world",
]:
    REDIRECTS[f"events/{slug}"] = "events.html"


TEMPLATE = """<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Moved &middot; Turning Life On</title>
<link rel="canonical" href="{base}{target}">
<meta http-equiv="refresh" content="0; url={up}{target}">
<style>body{{font-family:system-ui,sans-serif;margin:0;padding:12vh 24px;text-align:center;color:#2d3e4e}}
a{{color:#F67800}}</style>
</head><body>
<p>This page has moved.</p>
<p><a href="{up}{target}">Continue to Turning Life On</a></p>
<script>location.replace("{up}{target}");</script>
</body></html>
"""

BASE = "https://www.turninglifeon.org/"


def main():
    made = 0
    for old, target in sorted(REDIRECTS.items()):
        path = ROOT / (old + ".html")
        path.parent.mkdir(parents=True, exist_ok=True)
        up = "../" * (len(Path(old).parts) - 1)
        path.write_text(TEMPLATE.format(base=BASE, target=target, up=up))
        made += 1
    print(f"wrote {made} redirect pages")


if __name__ == "__main__":
    main()
