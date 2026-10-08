// Prisma 7 configuration (replaces `url = env("DATABASE_URL")` in schema.prisma).
// Loads apps/api/.env when present; falls back to the docker-compose defaults.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const DEFAULT_DATABASE_URL = 'postgresql://concr:concr@127.0.0.1:5432/concr?schema=public';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // seed: 'tsx prisma/seed.ts'  -> Phase 1
  },
  datasource: {
    url: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
  },
});
