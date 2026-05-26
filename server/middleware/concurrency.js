/**
 * Global in-flight concurrency limiter.
 *
 * Prevents a traffic spike from opening more simultaneous DB connections
 * than the PostgreSQL pool can handle.  Requests that arrive when the
 * server is already at capacity receive a 503 with a Retry-After hint.
 *
 * Defaults to 80 concurrent API requests.  Override via env:
 *   MAX_CONCURRENT_REQUESTS=50
 */

const MAX = parseInt(process.env.MAX_CONCURRENT_REQUESTS || "80", 10);
let _active = 0;

export function concurrencyLimiter(req, res, next) {
  if (!req.path.startsWith("/api/")) return next();

  if (_active >= MAX) {
    res.setHeader("Retry-After", "2");
    return res.status(503).json({
      ok: false,
      message: "Server is under heavy load — please retry in a moment.",
      retryAfterSeconds: 2,
    });
  }

  _active++;

  function done() { _active = Math.max(0, _active - 1); }
  res.on("finish", done);
  res.on("close",  done);

  next();
}

export function getActiveCount() { return _active; }
