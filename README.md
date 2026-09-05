# Kalamandir Menu — online menu card

Static site. Nothing to build; the folder is the deploy.

## What it does

1. **Welcome** — 3-second brand screen: the logo rises in with a gold highlight
   sweeping across the letterforms (a mask, so the light tracks the actual shapes),
   the card's own corner flourishes fade up behind it, a gold rule draws, and
   "Welcome to Kalamandir" tracks in. It lifts away on its own. The location request
   runs behind it, so detection is usually finished before it clears.
2. **Menu** — the printed card, in its own pane. The brand bar and the app bar never
   move. On a normal phone the whole menu fits without scrolling; the zoom button in
   the toolbar widens it to ~205% and the pane then scrolls both ways.
3. **App** — tapping **Install** raises an AirPods-style pairing card. The three
   features cycle through one at a time, each sliding the previous one out to the
   left: Gold Investment Scheme → Gold SIP → Digital Gold, looping every 2.2s with
   its own animated icon (coins stack up, the chart line draws itself, the coin
   spins in). The download button carries the Android robot or the Apple mark and
   points at the matching store; on desktop both buttons show.

## Two menus, six stores

| Store | Card | Source PDF (page 2) |
|---|---|---|
| Surat, Ahmedabad, Borivali | `MENUS.metro` | `Kalamandir Jewellers Menu Card.pdf` |
| Kosamba, Bharuch, Vapi | `MENUS.other` | `Kalamandir Jewellers Menu Card - Other Branch.pdf` |

Only page 2 of each PDF is used — the page with the actual menu. The covers and the
Instagram/QR pages are not on the site. The two cards genuinely differ: the metro one
adds **Jain Burger** under Snacks.

To refresh a card after a print revision, re-render page 2 at ~1600px wide to
`assets/menu-metro.webp` or `assets/menu-other.webp`. No code change needed.

> Note: the metro PDF's own footer artwork reads "KALAMANDIR JEWELLERS LIMITD" —
> missing the final E. It is in the supplied print file, not something the site adds.
> Worth fixing at the source, then re-rendering.

### How a store gets picked, in order

1. **The URL** — `…/surat`, `…/kosamba` etc. Give each showroom its own QR code
   pointing at its own link. Exact, no permission prompt, and the recommended setup.
2. `?store=surat` — the same thing as a query string, if clean paths are awkward.
3. **Last choice on that phone** (localStorage).
4. **Location, asked for automatically.** On a first visit the page requests the
   location the moment it loads, while the welcome screen is still up. That screen
   gives about 3 seconds of cover, so a fix that lands in time means the right menu
   is simply already showing and nothing is ever asked. The nearest showroom is
   picked by great-circle distance.
5. If the location is refused, fails, or is more than 60km from every showroom, the
   store sheet opens and says why. Tapping the store name in the toolbar reopens it
   at any time.

> **Location cannot be tested in a local preview or an embedded browser pane.** The
> browser refuses it on plain `http` and inside an iframe without a geolocation
> permission policy — you get "permission blocked" every time. Test it on the
> deployed Netlify HTTPS link, on a real phone.

Per-store paths are wired in `vercel.json` (and `_redirects` for Netlify). Add a
store by appending a line to both plus an entry to `STORES` in `index.html`.

> IP-based location was deliberately not used: Indian mobile IPs regularly place a
> Kosamba phone in Ahmedabad or Mumbai, which would show the wrong menu silently.
> One link per showroom is accurate; GPS is offered as a convenience on top.

## What this site shows, and where it comes from

The cards, the store list and the app panel are **not** edited here any more. They live
in the Kalamandir Branding Materials portal, under Settings → Menu card site, and this
site reads them from one public endpoint on load.

The config block at the top of `app.js` is the fallback: what a first-time visitor sees
while the fetch is in flight, and what shows if the portal is unreachable. The last good
answer is cached in `localStorage`, so a returning visitor opens on the current menu
straight away. A card with no image uploaded in the portal keeps using the `.webp` that
ships here.

