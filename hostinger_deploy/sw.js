const CACHE = "osoulk-v6";
const STATIC = ["/manifest.json", "/favicon.ico"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC).catch(() => {}))
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

  // Never intercept API, auth, or admin routes
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.includes("login") ||
    url.pathname.includes("register")
  ) return;

  // Navigation requests — network-first, graceful offline fallback
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request)
        .then(res => {
          // Cache a copy of successful navigation responses
          if (res && res.status === 200 && res.type === "basic") {
            caches.open(CACHE).then(c => c.put(request, res.clone())).catch(() => {});
          }
          return res;
        })
        .catch(() =>
          caches.match(request).then(cached =>
            cached || new Response("<h1>Offline</h1><p>Please check your connection.</p>", {
              status: 503,
              headers: { "Content-Type": "text/html" },
            })
          )
        )
    );
    return;
  }

  // Static assets — network-first with cache fallback
  e.respondWith(
    fetch(request)
      .then(res => {
        if (!res || res.status !== 200 || res.type !== "basic") return res;
        // Clone BEFORE the body is consumed — critical to avoid "already used" error
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(request, clone)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(request).then(cached =>
          cached || new Response("", { status: 503, statusText: "Offline" })
        )
      )
  );
});
