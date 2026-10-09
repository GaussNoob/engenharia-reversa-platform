import { Hono } from "hono";
import app from "./dist/app.mjs";
if (!(app instanceof Hono))
  throw new TypeError("O build deve exportar a API Hono.");
export default app;
