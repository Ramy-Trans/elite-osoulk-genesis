/**
 * Lightweight TTL response cache.
 *
 * Usage — cache a GET endpoint for 30 seconds:
 *   app.get("/api/stats", cache(30), async (req, res) => { ... });
 *
 * Invalidation — bust one or more cache keys after a write:
 *   bustCache("stats", "site-settings");
 */

const _cache = new Map();

/**
 * Express middleware factory.
 * @param {number} ttlSeconds
 * @param {string} [key]  override the cache key (defaults to req.path)
 */
export function cache(ttlSeconds, key) {
  return function cacheMiddleware(req, res, next) {
    if (req.method !== "GET") return next();

    const cacheKey = key || req.path;
    const entry    = _cache.get(cacheKey);

    if (entry && Date.now() < entry.expiresAt) {
      res.setHeader("X-Cache", "HIT");
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.send(entry.body);
    }

    res.setHeader("X-Cache", "MISS");

    const origJson = res.json.bind(res);
    res.json = function (data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        _cache.set(cacheKey, {
          body:      JSON.stringify(data),
          expiresAt: Date.now() + ttlSeconds * 1000,
        });
      }
      return origJson(data);
    };

    next();
  };
}

/**
 * Immediately invalidate one or more cache entries by key.
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
