/* Receipt Book PWA - Service Worker */
const CACHE_NAME = "receipt-book-cache-20260131101432";
const CORE_ASSETS = ['./', './index.html', './app.20260131100445.js', './style.css', './icons/icon-192.png', './icons/icon-512.png', './manifest.webmanifest'];

// Install: cache core
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(()=>{})
  );
});

// Activate: cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME) ? caches.delete(k) : Promise.resolve()));
    await self.clients.claim();
  })());
});

// Fetch: cache-first for same-origin core, network-first for others
// Fetch:
// - Same-origin HTML/JS/CSS: network-first (so updates always reflect)
// - Same-origin other assets: cache-first
// - Cross-origin: network-first
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if(req.method !== "GET") return;

  const isSame = (url.origin === location.origin);

  const isHTML = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
  const isJS   = url.pathname.endsWith(".js");
  const isCSS  = url.pathname.endsWith(".css");

  if(isSame && (isHTML || isJS || isCSS)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const res = await fetch(req, { cache: "no-store" });
        if(res && res.ok) {
          cache.put(req, res.clone());
        }
        return res;
      } catch(e) {
        const cached = await cache.match(req);
        if(cached) return cached;
        if(isHTML) {
          const fallback = await cache.match("./index.html");
          if(fallback) return fallback;
        }
        throw e;
      }
    })());
    return;
  }

  if(isSame) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      if(cached) return cached;
      const res = await fetch(req);
      if(res && res.ok) cache.put(req, res.clone());
      return res;
    })());
    return;
  }

  event.respondWith(fetch(req));
});