const CACHE_NAME = "receipt-book-build-20260131-083942";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css","./style.css?v=build-20260131-083942",
  "./app.js","./app.js?v=build-20260131-083942",
  "./manifest.webmanifest","./manifest.webmanifest?v=build-20260131-083942",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (e)=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e)=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE_NAME ? caches.delete(k) : null)))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e)=>{
  const req = e.request;
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res=>{
      return res;
    }).catch(()=>cached))
  );
});
