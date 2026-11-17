import { initializeDatabase, pool } from './db';

async function run() {
  try {
    console.log('[Migration] Starting database migration...');
    await initializeDatabase();
    console.log('[Migration] Migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('[Migration] Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
