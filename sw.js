const CACHE_NAME = "liubc-pwa-v2";
const ASSETS = [
  "/liubc-app/",
  "/liubc-app/index.html",
  "/liubc-app/styles.css",
  "/liubc-app/manifest.webmanifest",
  "/liubc-app/pdf-list.js",
  "/liubc-app/offline.html",
  "/liubc-app/icons/icon-192.png",
  "/liubc-app/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => (k === CACHE_NAME ? null : caches.delete(k)))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  event.respondWith(
    caches.match(req).then((cached) => {
      return cached || fetch(req).catch(() => caches.match("./offline.html"));
    })
  );
});

