import pg from 'pg';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;

const PROJECT_REF = 'aifqsjkgvejcqrzwgvqg';
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;

if (!DB_PASSWORD) {
  console.error('SUPABASE_DB_PASSWORD is not set.');
  console.error('');
  console.error('Get it from: Supabase Dashboard → Settings → Database → Database Password → Reveal');
  console.error('Then run: SUPABASE_DB_PASSWORD="your_password" node scripts/migrate.mjs');
  process.exit(1);
}

// Supabase connection pooler (eu-west-2 confirmed reachable for this project)
const connectionConfigs = [
  {
    label: 'Session pooler eu-west-2 (IPv4)',
    host: '18.169.28.97',
    port: 5432,
    user: `postgres.${PROJECT_REF}`,
  },
  {
    label: 'Session pooler eu-west-2',
    host: `aws-0-eu-west-2.pooler.supabase.com`,
    port: 5432,
    user: `postgres.${PROJECT_REF}`,
  },
  {
    label: 'Transaction pooler eu-west-2',
    host: `aws-0-eu-west-2.pooler.supabase.com`,
    port: 6543,
    user: `postgres.${PROJECT_REF}`,
  },
  {
    label: 'Direct connection',
    host: `db.${PROJECT_REF}.supabase.co`,
    port: 5432,
    user: 'postgres',
  },
];

const SQL = `
-- Add status column to bookings table
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'New'
    CHECK (status IN ('New', 'Contacted', 'Booked', 'Closed', 'Cancelled'));

-- Add anon SELECT policy if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bookings'
    AND policyname = 'Allow anon to read bookings'
  ) THEN
    CREATE POLICY "Allow anon to read bookings" ON bookings
      FOR SELECT TO anon USING (true);
  END IF;
END $$;
`;

async function tryConnect(config) {
  const client = new Client({
    host: config.host,
    port: config.port,
    database: 'postgres',
    user: config.user,
    password: DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });

  await client.connect();
  return client;
}

async function run() {
  let client = null;

  for (const config of connectionConfigs) {
    try {
      console.log(`Trying ${config.label}...`);
      client = await tryConnect(config);
      console.log(`Connected via ${config.label}`);
      break;
    } catch (err) {
      console.log(`  Failed: ${err.message}`);
    }
  }

  if (!client) {
    console.error('\nCould not connect to Supabase via any pooler endpoint.');
    process.exit(1);
  }

  try {
    console.log('\nRunning migration...');
    await client.query(SQL);
    console.log('Migration completed successfully.');

    // Verify
    const result = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'bookings' AND column_name = 'status';
    `);
    if (result.rows.length > 0) {
      const col = result.rows[0];
      console.log(`  ✓ status column: ${col.data_type}, default: ${col.column_default}`);
    }

    const policyResult = await client.query(`
      SELECT policyname FROM pg_policies
      WHERE tablename = 'bookings' AND policyname = 'Allow anon to read bookings';
    `);
    if (policyResult.rows.length > 0) {
      console.log(`  ✓ anon SELECT policy in place`);
    }
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
