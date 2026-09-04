(function(){
  "use strict";

  /* ══════════════════════════════════════════════════════════════
     CONFIG
     What follows is the fallback: correct on the day it shipped, and what a first-time
     visitor sees while the network is still thinking. The live version is kept in the
     branding portal and fetched below, so a new menu card or a changed blurb needs no
     redeploy of this site. The last answer is cached, so a returning visitor gets the
     current one immediately.
     ══════════════════════════════════════════════════════════════ */

  var CONFIG_URL = "https://kalamandir-branding-api.onrender.com/api/menu";
  var CONFIG_KEY = "kmConfig";
  var CONFIG_WAIT = 2200;   // the welcome screen covers ~3s; wait inside that

  var IOS_URL = "https://apps.apple.com/in/app/kalamandir-jewellers/id6462873415";
  var AND_URL = "https://play.google.com/store/apps/details?id=com.dsoft.kalamandirjewellers&hl=en_IN";

  // Each card is page 2 of its print PDF — the page with the actual menu on it.
  var MENUS = {
    // Kalamandir Jewellers Menu Card.pdf
    metro: { pages: [{
      src: "assets/menu-metro.webp",
      alt: "Kalamandir menu — Beverages: Jain boil water, espresso, latte, cappuccino, "
         + "black coffee, green tea, lemon tea, masala tea, milk tea, black tea, ginger tea, "
         + "Assam tea, cardamom tea, hot chocolate, badam pista milk. Snacks: Jain plain "
         + "vegetable sandwich, Jain vegetable grill sandwich, toast bread, Jain burger."
    }]},
    // Kalamandir Jewellers Menu Card - Other Branch.pdf
    other: { pages: [{
      src: "assets/menu-other.webp",
      alt: "Kalamandir menu — Beverages: Jain boil water, espresso, latte, cappuccino, "
         + "black coffee, green tea, lemon tea, masala tea, milk tea, black tea, ginger tea, "
         + "Assam tea, cardamom tea, hot chocolate, badam pista milk. Snacks: Jain plain "
         + "vegetable sandwich, Jain vegetable grill sandwich, toast bread."
    }]}
  };

  // Every store, the card it uses, and coordinates for "use my location".
  var STORES = [
    { id: "ahmedabad", name: "Ahmedabad", menu: "metro", lat: 23.0225, lng: 72.5714 },
    { id: "borivali",  name: "Borivali",  menu: "metro", lat: 19.2307, lng: 72.8567 },
    { id: "surat",     name: "Surat",     menu: "metro", lat: 21.1702, lng: 72.8311 },
    { id: "kosamba",   name: "Kosamba",   menu: "other", lat: 21.4670, lng: 72.9500 },
    { id: "bharuch",   name: "Bharuch",   menu: "other", lat: 21.7051, lng: 72.9959 },
    { id: "vapi",      name: "Vapi",      menu: "other", lat: 20.3893, lng: 72.9106 }
  ];

  var STORE_KEY = "kmStore";

  /* ══════════════════════════════════════════════════════════════
     counting
     The portal wants to know how the card is used: menus opened, which stores, and how
     often the app buttons are pressed. Counters only — nobody is identified and nothing
     is stored per person. It is fire-and-forget: if it fails, the menu does not care.
     ══════════════════════════════════════════════════════════════ */
  var EVENT_URL = CONFIG_URL.replace(/\/menu$/, "/menu/event");
  var viewCounted = false;

  function report(type, store){
    try {
      var body = JSON.stringify({ type: type, store: store || "" });
      /* sendBeacon survives the tab closing, which a store link often causes */
      if (navigator.sendBeacon) {
        navigator.sendBeacon(EVENT_URL, new Blob([body], { type: "text/plain" }));
        return;
      }
      if (window.fetch) fetch(EVENT_URL, {
        method: "POST", headers: { "Content-Type": "text/plain" },
        body: body, keepalive: true
      }).catch(function(){});
    } catch (e) {}
  }

  function countView(store){
    if (viewCounted) return;
    viewCounted = true;
    report("view", store);
  }
  /* nobody picked a store and none could be guessed — still one person who looked */
  setTimeout(function(){ countView(""); }, 12000);

  /* ══════════════════════════════════════════════════════════════
     welcome
     ══════════════════════════════════════════════════════════════ */
  var splash = document.getElementById("splash");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var splashDone = false, afterSplash = [];

  setTimeout(function(){
    splash.classList.add("gone");
    setTimeout(function(){
      if (splash.parentNode) splash.parentNode.removeChild(splash);
      splashDone = true;
      afterSplash.forEach(function(fn){ fn(); });
      afterSplash = [];
    }, 560);
  }, reduce ? 600 : 3000);

  function whenSplashDone(fn){ if (splashDone) fn(); else afterSplash.push(fn); }

  /* ══════════════════════════════════════════════════════════════
     store button follows the phone
     ══════════════════════════════════════════════════════════════ */
  function detectOS(){
    var ua  = navigator.userAgent || "";
    var uad = navigator.userAgentData;
    var p   = (uad && uad.platform) ? uad.platform.toLowerCase() : "";

    if (p.indexOf("android") > -1 || /Android/i.test(ua)) return "android";
    if (/iPad|iPhone|iPod/.test(ua)) return "ios";
    // iPadOS 13+ sends a desktop Mac UA — the touch-point count gives it away
    if (/Macintosh|Mac OS X/.test(ua) && navigator.maxTouchPoints > 1) return "ios";
    return "other";
  }

  var os = detectOS();
  document.documentElement.setAttribute("data-os", os);

  var sub  = document.getElementById("dlSub");
  var aAnd = document.getElementById("aCtaAnd");
  var aIos = document.getElementById("aCtaIos");

  if (os === "ios") {
    sub.textContent = "On the App Store";
  } else if (os === "android") {
    sub.textContent = "On Google Play";
  } else {
    // desktop, or a UA we could not place — offer both, Android first
    sub.textContent = "iOS · Android";
  }

  /* ══════════════════════════════════════════════════════════════
     app sheet — slides up on Install, then stages the features in
     ══════════════════════════════════════════════════════════════ */
  var appsheet = document.getElementById("appsheet");

  /* features come in one at a time, each sliding the previous one out left */
  var stage  = document.getElementById("aStage");
  var slides = Array.prototype.slice.call(stage.querySelectorAll(".a-slide"));
  var dots   = Array.prototype.slice.call(document.querySelectorAll("#aDots i"));
  var lead, cycle, at = 0;

  function showFeature(n){
    slides.forEach(function(sl, k){
      sl.classList.remove("is-in", "is-out");
      if (k === n) sl.classList.add("is-in");
      // only the one just left behind slides out; the rest wait off-stage right
      else if (k === (n - 1 + slides.length) % slides.length) sl.classList.add("is-out");
    });
    dots.forEach(function(d, k){ d.classList.toggle("on", k === n); });
  }

  function startFeatures(){
    stopFeatures();
    at = 0;
    slides.forEach(function(sl){ sl.classList.remove("is-in", "is-out"); });
    // let the card finish landing before the first one arrives
    lead = setTimeout(function(){
      showFeature(0);
      cycle = setInterval(function(){
        at = (at + 1) % slides.length;
        showFeature(at);
      }, 2200);
    }, 430);
  }
  function stopFeatures(){
    clearTimeout(lead); clearInterval(cycle);
    lead = cycle = null;
  }

  function openApp(){
    // re-adding the class restarts every stagger animation
    appsheet.classList.remove("open");
    void appsheet.offsetWidth;
    appsheet.classList.add("open");
    if (reduce) showAllFeatures(); else startFeatures();
  }
  function closeApp(){
    appsheet.classList.remove("open");
    stopFeatures();
  }
  // with reduced motion the stylesheet stacks all three, so leave them alone
  function showAllFeatures(){
    slides.forEach(function(sl){ sl.classList.remove("is-in", "is-out"); });
    dots.forEach(function(d, k){ d.classList.toggle("on", k === 0); });
  }

  document.getElementById("dlCta").addEventListener("click", function(){
    report("install", current ? current.id : "");
    openApp();
  });
  [aAnd, aIos].forEach(function(el){
    if (!el) return;
    el.addEventListener("click", function(){
      report(el.dataset.p === "ios" ? "ios" : "android", current ? current.id : "");
    });
  });
  appsheet.addEventListener("click", function(e){
    if (e.target.closest && e.target.closest(".a-x")) { closeApp(); return; }
    if (e.target === appsheet) closeApp();          // tap outside the card
  });
  // leaving for the store should not leave the sheet open behind us
  [aAnd, aIos].forEach(function(el){
    el.addEventListener("click", function(){ setTimeout(closeApp, 400); });
  });

  /* ══════════════════════════════════════════════════════════════
     page viewer
     ══════════════════════════════════════════════════════════════ */
  var viewer   = document.getElementById("viewer");
  var sheetsEl = document.getElementById("sheets");
  var pgEl     = document.getElementById("pg");
  var chipName = document.getElementById("chipName");
  var sheets = [], total = 0, queued = false;

  function renderMenu(menuId){
    var menu = MENUS[menuId] || MENUS.other;
    sheetsEl.textContent = "";
    menu.pages.forEach(function(page, i){
      var fig = document.createElement("figure");
      fig.className = "sheet";
      var img = document.createElement("img");
      img.src = page.src;
      img.alt = page.alt;
      img.width = 1597; img.height = 2257;
      img.decoding = "async";
      if (i === 0) img.setAttribute("fetchpriority", "high");
      else img.loading = "lazy";
      fig.appendChild(img);
      sheetsEl.appendChild(fig);
    });
    sheets = Array.prototype.slice.call(sheetsEl.querySelectorAll(".sheet"));
    total  = sheets.length;
    document.body.classList.toggle("single", total < 2);
    viewer.scrollTop = 0;
    setZoom(false);
    updatePg();
  }

  function currentPage(){
    var mid = viewer.scrollTop + viewer.clientHeight / 2;
    var best = 1, bestD = Infinity;
    for (var i = 0; i < total; i++) {
      var c = sheets[i].offsetTop + sheets[i].offsetHeight / 2;
      var d = Math.abs(c - mid);
      if (d < bestD) { bestD = d; best = i + 1; }
    }
    return best;
  }
  function updatePg(){
    if (total) pgEl.textContent = currentPage() + " / " + total;
  }
  viewer.addEventListener("scroll", function(){
    if (queued) return;
    queued = true;
    requestAnimationFrame(function(){ queued = false; updatePg(); });
  }, { passive: true });

  var zoomBtn = document.getElementById("zoom");
  function setZoom(on){
    var max    = viewer.scrollHeight - viewer.clientHeight;
    var ratioY = max > 0 ? viewer.scrollTop / max : 0;

    document.body.classList.toggle("zoomed", on);
    zoomBtn.setAttribute("aria-pressed", on ? "true" : "false");
    zoomBtn.setAttribute("aria-label", on ? "Zoom out" : "Zoom in");

    // reading scrollHeight forces the reflow, so the new extent is already known
    var newMax = viewer.scrollHeight - viewer.clientHeight;
    viewer.scrollTop  = ratioY * newMax;
    viewer.scrollLeft = 0;   // item names sit on the left of the printed page
    updatePg();
  }
  zoomBtn.addEventListener("click", function(){
    setZoom(!document.body.classList.contains("zoomed"));
  });

  /* ══════════════════════════════════════════════════════════════
     store selection
     ══════════════════════════════════════════════════════════════ */
  var picker = document.getElementById("picker");
  var list   = document.getElementById("pList");
  var current = null;

  function storeById(id){
    for (var i = 0; i < STORES.length; i++) if (STORES[i].id === id) return STORES[i];
    return null;
  }

  var CHECK = '<svg class="ck" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"></path></svg>';

  function buildPicker(){
    list.textContent = "";
    STORES.forEach(function(store){
      var b = document.createElement("button");
      b.type = "button";
      b.className = "p-row";
      b.dataset.id = store.id;
      b.setAttribute("aria-current", "false");
      b.innerHTML = '<span class="nm"></span>' + CHECK;
      b.querySelector(".nm").textContent = store.name;
      b.addEventListener("click", function(){ applyStore(store, true); closePicker(); });
      list.appendChild(b);
    });
  }
  buildPicker();

  function applyStore(store, remember){
    countView(store.id);
    current = store;
    chipName.textContent = store.name;
    document.documentElement.setAttribute("data-store", store.id);
    document.title = "Menu · Kalamandir " + store.name;
    renderMenu(store.menu);
    Array.prototype.forEach.call(list.children, function(b){
      b.setAttribute("aria-current", b.dataset.id === store.id ? "true" : "false");
    });
    if (remember) { try { localStorage.setItem(STORE_KEY, store.id); } catch (e) {} }
  }

  function openPicker(){ picker.classList.add("open"); }
  function closePicker(){ picker.classList.remove("open"); }

  document.getElementById("chip").addEventListener("click", openPicker);
  picker.addEventListener("click", function(e){
    // the dimmed backdrop closes the sheet, but only once a store is known
    if (e.target === picker && current) closePicker();
  });
  document.addEventListener("keydown", function(e){
    if (e.key !== "Escape") return;
    if (appsheet.classList.contains("open")) { closeApp(); return; }
    if (current) closePicker();
  });

  /* --- nearest store from coordinates (haversine) --- */
  function nearest(lat, lng){
    var best = null, bestD = Infinity;
    STORES.forEach(function(s){
      var R = 6371, toRad = Math.PI / 180;
      var dLat = (s.lat - lat) * toRad, dLng = (s.lng - lng) * toRad;
      var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat * toRad) * Math.cos(s.lat * toRad) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
      var d = 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
      if (d < bestD) { bestD = d; best = s; }
    });
    return { store: best, km: bestD };
  }

  var geoBtn   = document.getElementById("pGeo");
  var geoLabel = document.getElementById("pGeoLabel");
  var note     = document.getElementById("pNote");
  var hint     = document.getElementById("sHint");
  var NOTE_DEFAULT = note.textContent;

  function geoProblem(err){
    // Geolocation is refused outright on plain http, which is easy to hit while testing
    if (!window.isSecureContext)  return "Location needs a secure (https) address — please pick your store.";
    if (!navigator.geolocation)   return "This browser cannot share a location — please pick your store.";
    if (!err)                     return "Could not get your location — please pick your store.";
    if (err.code === 1)           return "Location permission was blocked — please pick your store.";
    if (err.code === 3)           return "Location is taking too long — please pick your store.";
    return "Could not fix your location — please pick your store.";
  }

  function locate(onFound, onFail){
    if (!navigator.geolocation || !window.isSecureContext) { onFail(geoProblem(null)); return; }
    navigator.geolocation.getCurrentPosition(
      function(pos){ onFound(nearest(pos.coords.latitude, pos.coords.longitude)); },
      function(err){ onFail(geoProblem(err)); },
      { enableHighAccuracy: false, timeout: 9000, maximumAge: 300000 }
    );
  }

  function busyGeo(on){
    geoBtn.dataset.busy = on ? "1" : "";
    geoLabel.textContent = on ? "Finding you…" : "Use my location";
  }
  function farNote(hit){
    return "Nearest store is " + hit.store.name + ", about " + Math.round(hit.km) +
           " km away. Pick your store if that is not right.";
  }

  geoBtn.addEventListener("click", function(){
    note.textContent = NOTE_DEFAULT;
    busyGeo(true);
    locate(function(hit){
      busyGeo(false);
      applyStore(hit.store, true);
      if (hit.km > 60) note.textContent = farNote(hit); else closePicker();
    }, function(msg){
      busyGeo(false);
      note.textContent = msg;
    });
  });

  /* ══════════════════════════════════════════════════════════════
     which store to show, in order of confidence
       1. the URL — /surat, /kosamba …  (one QR per store)
       2. ?store=surat — the same thing as a query
       3. the last choice made on this phone
       4. location permission already granted → use it, no prompt
       5. otherwise ask, once
     ══════════════════════════════════════════════════════════════ */
  function fromUrl(){
    var seg = (location.pathname || "").split("/").filter(Boolean).pop() || "";
    var hit = storeById(seg.replace(/\.html?$/i, "").toLowerCase());
    if (hit) return hit;

    var q = new RegExp("[?&](?:store|b|branch)=([^&#]+)").exec(location.search);
    if (!q) return null;
    // a hand-edited link like ?store=% makes decodeURIComponent throw, which would
    // otherwise take down everything below it
    try { return storeById(decodeURIComponent(q[1]).toLowerCase()); }
    catch (e) { return null; }
  }

  function boot(){
  var urlStore = fromUrl();
  if (urlStore) {
    applyStore(urlStore, false);   // a per-store link wins and never overwrites a saved choice
  } else {
    var saved = null;
    try { saved = storeById(localStorage.getItem(STORE_KEY)); } catch (e) {}

    if (saved) {
      applyStore(saved, false);
    } else {
      renderMenu("other");   // never show a blank pane while we work it out
      var settled = false;

      // The welcome screen gives us ~3s of cover, so ask for the location now.
      // If it lands in time the store is simply already right; if not, we ask.
      hint.classList.add("on");
      locate(function(hit){
        settled = true;
        hint.classList.remove("on");
        applyStore(hit.store, true);
        busyGeo(false);
        if (hit.km > 60) {
          // too far to trust — let them correct it
          whenSplashDone(function(){ note.textContent = farNote(hit); openPicker(); });
        } else {
          closePicker();
        }
      }, function(msg){
        settled = true;
        hint.classList.remove("on");
        busyGeo(false);
        whenSplashDone(function(){ note.textContent = msg; openPicker(); });
      });

      // still waiting on the permission prompt when the welcome lifts? show the
      // sheet anyway, so nobody is left staring at a screen they cannot use
      whenSplashDone(function(){
        if (settled) return;
        busyGeo(true);
        openPicker();
      });
    }
  }
  }

  /* ══════════════════════════════════════════════════════════════
     live config
     The portal holds what this site shows. Take the cached answer first so a returning
     visitor never waits, ask for a fresh one, and start as soon as either lands — or
     after a short wait, so a sleeping API can never hold up the menu.
     ══════════════════════════════════════════════════════════════ */
  function applyConfig(cfg){
    if (!cfg || typeof cfg !== "object") return false;
    var touched = false;

    if (cfg.cards && typeof cfg.cards === "object") {
      var next = {};
      Object.keys(cfg.cards).forEach(function(key){
        var c = cfg.cards[key];
        if (!c || !c.image) return;
        next[key] = { pages: [{ src: c.image, alt: c.alt || "Kalamandir menu card" }],
                      label: c.label || key };
      });
      if (Object.keys(next).length) { MENUS = next; touched = true; }
    }

    if (Array.isArray(cfg.stores) && cfg.stores.length) {
      STORES = cfg.stores.map(function(st){
        return { id: String(st.id || "").toLowerCase(), name: st.name,
                 menu: st.menu, lat: Number(st.lat) || 0, lng: Number(st.lng) || 0 };
      }).filter(function(st){ return st.id && st.name; });
      buildPicker();
      touched = true;
    }

    if (cfg.app) {
      if (cfg.app.ios)     IOS_URL = cfg.app.ios;
      if (cfg.app.android) AND_URL = cfg.app.android;
      var t = document.getElementById("aTitle");
      var sb = document.querySelector(".a-sub");
      var nt = document.querySelector(".a-note");
      if (t  && cfg.app.title)    t.textContent  = cfg.app.title;
      if (sb && cfg.app.subtitle) sb.textContent = cfg.app.subtitle;
      if (nt && cfg.app.note)     nt.textContent = cfg.app.note;
      if (aIos && cfg.app.ios)     aIos.href = cfg.app.ios;
      if (aAnd && cfg.app.android) aAnd.href = cfg.app.android;
      touched = true;
    }
    return touched;
  }

  (function start(){
    var started = false;
    function go(){ if (started) return; started = true; boot(); }

    /* whatever was last seen, so a returning visitor starts on the current menu */
    try {
      var cached = JSON.parse(localStorage.getItem(CONFIG_KEY) || "null");
      if (cached) applyConfig(cached);
    } catch (e) {}

    var timer = setTimeout(go, CONFIG_WAIT);

    if (!window.fetch) { clearTimeout(timer); go(); return; }
    fetch(CONFIG_URL, { cache: "no-store" })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(cfg){
        if (!cfg) return;
        try { localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg)); } catch (e) {}
        if (started) {
          /* already on screen — the card is the part worth correcting straight away */
          applyConfig(cfg);
          if (current) renderMenu(current.menu);
        } else {
          applyConfig(cfg);
        }
      })
      .catch(function(){})
      .then(function(){ clearTimeout(timer); go(); });
  })();
})();
