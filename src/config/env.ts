import "dotenv/config";
import type { SignOptions } from "jsonwebtoken";

type ExpiresIn = NonNullable<SignOptions["expiresIn"]>;

export const env = {
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET || "dev",
  jwtExpires: (process.env.JWT_EXPIRES || "1h") as ExpiresIn,
  refreshDays: Number(process.env.REFRESH_EXPIRES_DAYS || 7),
  mongoUrl: process.env.MONGO_URL!,
  pgUrl: process.env.DATABASE_URL!,
  rateLimitAuthWindowMs: Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS ?? 15 * 60 * 1000),
  rateLimitAuthMax: Number(process.env.RATE_LIMIT_AUTH_MAX ?? 100),
  rateLimitGeneralWindowMs: Number(process.env.RATE_LIMIT_GENERAL_WINDOW_MS ?? 60 * 1000),
  rateLimitGeneralMax: Number(process.env.RATE_LIMIT_GENERAL_MAX ?? 300),
};