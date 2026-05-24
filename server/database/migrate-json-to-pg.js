/**
 * One-time migration: JSON files → PostgreSQL
 * Run once: node server/database/migrate-json-to-pg.js
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = join(__dirname, "..", "data");
const DB_URL    = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

if (!DB_URL) { console.error("No DATABASE_URL set."); process.exit(1); }

function readJson(file) {
  const p = join(DATA_DIR, file);
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; }
}

const pool = new pg.Pool({ connectionString: DB_URL, ssl: false, max: 3 });

async function migrateArray(table, file) {
  const arr = readJson(file);
  if (!Array.isArray(arr) || arr.length === 0) { console.log(`  skip ${file} (empty)`); return; }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    let n = 0;
    for (const item of arr) {
      const id = item.id || item.slug || String(Date.now() + n);
      await client.query(
        `INSERT INTO "${table}" (id, data) VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
        [id, item]
      );
      n++;
    }
    await client.query("COMMIT");
    console.log(`  ✓ ${file} → ${table} (${n} rows)`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(`  ✗ ${file} → ${table}: ${err.message}`);
  } finally {
    client.release();
  }
}

async function migrateKv(name, file) {
  const obj = readJson(file);
  if (!obj || typeof obj !== "object" || Object.keys(obj).length === 0) {
    console.log(`  skip ${file} (empty)`);
    return;
  }
  try {
    await pool.query(
      `INSERT INTO kv_store (name, data) VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET data = EXCLUDED.data`,
      [name, obj]
    );
    console.log(`  ✓ ${file} → kv_store[${name}]`);
  } catch (err) {
    console.error(`  ✗ ${file} → kv_store[${name}]: ${err.message}`);
  }
}

async function migrateViews(file) {
  const obj = readJson(file);
  if (!obj || typeof obj !== "object" || Object.keys(obj).length === 0) {
    console.log(`  skip ${file} (empty)`);
    return;
  }
  try {
    for (const [pid, count] of Object.entries(obj)) {
      await pool.query(
        `INSERT INTO property_views (property_id, view_count) VALUES ($1, $2)
         ON CONFLICT (property_id) DO UPDATE SET view_count = EXCLUDED.view_count`,
        [pid, Number(count) || 0]
      );
    }
    console.log(`  ✓ ${file} → property_views (${Object.keys(obj).length} rows)`);
  } catch (err) {
    console.error(`  ✗ ${file} → property_views: ${err.message}`);
  }
}

async function main() {
  console.log("Migrating JSON → PostgreSQL…\n");

  await migrateArray("users",           "users.json");
  await migrateArray("subscribers",     "subscribers.json");
  await migrateArray("reel_requests",   "reel-requests.json");
  await migrateArray("user_listings",   "user-listings.json");
  await migrateArray("dev_projects",    "projects.json");
  await migrateArray("inquiries",       "inquiries.json");
  await migrateArray("articles",        "articles.json");
  await migrateArray("faqs",            "faqs.json");
  await migrateArray("public_projects", "public-projects.json");
  await migrateArray("pages",           "pages.json");
  await migrateArray("html_snippets",   "html-snippets.json");
  await migrateArray("media",           "media.json");
  await migrateArray("activity_log",    "activity-log.json");
  await migrateArray("email_queue",     "email-queue.json");
  await migrateArray("sections",        "sections.json");

  await migrateKv("seo",                  "seo.json");
  await migrateKv("site-settings",        "site-settings.json");
  await migrateKv("saved",                "saved.json");
  await migrateKv("saved-searches",       "saved-searches.json");
  await migrateKv("server-notifications", "server-notifications.json");
  await migrateKv("alert-settings",       "alert-settings.json");
  await migrateKv("alert-stats",          "alert-stats.json");
  await migrateKv("sent-alerts",          "sent-alerts.json");
  await migrateKv("text-content",         "text-content.json");
  await migrateKv("section-seo",          "section-seo.json");

  await migrateViews("views.json");

  console.log("\nDone.");
  await pool.end();
}

main().catch(err => { console.error("Fatal:", err.message); process.exit(1); });
