import { getPgPool } from "../config/pg.js";

const ARRAY_TABLES = [
  "users",
  "subscribers",
  "reel_requests",
  "user_listings",
  "dev_projects",
  "inquiries",
  "articles",
  "faqs",
  "public_projects",
  "pages",
  "html_snippets",
  "media",
  "activity_log",
  "email_queue",
  "sections",
  "viewings",
];

export async function ensurePgSchema() {
  const pool = getPgPool();

  for (const table of ARRAY_TABLES) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "${table}" (
        id         TEXT        PRIMARY KEY,
        data       JSONB       NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS kv_store (
      name TEXT PRIMARY KEY,
      data JSONB NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS property_views (
      property_id TEXT    PRIMARY KEY,
      view_count  INTEGER DEFAULT 0
    )
  `);

  console.log("[pg] Schema ready — all tables exist.");
}
