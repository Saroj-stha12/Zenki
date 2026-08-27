import 'server-only';

import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default('file:./zenki.sqlite'),
  JWT_SECRET: z
    .string()
    .min(32)
    .default('dev-secret-change-me-dev-secret-change-me'),
  ADMIN_EMAIL: z.string().trim().email().default('admin@zenki.com'),
  ADMIN_PASSWORD: z.string().min(8).max(128).default('$admin@0012'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL ?? process.env.DB_FILE_NAME ?? 'file:./zenki.sqlite',
  JWT_SECRET: process.env.JWT_SECRET ?? 'dev-secret-change-me-dev-secret-change-me-dev-secret-change-me',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? 'admin@zenki.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? '$admin@0012',
  NODE_ENV: process.env.NODE_ENV ?? 'development',
});
