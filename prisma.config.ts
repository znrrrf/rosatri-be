import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

function getDatasourceUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT ?? "5432";
  const database = process.env.DB_NAME;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD ?? "";
  const sslEnabled = (process.env.DB_SSL ?? "false").toLowerCase() === "true";

  if (!host || !database || !user) {
    throw new Error(
      "Prisma needs DATABASE_URL or DB_HOST, DB_NAME, and DB_USER to build the datasource URL.",
    );
  }

  const credentials =
    password === ""
      ? encodeURIComponent(user)
      : `${encodeURIComponent(user)}:${encodeURIComponent(password)}`;

  const params = new URLSearchParams({ schema: "public" });

  if (sslEnabled) {
    params.set("sslmode", "require");
  }

  return `postgresql://${credentials}@${host}:${port}/${database}?${params.toString()}`;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: getDatasourceUrl(),
  },
});