Two lines in `vercel.json` make that possible and must stay: the Content-Security-Policy
allows `connect-src` to the portal API and `img-src` from Cloudinary. Tightening either
back to `'none'`/`'self'` breaks the menu silently — no error, just the old card forever.

## Deploy

Hosted on **Vercel** (free/Hobby). Vercel adds no badge to the served page.

The project is connected to `kalamandirdesigner-a11y/kalamandir-menu-card`, so **a push
to `main` deploys it** — nothing else to run:

```bash
cd "/Users/adityajain/Downloads/Aditya Jain/1/kalamandir-menu" && git push
```

The CLI route below still works and needs no Git, if the connection is ever removed.

Vercel has no drag-and-drop upload, so it goes out from the CLI. First run opens a
browser once to log in, then remembers you:

```bash
cd "/Users/adityajain/Downloads/Aditya Jain/1/kalamandir-menu" && npx vercel --prod
```

Answer the setup prompts as: link to a new project, name it (e.g. `kalamandir-menu`),
root directory `./`, and **no** build command / framework — it is plain static files.

`vercel.json` carries the per-store rewrites (`/surat`, `/kosamba`, …) and the cache
headers. Note its catch-all header rule deliberately sets no `Cache-Control`: Vercel
applies every matching rule and a later duplicate key wins, so a catch-all cache
header would wipe the immutable one on `/assets` and `/fonts`. HTML gets Vercel's
own `max-age=0, must-revalidate` default, which is what we want anyway.

> Vercel's Hobby plan is, per their terms, for non-commercial use; a business site
> belongs on Pro. Flagged and accepted — this is a deliberate choice.

`netlify.toml` and `_redirects` are left in place so the folder can still go to
Netlify unchanged. Vercel ignores both.

### After the first deploy

`og-image.jpg` is referenced relatively. For a reliable WhatsApp/Twitter preview,
point it at the real domain:

```bash
cd "/Users/adityajain/Downloads/Aditya Jain/1/kalamandir-menu" && sed -i '' 's|content="og-image.jpg"|content="https://YOUR-PROJECT.vercel.app/og-image.jpg"|' index.html
```

Then redeploy. Also delete the old unclaimed Netlify site, or its badged URL stays
live alongside the new one.

### Why the old Netlify link showed "Powered by Netlify"

Nothing in `index.html` referenced Netlify. Netlify appended 720 bytes *after* the
closing `</html>` at serve time — `<script src="/.netlify/scripts/hud?variant=public">`,
which draws the badge. `variant=public` is what an unclaimed Netlify Drop site gets;
claiming the site into an account removes it. Not editable from this repo.

## Files

| Path | What |
|---|---|
| `index.html` | Markup |
| `styles.css` | All styling |
| `app.js` | Behaviour and the store config block |
| `assets/menu-metro.webp` | Menu for Surat / Ahmedabad / Borivali |
| `assets/menu-other.webp` | Menu for Kosamba / Bharuch / Vapi |
| `assets/logo-lockup-cream.svg` | Official logo, vector, cream for dark bars |
| `assets/ornament-cream.webp` | Corner flourish lifted from the printed card |
| `assets/app-icon.webp` | App icon as it appears on the stores |
| `assets/app-icon-lg.webp` | Same icon at 384px, for the pairing card |
| `fonts/adventor-*.woff2` | ITC Avant Garde Gothic for the popups (see below) |
| `fonts/jost-var.woff2` | Jost, self-hosted, for the menu chrome |
| `og-image.jpg` | Link preview image |
| `favicon.svg`, `apple-touch-icon.png`, `icon-*.png` | Icons, brand brown + mark |
| `vercel.json` | Per-store rewrites, caching, headers (Vercel) |
| `_redirects`, `netlify.toml` | Same, for Netlify — unused on Vercel |

`../kalamandir-menu-src/assets/` holds everything else pulled out of the PDF —
the food photos, the corner flourishes, and the logo in every colour and crop.
Not deployed; kept in case a later version wants them.

## Security

