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

type EmailEnv = {
  provider: "log" | "smtp";
  fromAddress: string;
  smtpHost?: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser?: string;
  smtpPass?: string;
  otpExpiresInMinutes: number;
};

type AppEnv = {
  appName: string;
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  db: DatabaseEnv;
  email: EmailEnv;
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

function toEmailProvider(value: string | undefined): EmailEnv["provider"] {
  return value === "smtp" ? "smtp" : "log";
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
  email: {
    provider: toEmailProvider(process.env.EMAIL_PROVIDER),
    fromAddress: process.env.EMAIL_FROM_ADDRESS ?? "no-reply@rosatri.local",
    smtpHost: process.env.SMTP_HOST,
    smtpPort: toNumber(process.env.SMTP_PORT, 587),
    smtpSecure: toBoolean(process.env.SMTP_SECURE ?? false),
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    otpExpiresInMinutes: toNumber(process.env.EMAIL_OTP_EXPIRES_IN_MINUTES, 10),
  },
  auth: {
    tokenSecret: process.env.AUTH_TOKEN_SECRET ?? "rosatri-dev-secret",
    tokenExpiresInHours: toNumber(process.env.AUTH_TOKEN_EXPIRES_IN_HOURS, 24),
  },
};
