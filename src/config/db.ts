import { Pool, type QueryResult, type QueryResultRow } from "pg";
import { env } from "./env.js";

type DatabaseHealth = {
  ok: boolean;
  message: string;
};

let pool: Pool | undefined;

function createPool(): Pool {
  if (env.db.url) {
    return new Pool({
      connectionString: env.db.url,
      ssl: env.db.ssl ? { rejectUnauthorized: false } : false,
    });
  }

  return new Pool({
    host: env.db.host,
    port: env.db.port,
    database: env.db.database,
    user: env.db.user,
    password: env.db.password,
    ssl: env.db.ssl ? { rejectUnauthorized: false } : false,
  });
}

export function getPool(): Pool {
  if (!pool) {
    pool = createPool();
    pool.on("error", (error: Error) => {
      console.error("Unexpected PostgreSQL pool error:", error.message);
    });
  }

  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params);
}

export async function checkDatabaseConnection(): Promise<DatabaseHealth> {
  try {
    await query("SELECT 1");

    return {
      ok: true,
      message: "Database connection is healthy.",
    };
  } catch (error: unknown) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unknown database error.",
    };
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
