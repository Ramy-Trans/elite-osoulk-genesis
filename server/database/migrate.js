/**
 * One-time migration script: JSON files → MySQL
 *
 * Run AFTER creating the database schema:
 *   mysql -u user -p osoulk_db < server/database/schema.sql
 *   node server/database/migrate.js
 *
 * Requires environment variables: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
 */

import "dotenv/config";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createPool } from "mysql2/promise";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = join(__dirname, "..", "data");

if (!process.env.DB_HOST) {
  console.error("❌  DB_HOST is not set. Create a .env file first.");
  process.exit(1);
}

const pool = createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port:     parseInt(process.env.DB_PORT || "3306", 10),
  multipleStatements: true,
});

function readJson(file) {
  const p = join(DATA_DIR, file);
  if (!existsSync(p)) return [];
  try { return JSON.parse(readFileSync(p, "utf8")); } catch { return []; }
}
function readJsonObj(file) {
  const p = join(DATA_DIR, file);
  if (!existsSync(p)) return {};
  try { return JSON.parse(readFileSync(p, "utf8")); } catch { return {}; }
}

async function migrateArray(table, records, idFn = r => r.id) {
  if (!records.length) { console.log(`  ⚪ ${table}: empty`); return; }
  let ok = 0;
  for (const r of records) {
    const id = idFn(r) || String(Date.now() + Math.random());
    try {
      await pool.query(
        `INSERT INTO \`${table}\` (id, data) VALUES (?,?) ON DUPLICATE KEY UPDATE data=VALUES(data)`,
        [id, JSON.stringify(r)]
      );
      ok++;
    } catch (err) {
      console.warn(`  ⚠️  ${table} row ${id}: ${err.message}`);
    }
  }
  console.log(`  ✅ ${table}: ${ok}/${records.length} rows`);
}

async function migrateKv(name, data) {
  await pool.query(
    `INSERT INTO kv_store (name, data) VALUES (?,?) ON DUPLICATE KEY UPDATE data=VALUES(data)`,
    [name, JSON.stringify(data)]
  );
  console.log(`  ✅ kv_store[${name}]`);
}

async function migrateViews(views) {
  for (const [pid, count] of Object.entries(views)) {
    await pool.query(
      `INSERT INTO property_views (property_id, view_count) VALUES (?,?) ON DUPLICATE KEY UPDATE view_count=VALUES(view_count)`,
      [pid, Number(count) || 0]
    );
  }
  console.log(`  ✅ property_views: ${Object.keys(views).length} entries`);
}

async function run() {
  console.log("\n🚀  Starting JSON → MySQL migration…\n");

  // ─── Array collections ────────────────────────────────────────────────────
  await migrateArray("users",           readJson("users.json"));
  await migrateArray("subscribers",     readJson("subscribers.json"));
  await migrateArray("reel_requests",   readJson("reel-requests.json"));
  await migrateArray("user_listings",   readJson("user-listings.json"));
  await migrateArray("dev_projects",    readJson("projects.json"));
  await migrateArray("inquiries",       readJson("inquiries.json"));
  await migrateArray("articles",        readJson("articles.json"));
  await migrateArray("faqs",            readJson("faqs.json"));
  await migrateArray("public_projects", readJson("public-projects.json"));
  await migrateArray("pages",           readJson("pages.json"));
  await migrateArray("html_snippets",   readJson("html-snippets.json"));
  await migrateArray("media",           readJson("media.json"));
  await migrateArray("activity_log",    readJson("activity-log.json"));
  await migrateArray("email_queue",     readJson("email-queue.json"));
  await migrateArray("sections",        readJson("sections.json"), r => r.id || r.slug);

  // ─── Key-value stores ─────────────────────────────────────────────────────
  await migrateKv("seo",                  readJsonObj("seo.json"));
  await migrateKv("site-settings",        readJsonObj("site-settings.json"));
  await migrateKv("saved",                readJsonObj("saved.json"));
  await migrateKv("saved-searches",       readJsonObj("saved-searches.json"));
  await migrateKv("server-notifications", readJsonObj("server-notifications.json"));
  await migrateKv("alert-settings",       readJsonObj("alert-settings.json"));
  await migrateKv("alert-stats",          readJsonObj("alert-stats.json"));
  await migrateKv("sent-alerts",          readJsonObj("sent-alerts.json"));
  await migrateKv("text-content",         readJsonObj("text-content.json"));
  await migrateKv("section-seo",          readJsonObj("section-seo.json"));

  // ─── Property views ───────────────────────────────────────────────────────
  await migrateViews(readJsonObj("views.json"));

  console.log("\n✅  Migration complete! You can now start the server.\n");
  await pool.end();
}

run().catch(err => {
  console.error("❌  Migration failed:", err.message);
  process.exit(1);
});
