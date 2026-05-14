const CACHE = "osoulk-v2";
const STATIC = ["/", "/explore", "/agencies", "/packages", "/manifest.json", "/favicon.ico"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const { request } = e;
  if (request.method !== "GET") return;
  if (request.url.includes("/api/")) return;

  e.respondWith(
    caches.match(request).then(cached => {
      const net = fetch(request).then(res => {
        // Guard: only cache valid same-origin successful responses.
        // Do NOT cache opaque, redirect, or error responses (e.g. 503s).
        if (!res || res.status !== 200 || res.type !== "basic") return res;

        // Clone IMMEDIATELY — before returning res to the browser.
        // Calling clone() after res is consumed causes "body already used" crash.
        const toCache = res.clone();
        caches.open(CACHE).then(c => c.put(request, toCache));
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
