import { createPool } from "mysql2/promise";

let pool = null;

export function getPool() {
  if (!pool) {
    pool = createPool({
      host:     process.env.DB_HOST,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port:     parseInt(process.env.DB_PORT || "3306", 10),
      waitForConnections: true,
      connectionLimit:    10,
      queueLimit:         0,
      timezone:           "Z",
      charset:            "utf8mb4",
    });
  }
  return pool;
}

export async function testConnection() {
  try {
    const conn = await getPool().getConnection();
    await conn.ping();
    conn.release();
    console.log("[db] MySQL connection OK");
    return true;
  } catch (err) {
    console.error("[db] MySQL connection failed:", err.message);
    return false;
  }
}
