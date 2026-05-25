const CACHE = "osoulk-v6";
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

  if (request.url.includes("/api/")) return;

  if (request.mode === "navigate") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isHashedAsset = /[.-][a-f0-9]{8,}\.(js|css)(\?.*)?$/.test(url.pathname);

  if (isHashedAsset) {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          if (!res || res.status !== 200 || res.type !== "basic") return res;
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(request, clone)).catch(() => {});
          return res;
        }).catch(() => new Response("", { status: 503 }));
      })
    );
    return;
  }

  const isStaticAsset = /\.(woff2?|ttf|otf|png|jpg|jpeg|webp|gif|svg|ico)(\?.*)?$/.test(url.pathname);
  if (!isStaticAsset) return;

  e.respondWith((async () => {
    const cached = await caches.match(request);
    try {
      const res = await fetch(request);
      if (!res || res.status !== 200 || res.type !== "basic") return res || cached;
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(request, clone)).catch(() => {});
      return res;
    } catch {
      return cached || new Response("", { status: 503 });
    }
  })());
});
