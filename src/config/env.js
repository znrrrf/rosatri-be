import dotenv from "dotenv";

dotenv.config({ quiet: true });

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function toBoolean(value) {
  return String(value).toLowerCase() === "true";
}

export const env = {
  appName: process.env.APP_NAME ?? "Rosatri Backend API",
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: toNumber(process.env.PORT, 5000),
  apiPrefix: process.env.API_PREFIX ?? "/api/v1",
  db: {
    host: process.env.DB_HOST ?? "localhost",
    port: toNumber(process.env.DB_PORT, 5432),
    database: process.env.DB_NAME ?? "rosatri",
    user: process.env.DB_USER ?? "postgres",
    password: process.env.DB_PASSWORD ?? "postgres",
    ssl: toBoolean(process.env.DB_SSL ?? false),
  },
};