This is a static site: no server code, no database, no login, no user input that
reaches a backend. So the things worth hardening are (a) what a browser is allowed to
run on the page, and (b) who can change the files.

**What is locked down**

- **Content-Security-Policy** — `default-src 'none'` with `script-src`, `style-src`,
  `img-src`, `font-src` and `manifest-src` all at `'self'`. The browser refuses any
  script or stylesheet the site did not ship, so an injected `<script>` tag simply
  does not execute. `connect-src 'none'` means the page cannot phone anywhere.
  `base-uri 'none'` and `form-action 'none'` close the usual redirect tricks.
- **No third-party origins at all.** Jost is self-hosted (SIL OFL,
  `fonts/JOST-OFL.txt`) next to Adventor, so the page fetches nothing but its own
  files. Nothing to hijack upstream, nothing to break if Google is down.
- **No inline code.** CSS lives in `styles.css`, JS in `app.js`. That is what lets
  the CSP drop `'unsafe-inline'` — with inline code allowed, the policy would be
  largely decorative.
- **HSTS**, `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
  `X-Frame-Options`/`frame-ancestors 'self'` (no embedding the menu in someone
  else's page), and COOP/CORP.
- **Permissions-Policy** keeps `geolocation=(self)` — the store detection needs it —
  and turns camera, microphone, payment, USB and the motion sensors off.
- **Input validation.** Every store id from the URL or `localStorage` is checked
  against the `STORES` list before use; nothing from outside reaches the DOM.

The identical policy is in both `vercel.json` and `netlify.toml`. If you edit one,
edit the other.

**Tamper detection on the source**

The folder is a git repo. To see whether anything changed and put it back:

```bash
cd "/Users/adityajain/Downloads/Aditya Jain/1/kalamandir-menu" && git status --short && git diff
```

```bash
cd "/Users/adityajain/Downloads/Aditya Jain/1/kalamandir-menu" && git restore .
```

Commit after every intentional change, so `git status` staying empty actually means
something. Pushing it to a private GitHub repo would also give you an off-machine
copy.

**What cannot be protected, and why not to try**

The HTML, CSS and JS are downloaded to every visitor's phone in order to work —
anyone can read them with View Source. That is true of every website. Minifying or
obfuscating does not change it, and blocking right-click or DevTools only annoys real
customers while stopping nobody. There is nothing secret in these files: no keys, no
tokens, no customer data. The menu images are public by design.

**The part that is actually on you**

Changing the live site needs the hosting account, so that account *is* the security
boundary:

1. Turn on **two-factor authentication** on the Vercel account.
2. Do not share the login, and do not paste deploy tokens into chats or scripts.
3. If you ever connect a Git repo for auto-deploy, protect the branch that deploys.
4. Delete the old unclaimed Netlify site so there is not a second, unmanaged copy of
   the menu live on the internet.

## Fonts

The popups are set in **ITC Avant Garde Gothic**. That face is licensed, so the page
asks for it by name first and, when the device does not have it, falls back to
**TeX Gyre Adventor** — GUST's free, metric-compatible cut of the same design,
self-hosted here as a Latin subset (13KB per weight, Book + Demi). Its licence is in
`fonts/GUST-FONT-LICENSE.txt`, which permits redistribution. `Century Gothic` sits
next in the stack for Windows machines. If Kalamandir buys a webfont licence for the
real ITC face, drop the woff2 files into `fonts/` and add one `@font-face` block —
the stack already names it first.

The menu chrome stays in **Jost**, deliberately: the printed card is set in Futura PT
and Jost is its closest free match. Jost is self-hosted too (one variable file,
restricted to the 300-500 range the design uses, 21KB) — the page loads no fonts from
Google, which is what allows the CSP to forbid every origin but our own.

## Local preview

```bash
python3 -m http.server 4711 --directory "/Users/adityajain/Downloads/Aditya Jain/1/kalamandir-menu"
```

Clean paths (`/surat`) need the host's rewrite rules, so locally use
`http://localhost:4711/?store=surat` instead.
