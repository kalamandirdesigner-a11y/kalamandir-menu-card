/* Kalamandir — in-store display
 *
 * A screen on a wall has nobody to fix it, so this is built to be left alone: it keeps
 * the last good answer, carries on through a dead network, and picks up new slides or a
 * new gold rate on its own within the minute.
 */
'use strict';

const API = String(window.MH_API || '').replace(/\/$/, '');
/* Which screen this panel is. A wall may have several, each on its own link. */
const SCREEN_ID = new URLSearchParams(location.search).get('s') || '';
const CACHE_KEY = 'kmDisplay:' + (SCREEN_ID || 'default');
const REFRESH_MS = 60000;      /* how often to ask for a new screen */

const $ = (sel) => document.querySelector(sel);
const stage = $('#stage'), ratesEl = $('#rates'), rowEl = $('#ratesRow');
const stampEl = $('#ratesStamp'), waiting = $('#waiting'), offline = $('#offline');
const tick = $('#tick'), tickFill = $('#tickFill'), dotsEl = $('#dots');

let shown = null;              /* the config on screen */
let slides = [], at = -1, timer = null;

/* ---------- the rates ---------- */
const KARATS = [['k22', '22 KT'], ['k18', '18 KT'], ['k14', '14 KT']];

function paintRates(cfg) {
  const has = KARATS.some(([k]) => cfg.rates && cfg.rates[k]);
  ratesEl.hidden = !has;
  if (!has) return;
  rowEl.innerHTML = KARATS.map(([k, label]) => {
    const v = (cfg.rates[k] || '').trim();
    if (!v) return '';
    /* a bare number is money; anything else is shown as typed */
    const money = /^[\d,]+(\.\d+)?$/.test(v) ? '₹' + v : v;
    return `<div class="rate">
      <span class="rate__k">${label}</span>
      <b class="rate__v">${money}</b>
    </div>`;
  }).join('');
  stampEl.textContent = cfg.rates_at ? when(cfg.rates_at) : '';
}

function when(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const day = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return `${day}, ${time}`;
}

/* ---------- the slides ---------- */
function paintSlides(cfg) {
  /* each slide carries its own dwell time, already resolved against the screen's */
  const want = cfg.images.map((im) => ({
    url: im.url, secs: Math.max(2, Number(im.seconds) || Number(cfg.seconds) || 8)
  }));
  const urls = want.map((x) => x.url);
  const same = want.length === slides.length
    && want.every((x, i) => x.url === slides[i].url && x.secs === slides[i].secs);
  slides = want;

  waiting.hidden = slides.length > 0;
  if (!slides.length && cfg.screen) {
    waiting.textContent = 'No slides on ' + cfg.screen.name + ' yet';
  }
  if (!slides.length) {
    stage.querySelectorAll('img').forEach((el) => el.remove());
    clearTimeout(timer); timer = null; at = -1;
    return;
  }

  /* keep the images that are still wanted, so a refresh does not blink the screen */
  const have = new Map([...stage.querySelectorAll('img')].map((el) => [el.dataset.url, el]));
  stage.querySelectorAll('img').forEach((el) => { if (!urls.includes(el.dataset.url)) el.remove(); });
  urls.forEach((u, i) => {
    let el = have.get(u);
    if (!el) {
      el = document.createElement('img');
      el.src = u;
      el.dataset.url = u;
      el.alt = '';
      el.decoding = 'async';
      stage.appendChild(el);
    }
    el.style.order = String(i);
  });

  dotsEl.hidden = slides.length < 2;
  dotsEl.innerHTML = slides.length < 2 ? '' : slides.map(() => '<i></i>').join('');
  tick.hidden = slides.length < 2;

  /* a changed list starts again from the top; an unchanged one carries on where it was */
  if (!same || at < 0) { at = -1; step(); }
  else { clearTimeout(timer); timer = setTimeout(step, slides[at].secs * 1000); }
}

