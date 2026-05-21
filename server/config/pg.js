import dns from "dns";
import pg from "pg";

const { Pool } = pg;

let pool = null;

/**
 * Try to resolve `hostname` to an IPv4 address.
 * Replit's sandbox has no external IPv6 routes, so ENETUNREACH occurs when
 * the OS picks an IPv6 result from DNS.
 */
function resolveIPv4(hostname) {
  return new Promise((resolve) =>
    dns.lookup(hostname, { family: 4 }, (err, address) =>
      resolve(err ? null : address)
    )
  );
}

/**
 * Extract the hostname from a postgres connection string.
 * Passwords may contain '@', so we use lastIndexOf to find the real delimiter.
 */
function extractHostname(connStr) {
  const lastAt  = connStr.lastIndexOf("@");
  const afterAt = connStr.slice(lastAt + 1);    // "host:port/db" or "host/db"
  return afterAt.split(":")[0].split("/")[0];
}

/**
 * Build a pool for a given connection string.
 * Attempts to swap the hostname for its IPv4 address first.
 */
async function buildPool(connectionString) {
  const hostname    = extractHostname(connectionString);
  const ipv4Address = await resolveIPv4(hostname);

  let connStr = connectionString;
  if (ipv4Address && ipv4Address !== hostname) {
    const lastAt  = connectionString.lastIndexOf("@");
    const afterAt = connectionString.slice(lastAt + 1);
    connStr = connectionString.slice(0, lastAt + 1) + afterAt.replace(hostname, ipv4Address);
    console.log(`[pg] ${hostname} → ${ipv4Address} (IPv4)`);
  }

  const useSSL =
    connectionString.includes("supabase.co") ||
    connectionString.includes("neon.tech")   ||
    connectionString.includes("render.com")  ||
    process.env.NODE_ENV === "production";

  const p = new Pool({
    connectionString: connStr,
    ssl:  useSSL ? { rejectUnauthorized: false } : false,
    max:  10,
    idleTimeoutMillis:       30_000,
    connectionTimeoutMillis: 10_000,
  });
  p.on("error", (err) => console.error("[pg] Pool error:", err.message));
  return p;
}

/**
 * Initialise the PostgreSQL pool.
 * Tries SUPABASE_DATABASE_URL first (production / Supabase).
 * Falls back to DATABASE_URL (Replit's managed PostgreSQL) if Supabase
 * is unreachable (e.g. Replit dev sandbox blocks external PG port).
 *
 * Returns the active pool, or null if no URL is configured.
 */
export async function initPgPool() {
  if (pool) return pool;

  const candidates = [
    process.env.SUPABASE_DATABASE_URL,
    process.env.DATABASE_URL,
  ].filter(Boolean);

  if (!candidates.length) return null;

  for (const connStr of candidates) {
    const safeUrl = connStr.replace(/:\/\/[^:]+:[^@]*@/, "://**:**@");
    try {
      const candidate = await buildPool(connStr);

      // Quick connectivity check before committing to this pool
      const client = await candidate.connect();
      await client.query("SELECT 1");
      client.release();

      pool = candidate;
      console.log(`[pg] Pool ready → ${safeUrl}`);
      return pool;
    } catch (err) {
      console.warn(`[pg] Cannot reach ${safeUrl}: ${err.message} — trying next…`);
    }
  }

  console.error("[pg] All PostgreSQL connection candidates failed.");
  return null;
}

/** Returns the already-initialised pool (throws if initPgPool was not called). */
export function getPgPool() {
  if (!pool) throw new Error("[pg] Pool not initialised — call initPgPool() first.");
  return pool;
}

export async function testPgConnection(retries = 3, delayMs = 2000) {
  const connStr  = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || "(not set)";
  const safeUrl  = connStr.replace(/:\/\/[^:]+:[^@]*@/, "://**:**@");

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = await getPgPool().connect();
      const t0 = Date.now();
      await client.query("SELECT 1");
      const latency = Date.now() - t0;
      client.release();
      console.log(`[pg] Connection OK → ${safeUrl} (${latency}ms)`);
      return { ok: true, latency };
    } catch (err) {
      console.error(`[pg] Attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt < retries) await new Promise(r => setTimeout(r, delayMs));
    }
  }
  return { ok: false };
}
