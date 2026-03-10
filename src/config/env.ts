import dotenv from "dotenv";

dotenv.config({ path: ".env", quiet: true });
dotenv.config({ path: ".env.local", override: true, quiet: true });

type DatabaseEnv = {
  url?: string;
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
};

type AppEnv = {
  appName: string;
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  db: DatabaseEnv;
  auth: {
    tokenSecret: string;
    tokenExpiresInHours: number;
  };
};

function toNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function toBoolean(value: string | boolean | undefined): boolean {
  return String(value).toLowerCase() === "true";
}

export const env: AppEnv = {
  appName: process.env.APP_NAME ?? "Rosatri Backend API",
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: toNumber(process.env.PORT, 5000),
  apiPrefix: process.env.API_PREFIX ?? "/api/v1",
  db: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST ?? "localhost",
    port: toNumber(process.env.DB_PORT, 5432),
    database: process.env.DB_NAME ?? "rosatri",
    user: process.env.DB_USER ?? "postgres",
    password: process.env.DB_PASSWORD ?? "postgres",
    ssl: toBoolean(process.env.DB_SSL ?? false),
  },
  auth: {
    tokenSecret: process.env.AUTH_TOKEN_SECRET ?? "rosatri-dev-secret",
    tokenExpiresInHours: toNumber(process.env.AUTH_TOKEN_EXPIRES_IN_HOURS, 24),
  },
};
