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

## Deploy

Hosted on **Vercel** (free/Hobby). Vercel adds no badge to the served page.

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
| `index.html` | The whole app — markup, CSS, JS, store config |
| `assets/menu-metro.webp` | Menu for Surat / Ahmedabad / Borivali |
| `assets/menu-other.webp` | Menu for Kosamba / Bharuch / Vapi |
| `assets/logo-lockup-cream.svg` | Official logo, vector, cream for dark bars |
| `assets/ornament-cream.webp` | Corner flourish lifted from the printed card |
| `assets/app-icon.webp` | App icon as it appears on the stores |
| `assets/app-icon-lg.webp` | Same icon at 384px, for the pairing card |
| `fonts/adventor-*.woff2` | ITC Avant Garde Gothic for the popups (see below) |
| `og-image.jpg` | Link preview image |
| `favicon.svg`, `apple-touch-icon.png`, `icon-*.png` | Icons, brand brown + mark |
| `vercel.json` | Per-store rewrites, caching, headers (Vercel) |
| `_redirects`, `netlify.toml` | Same, for Netlify — unused on Vercel |

`../kalamandir-menu-src/assets/` holds everything else pulled out of the PDF —
the food photos, the corner flourishes, and the logo in every colour and crop.
Not deployed; kept in case a later version wants them.

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
and Jost is its closest free match.

## Local preview

```bash
python3 -m http.server 4711 --directory "/Users/adityajain/Downloads/Aditya Jain/1/kalamandir-menu"
```

Clean paths (`/surat`) need the host's rewrite rules, so locally use
`http://localhost:4711/?store=surat` instead.
