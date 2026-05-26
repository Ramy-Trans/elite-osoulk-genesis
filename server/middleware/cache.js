/**
 * TTL response cache with stale-while-revalidate fallback.
 *
 * Fresh → served from cache instantly (X-Cache: HIT)
 * Stale → next() is called for a fresh response; on any 5xx the stale body is
 *          returned instead of an error (X-Cache: STALE)
 * Miss  → next() populates the cache on a successful 2xx response
 *
 * Usage:
 *   app.get("/api/stats", cache(30), handler);   // 30-second TTL
 *
 * Invalidation:
 *   bustCache("/api/stats");
 *   bustCachePrefix("/api/");
 */

const _cache = new Map();
const STALE_MULTIPLIER = 10;

/**
 * Express middleware factory.
 * @param {number} ttlSeconds   How long a response is considered fresh.
 * @param {string} [key]        Override the cache key (defaults to req.path).
 */
export function cache(ttlSeconds, key) {
  return function cacheMiddleware(req, res, next) {
    if (req.method !== "GET") return next();

    const cacheKey = key || req.path;
    const entry    = _cache.get(cacheKey);
    const now      = Date.now();

    if (entry && now < entry.expiresAt) {
      res.setHeader("X-Cache", "HIT");
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.send(entry.body);
    }

    const staleEntry = (entry && now < entry.staleUntil) ? entry : null;
    res.setHeader("X-Cache", staleEntry ? "REVALIDATING" : "MISS");

    const origJson = res.json.bind(res);
    res.json = function (data) {
      const code = res.statusCode;

      if (code >= 500 && staleEntry) {
        res.setHeader("X-Cache", "STALE");
        res.statusCode = 200;
        return origJson(JSON.parse(staleEntry.body));
      }

      if (code >= 200 && code < 300) {
        _cache.set(cacheKey, {
          body:       JSON.stringify(data),
          expiresAt:  now + ttlSeconds * 1000,
          staleUntil: now + ttlSeconds * STALE_MULTIPLIER * 1000,
        });
      }

      return origJson(data);
    };

    next();
  };
}

/**
 * Immediately invalidate one or more cache entries by exact key.
 * @param {...string} keys
 */
export function bustCache(...keys) {
  for (const k of keys) _cache.delete(k);
}

/**
 * Bust all cache entries whose key starts with a prefix.
 * @param {string} prefix
 */
export function bustCachePrefix(prefix) {
  for (const k of _cache.keys()) {
    if (k.startsWith(prefix)) _cache.delete(k);
  }
}

/**
 * Return current cache size (for health/debug endpoints).
 */
export function getCacheSize() {
  return _cache.size;
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of _cache) {
    if (now > v.staleUntil) _cache.delete(k);
  }
}, 5 * 60 * 1000).unref();
