/**
 * PostgreSQL helpers — mirrors the MySQL helpers in adapter.js.
 * Uses parameterised queries ($1, $2 …) throughout.
 */

import { getPgPool } from "../config/pg.js";

export async function pgGetAll(table) {
  const { rows } = await getPgPool().query(
    `SELECT data FROM "${table}" ORDER BY created_at ASC`
  );
  return rows.map(r => r.data);
}

export async function pgReplaceAll(table, arr) {
  const pool = getPgPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM "${table}"`);
    for (const item of arr) {
      const id = item.id || item.slug || String(Date.now());
      await client.query(
        `INSERT INTO "${table}" (id, data)
         VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
        [id, item]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function pgInsert(table, item) {
  const id = item.id || item.slug || String(Date.now());
  await getPgPool().query(
    `INSERT INTO "${table}" (id, data) VALUES ($1, $2)`,
    [id, item]
  );
  return item;
}

export async function pgUpdateOne(table, id, updates) {
  const pool = getPgPool();
  const { rows } = await pool.query(
    `SELECT data FROM "${table}" WHERE id = $1`,
    [id]
  );
  if (!rows.length) return null;
  const merged = { ...rows[0].data, ...updates };
  await pool.query(
    `UPDATE "${table}" SET data = $1 WHERE id = $2`,
    [merged, id]
  );
  return merged;
}

export async function pgDeleteOne(table, id) {
  await getPgPool().query(`DELETE FROM "${table}" WHERE id = $1`, [id]);
}

export async function pgGetKv(name) {
  const { rows } = await getPgPool().query(
    `SELECT data FROM kv_store WHERE name = $1`,
    [name]
  );
  return rows.length ? rows[0].data : {};
}

export async function pgSetKv(name, data) {
  await getPgPool().query(
    `INSERT INTO kv_store (name, data) VALUES ($1, $2)
     ON CONFLICT (name) DO UPDATE SET data = EXCLUDED.data`,
    [name, data]
  );
}

export async function pgGetViews() {
  const { rows } = await getPgPool().query(
    `SELECT property_id, view_count FROM property_views`
  );
  return Object.fromEntries(rows.map(r => [r.property_id, r.view_count]));
}

export async function pgSetViews(obj) {
  const pool = getPgPool();
  for (const [pid, count] of Object.entries(obj)) {
    await pool.query(
      `INSERT INTO property_views (property_id, view_count) VALUES ($1, $2)
       ON CONFLICT (property_id) DO UPDATE SET view_count = EXCLUDED.view_count`,
      [pid, Number(count) || 0]
    );
  }
}

export async function pgIncrementView(propertyId) {
  const { rows } = await getPgPool().query(
    `INSERT INTO property_views (property_id, view_count) VALUES ($1, 1)
     ON CONFLICT (property_id)
     DO UPDATE SET view_count = property_views.view_count + 1
     RETURNING view_count`,
    [propertyId]
  );
  return rows[0]?.view_count ?? 1;
}
