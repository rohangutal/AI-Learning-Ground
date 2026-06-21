import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

// Load environment variables from .env.local
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
