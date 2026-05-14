/**
 * Dual-mode database adapter.
 *
 * When DB_HOST env var is set  → tries MySQL (Hostinger production)
 * When DB_HOST is NOT set      → uses JSON files (Replit / local dev)
 *
 * If DB_HOST is set but MySQL is unreachable, `setDbAvailable(false)`
 * switches the adapter to JSON-file fallback so the site keeps running.
 *
 * All methods are async so callers are identical in both modes.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { getPool } from "../config/db.js";

const WANTS_MYSQL = !!(process.env.DB_HOST);

// Runtime flag — flipped to false when connection fails, back to true on reconnect
let dbAvailable = WANTS_MYSQL;
let reconnectTimer = null;

/** Call with false after a failed testConnection() — logs loudly, no silent fallback */
export function setDbAvailable(val) {
  const prev = dbAvailable;
  dbAvailable = !!val;
  if (!val && WANTS_MYSQL && prev !== false) {
    console.error(
      "[adapter] FATAL: MySQL is unreachable. " +
      "DB_HOST=" + (process.env.DB_HOST || "(not set)") + " " +
      "DB_NAME=" + (process.env.DB_NAME || "(not set)") + ". " +
      "The server will NOT fall back to JSON files. Fix the DB connection."
    );
  }
  if (val && WANTS_MYSQL && prev === false) {
    console.log("[adapter] MySQL reconnected — adapter switched back to MySQL mode.");
  }
}

/**
 * Start a background retry loop that pings MySQL every `intervalMs` ms.
 * Stops automatically once a connection is re-established.
 * Safe to call multiple times — only one loop runs at a time.
 */
export function startReconnectLoop(intervalMs = 120_000) {
  if (!WANTS_MYSQL) return;
  if (reconnectTimer) return;

  console.log(`[adapter] Will retry MySQL connection every ${intervalMs / 1000}s…`);

  reconnectTimer = setInterval(async () => {
    try {
      const conn = await getPool().getConnection();
      await conn.ping();
      conn.release();
      // Success — activate MySQL and stop retrying
      setDbAvailable(true);
      clearInterval(reconnectTimer);
      reconnectTimer = null;
    } catch {
      // Still unreachable — keep waiting silently
    }
  }, intervalMs);

  // Don't hold the Node process open just for this timer
  if (reconnectTimer?.unref) reconnectTimer.unref();
}

/** True only when we actually have a live MySQL connection */
function useMysql() { return WANTS_MYSQL && dbAvailable; }

// ─── File/table mapping ───────────────────────────────────────────────────────
// Each entry: { file: "filename.json", table: "mysql_table", type: "array"|"object" }
const MAP = {
  "users":            { file: "users.json",            table: "users",           type: "array"  },
  "subscribers":      { file: "subscribers.json",       table: "subscribers",     type: "array"  },
  "reel-requests":    { file: "reel-requests.json",     table: "reel_requests",   type: "array"  },
  "user-listings":    { file: "user-listings.json",     table: "user_listings",   type: "array"  },
  "projects":         { file: "projects.json",          table: "dev_projects",    type: "array"  },
  "inquiries":        { file: "inquiries.json",         table: "inquiries",       type: "array"  },
  "articles":         { file: "articles.json",          table: "articles",        type: "array"  },
  "faqs":             { file: "faqs.json",              table: "faqs",            type: "array"  },
  "public-projects":  { file: "public-projects.json",   table: "public_projects", type: "array"  },
  "pages":            { file: "pages.json",             table: "pages",           type: "array"  },
  "html-snippets":    { file: "html-snippets.json",     table: "html_snippets",   type: "array"  },
  "media":            { file: "media.json",             table: "media",           type: "array"  },
  "activity-log":     { file: "activity-log.json",      table: "activity_log",    type: "array"  },
  "email-queue":      { file: "email-queue.json",       table: "email_queue",     type: "array"  },
  "sections":         { file: "sections.json",          table: "sections",        type: "array"  },
  // object stores — all go into kv_store in MySQL
  "seo":                   { file: "seo.json",                  table: "kv_store", type: "object" },
  "views":                 { file: "views.json",                table: "property_views", type: "views" },
  "site-settings":         { file: "site-settings.json",        table: "kv_store", type: "object" },
  "saved":                 { file: "saved.json",                table: "kv_store", type: "object" },
  "saved-searches":        { file: "saved-searches.json",       table: "kv_store", type: "object" },
  "server-notifications":  { file: "server-notifications.json", table: "kv_store", type: "object" },
  "alert-settings":        { file: "alert-settings.json",       table: "kv_store", type: "object" },
  "alert-stats":           { file: "alert-stats.json",          table: "kv_store", type: "object" },
  "sent-alerts":           { file: "sent-alerts.json",          table: "kv_store", type: "object" },
  "text-content":          { file: "text-content.json",         table: "kv_store", type: "object" },
  "section-seo":           { file: "section-seo.json",          table: "kv_store", type: "object" },
};

