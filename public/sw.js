const CACHE = "osoulk-v3";
const PRECACHE = ["/manifest.json", "/favicon.ico"];

// Install: precache only small static assets (not HTML pages, to avoid stale app shells)
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// Activate: remove old caches
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch: network-first for navigation and API, cache-first for static assets
self.addEventListener("fetch", e => {
  const { request } = e;

  // Skip non-GET requests entirely
  if (request.method !== "GET") return;

  // Skip Supabase API calls (always network)
  if (request.url.includes("supabase.co")) return;

  // Skip cross-origin requests
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Skip navigation requests (HTML pages) — always fetch fresh to avoid stale app shells
  if (request.mode === "navigate") return;

  // For static assets (JS, CSS, images, fonts): cache-first with network fallback
  const isStaticAsset = /\.(js|css|woff2?|ttf|otf|png|jpg|jpeg|webp|gif|svg|ico)(\?.*)?$/.test(url.pathname);

  if (isStaticAsset) {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          // Only cache valid, same-origin, successful responses
          if (!res || res.status !== 200 || res.type !== "basic") return res;
          // Clone BEFORE consuming the body
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(request, clone)).catch(() => {});
          return res;
        });
      }).catch(() => fetch(request))
    );
    return;
  }

  // Everything else: network only
});
