import { defineConfig } from 'drizzle-kit';

// Run through Infisical so DATABASE_URL is set: `npm run db:push` (dev branch) or `npm run db:push:prod`.
export default defineConfig({
  schema: './src/server/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
