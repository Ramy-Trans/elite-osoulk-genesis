import { createPool } from "mysql2/promise";

let pool = null;

export function getPool() {
  if (!pool) {
    const host = process.env.DB_HOST;
    const user = process.env.DB_USER;
    const database = process.env.DB_NAME;
    const port = parseInt(process.env.DB_PORT || "3306", 10);

    if (!host || !user || !database) {
      throw new Error(
        "[db] Missing required env vars: DB_HOST, DB_USER, DB_NAME must all be set."
      );
    }

    if (host === "localhost" || host === "127.0.0.1") {
      console.warn(
        "[db] WARNING: DB_HOST is set to 'localhost'. When running on an external " +
        "platform (Replit, etc.) this points to the container itself, not Hostinger. " +
        "Set DB_HOST to your Hostinger MySQL hostname (e.g. your server IP or the " +
        "hostname shown in Hostinger hPanel → Databases → Remote MySQL)."
      );
    }

    pool = createPool({
      host,
      user,
      password: process.env.DB_PASSWORD,
      database,
      port,
      waitForConnections: true,
      connectionLimit:    10,
      queueLimit:         0,
      timezone:           "Z",
      charset:            "utf8mb4",
      // Connection timeout for initial handshake (ms)
      connectTimeout:     10000,
      // Keep-alive to detect and drop stale connections
      enableKeepAlive:    true,
      keepAliveInitialDelay: 10000,
    });

    console.log(`[db] Pool created → ${host}:${port}/${database}`);
  }
  return pool;
}

/**
 * Test the MySQL connection with up to `retries` attempts.
 * Returns { ok, host, error } so callers can log details.
 */
export async function testConnection(retries = 3, delayMs = 2000) {
  const host = process.env.DB_HOST || "(not set)";
  const port = process.env.DB_PORT || "3306";
  const database = process.env.DB_NAME || "(not set)";

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await getPool().getConnection();
      await conn.ping();
      conn.release();
      console.log(`[db] MySQL connection OK → ${host}:${port}/${database}`);
      return { ok: true, host, port, database };
    } catch (err) {
      console.error(
        `[db] Connection attempt ${attempt}/${retries} failed → ` +
        `${host}:${port}/${database} — ${err.message}`
      );
      if (err.message.includes("localhost") || err.message.includes("127.0.0.1")) {
        console.error(
          "[db] HINT: DB_HOST=localhost means the app is trying to connect to MySQL " +
          "on this machine. For Hostinger, set DB_HOST to your remote MySQL hostname."
        );
      }
      if (attempt < retries) {
        console.log(`[db] Retrying in ${delayMs}ms…`);
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  }
  return { ok: false, host, port, database };
}
