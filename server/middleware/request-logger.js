/**
 * Structured per-request logger.
 *
 * Logs:  [req] GET /api/stats 200 12ms  req=abc123
 * On slow responses (>1 s) it also logs a SLOW warning.
 *
 * Skips: static asset paths (/assets/, /properties/ images, etc.)
 */

import { randomUUID } from "crypto";

const SKIP_PREFIXES = ["/assets/", "/properties/", "/@", "/node_modules/", "/favicon"];

export function requestLogger(req, res, next) {
  const path = req.path;
  if (SKIP_PREFIXES.some(p => path.startsWith(p))) return next();

  const id    = randomUUID().slice(0, 8);
  const start = Date.now();
  req.reqId   = id;

  res.on("finish", () => {
    const ms      = Date.now() - start;
    const level   = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    const prefix  = `[req:${level}]`;
    const cache   = res.getHeader("X-Cache") ? ` cache=${res.getHeader("X-Cache")}` : "";
    const msg     = `${prefix} ${req.method} ${path} ${res.statusCode} ${ms}ms req=${id}${cache}`;

    if (res.statusCode >= 500)       console.error(msg);
    else if (res.statusCode >= 400)  console.log(msg);
    else if (ms > 1000)              console.log(`[req:slow] ${req.method} ${path} ${res.statusCode} ${ms}ms req=${id}`);
  });

  next();
}
