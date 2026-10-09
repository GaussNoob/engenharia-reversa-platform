import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.ts";
import { config } from "../config.ts";
import { databasePoolConfig } from "./pool-config.ts";
export const pool = new pg.Pool(
  databasePoolConfig(config.DATABASE_URL, config.DATABASE_POOL_MAX),
);
export const db = drizzle(pool, { schema });
export type Database = typeof db;
