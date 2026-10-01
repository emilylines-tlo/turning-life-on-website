#!/usr/bin/env python3
"""
Stamps the shared header and footer into every page.

The site has no build step: the HTML in the repo is exactly what ships. This
script keeps the one piece that must be identical everywhere, the navigation
and footer, from drifting between files.

Run it after changing the nav or footer:
    python3 scripts/apply-shell.py

It rewrites whatever sits between the SHELL markers in each page and leaves the
rest alone.
"""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

DONATE = "https://www.paypal.com/donate/?hosted_button_id=89ZVGH9W45QZ6"
TALK = "mailto:adrienne@turninglifeon.org"
PORTAL = "https://papa.fournorms.com/turning-life-on"

# label, href, and the file that counts as "you are here"
NAV = [
    ("Home", "index.html"),
    ("About", "about.html"),
    ("Communities", "communities.html"),
    ("Learn", "learn.html"),
    ("Get Involved", "get-involved.html"),
    ("Attend", "attend.html"),
]


def nav_html(page, depth=0):
    up = "../" * depth
    items = []
    for label, href in NAV:
        cls = "navlink active" if href == page else "navlink"
        items.append(f'        <li><a class="{cls}" href="{up}{href}">{label}</a></li>')
    items.append(f'        <li><a class="btn btn-line btn-sm" href="{DONATE}" target="_blank" rel="noopener">Donate</a></li>')
    items.append(f'        <li><a class="btn btn-orange btn-sm" href="{TALK}">Talk with us</a></li>')
    return (
        '<header>\n'
        '  <div class="wrap bar">\n'
        f'    <a class="logo" href="{up}index.html" aria-label="Turning Life On, home">\n'
        '      <div class="word"><span class="a">TURNING LIFE</span> <span class="b"><span class="pw">&#9211;</span>N</span></div>\n'
        '      <div class="tag">KEEP TECH IN CHECK</div>\n'
        '    </a>\n'
        '    <nav id="nav">\n'
        '      <button class="menubtn" id="menubtn" aria-label="Toggle menu" aria-expanded="false">Menu</button>\n'
        '      <ul>\n' + "\n".join(items) + '\n'
        '      </ul>\n'
        '    </nav>\n'
        '  </div>\n'
        '</header>'
    )


def footer_html(depth=0):
    up = "../" * depth
    return (
        '<footer>\n'
        '  <div class="wrap">\n'
        '    <div class="cols">\n'
        '      <div>\n'
        '        <h4>Turning Life On</h4>\n'
        '        <p>A registered 501(c)(3) nonprofit. Your support helps us do more in more communities.</p>\n'
        f'        <p style="margin-top:14px"><a class="btn btn-orange btn-sm" href="{DONATE}" target="_blank" rel="noopener">Donate</a></p>\n'
        '      </div>\n'
        '      <div>\n'
        '        <h4>Explore</h4>\n'
        '        <ul class="flist">\n'
        f'          <li><a href="{up}about.html">About</a></li>\n'
        f'          <li><a href="{up}communities.html">Communities</a></li>\n'
        f'          <li><a href="{up}learn.html">Learn</a></li>\n'
        f'          <li><a href="{up}get-involved.html">Get Involved</a></li>\n'
        f'          <li><a href="{up}attend.html">Attend</a></li>\n'
        '        </ul>\n'
        '      </div>\n'
        '      <div>\n'
        '        <h4>Connect</h4>\n'
        '        <ul class="flist">\n'
        '          <li>Concord, Massachusetts</li>\n'
        '          <li><a href="mailto:info@turninglifeon.org">info@turninglifeon.org</a></li>\n'
        '          <li><a href="https://www.instagram.com/tlo_turninglifeon/" target="_blank" rel="noopener">Instagram</a></li>\n'
        '          <li><a href="https://www.facebook.com/turninglifeon" target="_blank" rel="noopener">Facebook</a></li>\n'
        f'          <li><a href="{PORTAL}" target="_blank" rel="noopener">Community Portal</a></li>\n'
        f'          <li><a href="{up}privacy/">Privacy policy</a></li>\n'
        '        </ul>\n'
        '      </div>\n'
        '    </div>\n'
        '    <p class="disc">This website is provided for educational and informational purposes only '
        'and does not constitute medical advice or professional services. Always seek the advice of '
        'your doctor or other qualified health provider regarding a medical condition. If you think '
        'you may have a medical emergency, call 911 or go to the nearest emergency room immediately. '
        '&copy;2026 Turning Life On.</p>\n'
        '  </div>\n'
        '</footer>'
    )


def stamp(path: Path):
    s = path.read_text()
    page = path.name
    depth = len(path.relative_to(ROOT).parts) - 1
    if depth:                      # a page in a folder, like privacy/index.html
        page = path.parent.name + "/"

    out = s
    out = re.sub(r'(<!--SHELL:nav-->).*?(<!--/SHELL:nav-->)',
                 lambda m: m.group(1) + "\n" + nav_html(page, depth) + "\n" + m.group(2),
                 out, flags=re.S)
    out = re.sub(r'(<!--SHELL:footer-->).*?(<!--/SHELL:footer-->)',
                 lambda m: m.group(1) + "\n" + footer_html(depth) + "\n" + m.group(2),
                 out, flags=re.S)
    if out != s:
        path.write_text(out)
        return True
    return False


def main():
    changed = 0
    for path in sorted(ROOT.rglob("*.html")):
        if ".git" in path.parts:
            continue
        if stamp(path):
            print("  stamped", path.relative_to(ROOT))
            changed += 1
    print(f"{changed} page(s) updated")


if __name__ == "__main__":
    main()
