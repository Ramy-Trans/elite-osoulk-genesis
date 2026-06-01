import dns from "dns";
import pg from "pg";

const { Pool } = pg;

let pool = null;

function resolveIPv4(hostname) {
  return new Promise((resolve) =>
    dns.lookup(hostname, { family: 4 }, (err, address) =>
      resolve(err ? null : address)
    )
  );
}

function extractHostname(connStr) {
  const lastAt  = connStr.lastIndexOf("@");
  const afterAt = connStr.slice(lastAt + 1);
  return afterAt.split(":")[0].split("/")[0];
}

async function buildPool(connectionString) {
  const hostname    = extractHostname(connectionString);

  // Only substitute the hostname with its IPv4 address for internal/private hosts
  // (e.g. Replit's managed PG on helium). For external cloud DBs (Neon, Supabase, etc.)
  // NEVER replace the hostname — SSL cert validation uses SNI and requires the original
  // hostname. Replacing with an IP causes "Host: <ip> not in cert's altnames" errors.
  const isExternalHost =
    connectionString.includes("neon.tech")     ||
    connectionString.includes("supabase.co")   ||
    connectionString.includes("render.com")    ||
    connectionString.includes("amazonaws.com") ||
    connectionString.includes("cockroachdb.com");

  let connStr = connectionString;
  if (!isExternalHost) {
    const ipv4Address = await resolveIPv4(hostname);
    if (ipv4Address && ipv4Address !== hostname) {
      const lastAt  = connectionString.lastIndexOf("@");
      const afterAt = connectionString.slice(lastAt + 1);
      connStr = connectionString.slice(0, lastAt + 1) + afterAt.replace(hostname, ipv4Address);
      console.log(`[pg] ${hostname} → ${ipv4Address} (IPv4)`);
    }
  }

  const useSSL = isExternalHost || process.env.NODE_ENV === "production";

  // For external cloud DBs, also force IPv4 resolution so we never attempt
  // an IPv6 connection (Replit containers often cannot reach IPv6 addresses).
  if (isExternalHost) {
    const ipv4Address = await resolveIPv4(hostname);
    if (ipv4Address && ipv4Address !== hostname) {
      const lastAt  = connectionString.lastIndexOf("@");
      const afterAt = connectionString.slice(lastAt + 1);
      connStr = connectionString.slice(0, lastAt + 1) + afterAt.replace(hostname, ipv4Address);
      console.log(`[pg] ${hostname} → ${ipv4Address} (IPv4, external)`);
    }
  }

  const p = new Pool({
    connectionString: connStr,
    // rejectUnauthorized:false lets self-signed / private CA certs through.
    // servername ensures the correct SNI hostname is sent even when connecting
    // via an IP address (fixes "host not in cert altnames" for cloud DBs).
    ssl: useSSL ? { rejectUnauthorized: false, servername: hostname } : false,
    max:  10,
    idleTimeoutMillis:       30_000,
    connectionTimeoutMillis: 10_000,
  });

  // Set a PostgreSQL-level statement timeout on every new connection.
  // This prevents any individual query from hanging forever, which is the
  // primary cause of 504 gateway timeouts under load or during DB hiccups.
  p.on("connect", (client) => {
    client.query("SET statement_timeout = '10000'").catch((err) => {
      console.warn("[pg] Could not set statement_timeout:", err.message);
    });
  });

  p.on("error", (err) => console.error("[pg] Pool error:", err.message));
  return p;
}

/**
 * Initialise the PostgreSQL pool.
 * Priority: DATABASE_URL (Replit's managed PG) → SUPABASE_DATABASE_URL
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

export function getPgPool() {
  if (!pool) throw new Error("[pg] Pool not initialised — call initPgPool() first.");
  return pool;
}

export async function testPgConnection(retries = 3, delayMs = 2000) {
  const connStr  = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || "(not set)";
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