// ─── JSON helpers (used in non-MySQL mode) ────────────────────────────────────
let DATA_DIR = join(new URL(".", import.meta.url).pathname, "..", "data");

export function setDataDir(dir) { DATA_DIR = dir; }

function jsonPath(file) { return join(DATA_DIR, file); }

function readArr(file) {
  const p = jsonPath(file);
  if (!existsSync(p)) return [];
  try { return JSON.parse(readFileSync(p, "utf8")); } catch { return []; }
}
function readObj(file) {
  const p = jsonPath(file);
  if (!existsSync(p)) return {};
  try { return JSON.parse(readFileSync(p, "utf8")); } catch { return {}; }
}
function writeFile(file, data) {
  writeFileSync(jsonPath(file), JSON.stringify(data, null, 2));
}

// ─── MySQL helpers ─────────────────────────────────────────────────────────────
async function sqlGetAll(table) {
  const [rows] = await getPool().query(`SELECT data FROM \`${table}\` ORDER BY created_at ASC`);
  return rows.map(r => (typeof r.data === "string" ? JSON.parse(r.data) : r.data));
}

async function sqlReplaceAll(table, arr) {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`DELETE FROM \`${table}\``);
    for (const item of arr) {
      const id = item.id || item.slug || String(Date.now());
      await conn.query(
        `INSERT INTO \`${table}\` (id, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data=VALUES(data)`,
        [id, JSON.stringify(item)]
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function sqlInsert(table, item) {
  const id = item.id || item.slug || String(Date.now());
  await getPool().query(
    `INSERT INTO \`${table}\` (id, data) VALUES (?, ?)`,
    [id, JSON.stringify(item)]
  );
  return item;
}

async function sqlUpdateOne(table, id, updates) {
  const [rows] = await getPool().query(`SELECT data FROM \`${table}\` WHERE id=?`, [id]);
  if (!rows.length) return null;
  const current = typeof rows[0].data === "string" ? JSON.parse(rows[0].data) : rows[0].data;
  const merged = { ...current, ...updates };
  await getPool().query(`UPDATE \`${table}\` SET data=? WHERE id=?`, [JSON.stringify(merged), id]);
  return merged;
}

async function sqlDeleteOne(table, id) {
  await getPool().query(`DELETE FROM \`${table}\` WHERE id=?`, [id]);
}

async function sqlGetKv(name) {
  const [rows] = await getPool().query(`SELECT data FROM kv_store WHERE name=?`, [name]);
  if (!rows.length) return {};
  return typeof rows[0].data === "string" ? JSON.parse(rows[0].data) : rows[0].data;
}

async function sqlSetKv(name, data) {
  await getPool().query(
    `INSERT INTO kv_store (name, data) VALUES (?,?) ON DUPLICATE KEY UPDATE data=VALUES(data)`,
    [name, JSON.stringify(data)]
  );
}

// ─── Views special handling ───────────────────────────────────────────────────
async function sqlGetViews() {
  const [rows] = await getPool().query(`SELECT property_id, view_count FROM property_views`);
  return Object.fromEntries(rows.map(r => [r.property_id, r.view_count]));
}
async function sqlSetViews(obj) {
  const pool = getPool();
  for (const [pid, count] of Object.entries(obj)) {
    await pool.query(
      `INSERT INTO property_views (property_id, view_count) VALUES (?,?) ON DUPLICATE KEY UPDATE view_count=VALUES(view_count)`,
      [pid, Number(count) || 0]
    );
  }
}
async function sqlIncrementView(propertyId) {
  await getPool().query(
    `INSERT INTO property_views (property_id, view_count) VALUES (?,1) ON DUPLICATE KEY UPDATE view_count=view_count+1`,
    [propertyId]
  );
  const [rows] = await getPool().query(`SELECT view_count FROM property_views WHERE property_id=?`, [propertyId]);
  return rows[0]?.view_count || 1;
}

// ─── Public adapter API ───────────────────────────────────────────────────────
const db = {
  /** True when running in MySQL mode AND the connection is live */
  get isMysql() { return useMysql(); },

  /** Get all records from an array collection */
  async getAll(collection) {
    const m = MAP[collection];
    if (!m) throw new Error(`Unknown collection: ${collection}`);
    if (!useMysql()) return readArr(m.file);
    if (m.type === "object" || m.type === "views") throw new Error(`Use getObj() for '${collection}'`);
    return sqlGetAll(m.table);
  },

  /** Get a key-value object store */
  async getObj(collection) {
    const m = MAP[collection];
    if (!m) throw new Error(`Unknown collection: ${collection}`);
    if (!useMysql()) {
      if (m.type === "array") return {};
      return readObj(m.file);
    }
    if (m.type === "views") return sqlGetViews();
    return sqlGetKv(collection);
  },

  /** Replace entire array collection */
  async replaceAll(collection, arr) {
    const m = MAP[collection];
    if (!m) throw new Error(`Unknown collection: ${collection}`);
    if (!useMysql()) { writeFile(m.file, arr); return; }
    await sqlReplaceAll(m.table, arr);
  },

  /** Save key-value object */
  async setObj(collection, data) {
    const m = MAP[collection];
    if (!m) throw new Error(`Unknown collection: ${collection}`);
    if (!useMysql()) { writeFile(m.file, data); return; }
    if (m.type === "views") { await sqlSetViews(data); return; }
    await sqlSetKv(collection, data);
  },

  /** Insert a single record into an array collection */
  async insert(collection, record) {
    const m = MAP[collection];
    if (!m) throw new Error(`Unknown collection: ${collection}`);
    if (!useMysql()) {
      const arr = readArr(m.file);
      arr.push(record);
      writeFile(m.file, arr);
      return record;
    }
    return sqlInsert(m.table, record);
  },

  /** Update a single record by id */
  async updateOne(collection, id, updates) {
    const m = MAP[collection];
    if (!m) throw new Error(`Unknown collection: ${collection}`);
    if (!useMysql()) {
      const arr = readArr(m.file);
      const item = arr.find(x => x.id === id);
      if (!item) return null;
      Object.assign(item, updates);
      writeFile(m.file, arr);
      return item;
    }
    return sqlUpdateOne(m.table, id, updates);
  },

  /** Delete a single record by id */
  async deleteOne(collection, id) {
    const m = MAP[collection];
    if (!m) throw new Error(`Unknown collection: ${collection}`);
    if (!useMysql()) {
      const arr = readArr(m.file).filter(x => x.id !== id);
      writeFile(m.file, arr);
      return;
    }
    await sqlDeleteOne(m.table, id);
  },

  /** Increment a property view count (optimized) */
  async incrementView(propertyId) {
    if (!useMysql()) {
      const views = readObj("views.json");
      views[propertyId] = (views[propertyId] || 0) + 1;
      writeFile("views.json", views);
      return views[propertyId];
    }
    return sqlIncrementView(propertyId);
  },

  /** Raw MySQL query — only works in MySQL mode */
  async query(sql, params = []) {
    if (!useMysql()) throw new Error("Raw query only available in MySQL mode");
    const [rows] = await getPool().query(sql, params);
    return rows;
  },
};

export default db;
