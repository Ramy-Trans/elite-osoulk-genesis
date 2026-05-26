const CACHE = "osoulk-v9";
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
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // Never intercept API, auth, or admin routes — always go straight to network
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.includes("login") ||
    url.pathname.includes("register") ||
    url.pathname.includes("signup")
  ) return;

  // Navigation requests (page loads) — network-first, fallback to cache
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then(cached => cached || caches.match("/"))
      )
    );
    return;
  }

  const isStaticAsset = /\.(js|css|woff2?|ttf|otf|png|jpg|jpeg|webp|gif|svg|ico)(\?.*)?$/.test(url.pathname);
  if (!isStaticAsset) return;

  // Hashed assets (content-addressed) — cache-first, then network
  const isHashedAsset = /[.-][a-f0-9]{8,}\.(js|css)(\?.*)?$/.test(url.pathname);
  if (isHashedAsset) {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          if (!res || res.status !== 200 || res.type !== "basic") return res;
          const toCache = res.clone();
          caches.open(CACHE).then(c => c.put(request, toCache)).catch(() => {});
          return res;
        });
      }).catch(() => fetch(request))
    );
    return;
  }

  // Non-hashed static assets — stale-while-revalidate with timestamp
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
          const toReturn = new Response(body, { status: res.status, statusText: res.statusText, headers });
          const toCache = new Response(body.slice(0), { status: res.status, statusText: res.statusText, headers });
          cache.put(request, toCache).catch(() => {});
          return toReturn;
        }
        return res;
      } catch {
        return cached || new Response("Offline", { status: 503, statusText: "Service Unavailable" });
      }
    })
  );
});
