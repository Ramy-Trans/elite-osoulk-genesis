/**
 * In-memory IP rate limiter — no external dependencies.
 * Two tiers:
 *   default : 300 requests / 15 minutes
 *   strict  : 60  requests / 15 minutes  (auth endpoints)
 *
 * IP detection: Replit autoscale sits behind a reverse proxy that appends to
 * X-Forwarded-For.  We take the LAST non-private IP in the list so that
 * all users are not bucketed together under the proxy's own IP.
 */

const WINDOW_MS   = 15 * 60 * 1000;
const DEFAULT_MAX = 500;
const STRICT_MAX  = 300;

const _store = new Map();

function isPrivateIp(ip) {
  return (
    ip === "127.0.0.1" || ip === "::1" ||
    ip.startsWith("10.")           ||
    ip.startsWith("192.168.")      ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  );
}

function getClientIp(req) {
  // With `app.set("trust proxy", true)`, Express populates req.ip correctly.
  // X-Forwarded-For is: "client, proxy1, proxy2" — leftmost is the real client.
  const xff = req.headers["x-forwarded-for"];
  if (xff) {
    const first = xff.split(",")[0].trim();
    if (first) return first;
  }
  return (
    req.headers["x-real-ip"]  ||
    req.ip                     ||
    req.socket?.remoteAddress  ||
    "unknown"
  );
}

function getRecord(ip) {
  const now = Date.now();
  let rec = _store.get(ip);
  if (!rec || now > rec.resetAt) {
    rec = { count: 0, resetAt: now + WINDOW_MS };
    _store.set(ip, rec);
  }
  return rec;
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
