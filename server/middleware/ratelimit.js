/**
 * In-memory IP rate limiter — no external dependencies.
 * Two tiers:
 *   default : 300 requests / 15 minutes
 *   strict  : 15  requests / 15 minutes  (auth endpoints)
 */

const WINDOW_MS  = 15 * 60 * 1000;
const DEFAULT_MAX = 300;
const STRICT_MAX  = 15;

const _store = new Map();

function getRecord(ip) {
  const now = Date.now();
  let rec = _store.get(ip);
  if (!rec || now > rec.resetAt) {
    rec = { count: 0, resetAt: now + WINDOW_MS };
    _store.set(ip, rec);
  }
  return rec;
}

function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

function buildLimiter(max) {
  return function rateLimiter(req, res, next) {
    const ip  = getClientIp(req);
    const rec = getRecord(ip);
    rec.count += 1;

    res.setHeader("X-RateLimit-Limit",     String(max));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - rec.count)));
    res.setHeader("X-RateLimit-Reset",     String(Math.ceil(rec.resetAt / 1000)));

    if (rec.count > max) {
      const retryAfterSec = Math.ceil((rec.resetAt - Date.now()) / 1000);
      res.setHeader("Retry-After", String(retryAfterSec));
      return res.status(429).json({
        ok: false,
        message: "Too many requests — please slow down and try again shortly.",
        retryAfterSeconds: retryAfterSec,
      });
    }

    next();
  };
}

export const rateLimiter       = buildLimiter(DEFAULT_MAX);
export const strictRateLimiter = buildLimiter(STRICT_MAX);

// Purge stale records every 30 minutes to avoid memory growth
setInterval(() => {
  const now = Date.now();
  for (const [ip, rec] of _store) {
    if (now > rec.resetAt) _store.delete(ip);
  }
}, 30 * 60 * 1000).unref();
