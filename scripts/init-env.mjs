import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const secret = () => randomBytes(32).toString("base64url");
const admin = secret(),
  application = secret(),
  runner = secret();
const content = [
  `POSTGRES_PASSWORD=${admin}`,
  `MIGRATION_DATABASE_URL=postgresql://nucleo:${admin}@127.0.0.1:5549/nucleo`,
  `DATABASE_URL=postgresql://nucleo_app:${application}@127.0.0.1:5549/nucleo`,
  `RUNNER_DATABASE_URL=postgresql://nucleo_runner:${runner}@127.0.0.1:5549/nucleo`,
  `BETTER_AUTH_SECRET=${secret()}`,
  "PUBLIC_ORIGIN=http://localhost:3050",
  "API_INTERNAL_URL=http://127.0.0.1:3060",
  "API_PORT=3060",
  "BOOK_DISTRIBUTION_AUTHORIZED=false",
  "RUNNER_ENABLED=true",
  "RUNNER_DOCKER_RUNTIME=runsc",
  `RUNNER_ARTIFACT_DIR=${fileURLToPath(new URL("../.runtime/artifacts", import.meta.url))}`,
  "RUNNER_CONCURRENCY=2",
  "",
].join("\n");
try {
  await writeFile(new URL("../.env", import.meta.url), content, {
    flag: "wx",
    mode: 0o600,
  });
  console.log(
    ".env created with distinct database credentials and a random session secret.",
  );
} catch (error) {
  if (error?.code !== "EEXIST") throw error;
  console.log("The existing .env was preserved.");
}
