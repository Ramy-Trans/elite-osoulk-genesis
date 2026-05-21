const CACHE = "osoulk-v4";
const PRECACHE = ["/manifest.json", "/favicon.ico"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const { request } = e;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") return;

  const isStaticAsset = /\.(js|css|woff2?|ttf|otf|png|jpg|jpeg|webp|gif|svg|ico)(\?.*)?$/.test(url.pathname);

  if (isStaticAsset) {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          if (!res || res.status !== 200 || res.type !== "basic") return res;
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(request, clone)).catch(() => {});
          return res;
        });
      }).catch(() => fetch(request))
    );
  }
});
