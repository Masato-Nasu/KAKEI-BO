/* Receipt Book PWA - Service Worker */
const CACHE_NAME = "receipt-book-cache-20260131094013";
const CORE_ASSETS = ['./', './index.html', './app.js', './style.css', './icons/icon-192.png', './icons/icon-512.png', './manifest.webmanifest'];

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
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET
  if(req.method !== "GET") return;

  // Same-origin: cache-first, fallback network
  if(url.origin === location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req, { ignoreSearch: true });
      if(cached) return cached;
      try {
        const res = await fetch(req);
        // Cache successful responses for local files
        if(res && res.ok) cache.put(req, res.clone());
        return res;
      } catch(e) {
        // Offline fallback: index for navigations
        if(req.mode === "navigate") {
          const fallback = await cache.match("./index.html");
          if(fallback) return fallback;
        }
        throw e;
      }
    })());
    return;
  }

  // Cross-origin (CDN/tessdata): network-first (do not cache aggressively)
  event.respondWith((async () => {
    try {
      return await fetch(req);
    } catch(e) {
      // If offline, just fail; OCR needs network unless language data is bundled.
      throw e;
    }
  })());
});
