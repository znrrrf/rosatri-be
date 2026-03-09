import { Pool } from 'pg';
import { env } from './env.js';

let pool;

function createPool() {
  return new Pool({
    host: env.db.host,
    port: env.db.port,
    database: env.db.database,
    user: env.db.user,
    password: env.db.password,
    ssl: env.db.ssl ? { rejectUnauthorized: false } : false,
  });
}

export function getPool() {
  if (!pool) {
    pool = createPool();
    pool.on('error', (error) => {
      console.error('Unexpected PostgreSQL pool error:', error.message);
    });
  }

  return pool;
}

export async function query(text, params = []) {
  return getPool().query(text, params);
}

export async function checkDatabaseConnection() {
  try {
    await query('SELECT 1');

    return {
      ok: true,
      message: 'Database connection is healthy.',
    };
  } catch (error) {
    return {
      ok: false,
      message: error.message,
    };
  }
}

export async function closeDatabaseConnection() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
