const CACHE = "osoulk-v2";
const STATIC = ["/", "/explore", "/agencies", "/packages", "/manifest.json", "/favicon.ico"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(STATIC).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;

  // Only handle GET requests
  if (request.method !== "GET") return;

  // Ignore API calls completely
  if (request.url.includes("/api/")) return;

  e.respondWith((async () => {
    const cached = await caches.match(request);

    try {
      const res = await fetch(request);

      // IMPORTANT SAFETY CHECKS
      if (!res || res.status !== 200) return res;

      // Only cache real same-origin responses
      if (res.type !== "basic") return res;

      const cache = await caches.open(CACHE);

      // 🔥 KEY FIX: clone immediately, once, safely
      const responseToCache = res.clone();

      cache.put(request, responseToCache).catch(() => {});

      return res;
    } catch (err) {
      return cached;
    }
  })());
});