function step() {
  const imgs = [...stage.querySelectorAll('img')].sort(
    (a, b) => Number(a.style.order) - Number(b.style.order));
  if (!imgs.length) return;
  at = (at + 1) % imgs.length;
  imgs.forEach((el, i) => el.classList.toggle('is-on', i === at));
  [...dotsEl.children].forEach((d, i) => d.classList.toggle('is-on', i === at));

  const secs = slides[at] ? slides[at].secs : 8;

  /* restart the sweep, in step with however long THIS slide stays up */
  if (!tick.hidden) {
    tickFill.style.transition = 'none';
    tickFill.style.width = '0%';
    void tickFill.offsetWidth;
    tickFill.style.transition = `width ${secs}s linear`;
    tickFill.style.width = '100%';
  }

  /* each slide sets its own alarm, so one can hold longer than the next */
  clearTimeout(timer);
  if (slides.length > 1) timer = setTimeout(step, secs * 1000);
}

/* The screen was deleted in the portal. Better a plain notice than yesterday's poster. */
function gone() {
  clearTimeout(timer); timer = null;
  try { localStorage.removeItem(CACHE_KEY); } catch {}
  stage.querySelectorAll('img').forEach((el) => el.remove());
  sizeTo(null);
  ratesEl.hidden = true; tick.hidden = true; dotsEl.hidden = true; offline.hidden = true;
  waiting.hidden = false;
  waiting.textContent = 'This screen was removed';
  shown = null;
}

/* ---------- keeping it current ---------- */
/* A screen given an exact size is drawn on that canvas and scaled to fit the panel it
   is plugged into, so a 1920x540 strip stays a strip whatever the browser window is. */
function fit() {
  const w = Number(shown?.screen?.width) || 0, h = Number(shown?.screen?.height) || 0;
  if (!(w && h)) return;
  document.documentElement.style.setProperty(
    '--fit', String(Math.min(innerWidth / w, innerHeight / h)));
}

function sizeTo(sc) {
  const w = Number(sc?.width) || 0, h = Number(sc?.height) || 0;
  const root = document.documentElement.style;
  document.body.classList.toggle('is-fixed', !!(w && h));
  if (!(w && h)) {
    root.removeProperty('--dw'); root.removeProperty('--dh');
    root.removeProperty('--u'); root.removeProperty('--fit');
    return;
  }
  root.setProperty('--dw', w + 'px');
  root.setProperty('--dh', h + 'px');
  /* everything on the page is sized off this unit, so the design holds its proportions */
  root.setProperty('--u', (h / 100) + 'px');
  fit();
}

function apply(cfg) {
  if (!cfg) return;
  shown = cfg;
  /* the layout follows what the screen was set up as, not what this device happens to
     be — a tall panel plugged in sideways still shows the tall design */
  const orient = cfg.screen?.orientation === 'portrait' ? 'portrait' : 'landscape';
  document.documentElement.setAttribute('data-orient', orient);
  sizeTo(cfg.screen);
  if (cfg.screen?.name) document.title = cfg.screen.name + ' — Kalamandir';
  paintRates(cfg);
  paintSlides({ ...cfg, seconds: cfg.screen?.seconds || 8 });
}

async function refresh() {
  try {
    const url = API + '/api/display' + (SCREEN_ID ? '?screen=' + encodeURIComponent(SCREEN_ID) : '');
    const res = await fetch(url, { cache: 'no-store' });
    /* the one error worth believing: this screen is gone, so stop showing its slides */
    if (res.status === 404) return gone();
    if (!res.ok) throw new Error('bad');
    const cfg = await res.json();
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cfg)); } catch {}
    offline.hidden = true;
    /* only redraw when something actually moved */
    if (JSON.stringify(cfg) !== JSON.stringify(shown)) apply(cfg);
  } catch {
    /* a screen that goes blank because the wifi dropped is worse than a stale one */
    offline.hidden = !!shown ? false : true;
  }
}

(function start() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (cached) apply(cached);
  } catch {}
  refresh();
  setInterval(refresh, REFRESH_MS);

  /* screens get left on for weeks; come back fresh after a sleep */
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  addEventListener('online', refresh);
  addEventListener('resize', fit);
})();
