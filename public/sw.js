const CACHE = "osoulk-v5";
const CACHE_MAX_AGE = 10 * 60 * 1000;
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
          });
        }).catch(() => fetch(request))
      );
    } else {
      e.respondWith(
        caches.open(CACHE).then(async cache => {
          const cached = await cache.match(request);
          if (cached) {
            const cachedAt = parseInt(cached.headers.get("X-Cache-Timestamp") || "0", 10);
            if (Date.now() - cachedAt < CACHE_MAX_AGE) return cached;
          }
          try {
            const res = await fetch(request);
            if (res && res.status === 200 && res.type === "basic") {
              const headers = new Headers(res.headers);
              headers.set("X-Cache-Timestamp", String(Date.now()));
              const body = await res.arrayBuffer();
              const stamped = new Response(body, { status: res.status, statusText: res.statusText, headers });
              cache.put(request, stamped.clone()).catch(() => {});
              return stamped;
            }
            return res;
          } catch {
            return cached || new Response("", { status: 503 });
          }
        })
      );
    }
  }
});
