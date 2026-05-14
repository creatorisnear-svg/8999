import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Running migrations...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id          SERIAL PRIMARY KEY,
        name        TEXT NOT NULL,
        description TEXT NOT NULL,
        category    TEXT NOT NULL,
        estimated_cost           NUMERIC(10,2),
        estimated_selling_price  NUMERIC(10,2),
        profit_margin            NUMERIC(5,2),
        trend_score              INTEGER,
        status      TEXT NOT NULL DEFAULT 'researching',
        notes       TEXT,
        image_url   TEXT,
        created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id                SERIAL PRIMARY KEY,
        name              TEXT NOT NULL,
        platform          TEXT NOT NULL,
        url               TEXT,
        product_category  TEXT NOT NULL,
        rating            NUMERIC(3,1),
        min_order_quantity INTEGER,
        shipping_time     TEXT,
        notes             TEXT,
        created_at        TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id               SERIAL PRIMARY KEY,
        product_id       INTEGER,
        title            TEXT NOT NULL,
        content_type     TEXT NOT NULL,
        content          TEXT NOT NULL,
        hashtags         TEXT,
        target_audience  TEXT,
        status           TEXT NOT NULL DEFAULT 'draft',
        created_at       TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id         SERIAL PRIMARY KEY,
        title      TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id              SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        role            TEXT NOT NULL,
        content         TEXT NOT NULL,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS shop_settings (
        id           SERIAL PRIMARY KEY,
        shop_name    TEXT,
        shop_url     TEXT,
        seller_id    TEXT,
        region       TEXT,
        access_token TEXT,
        is_connected BOOLEAN NOT NULL DEFAULT false,
        updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log("Migrations complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
