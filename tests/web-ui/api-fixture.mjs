// UI test fixture only. Real cookie/Bearer authorization is tested separately against PostgreSQL.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
const source = JSON.parse(
  await readFile("content/.generated/catalog.json", "utf8"),
);
const catalog = {
  ...source,
  modules: source.modules.map((module) => ({
    ...module,
    lessons: module.lessons.map(({ blocks, ...lesson }) => lesson),
  })),
  references: source.references.map(({ blocks, ...reference }) => reference),
};
const user = {
  id: "web-ui-test",
  name: "Pessoa de teste",
  email: "ui@example.test",
};
const progress = {
  lessons: [],
  completedLessons: 0,
  totalLessons: 63,
  percentage: 0,
  activeSeconds: 0,
  passedExercises: 0,
  completedLabs: 0,
  passedQuizzes: 0,
  streak: 0,
  lastLessonId: null,
  activities: [],
};
let catalogAvailable = true;
const server = createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");
  const path = req.url.split("?")[0];
  if (req.method === "POST" && path === "/__test/catalog-unavailable") {
    catalogAvailable = false;
    return res.end("{}");
  }
  if (req.method === "POST" && path === "/__test/catalog-available") {
    catalogAvailable = true;
    return res.end("{}");
  }
  if (path === "/api/catalog") {
    if (!catalogAvailable) {
      res.statusCode = 503;
      return res.end('{"error":"Catalog unavailable"}');
    }
    return res.end(JSON.stringify(catalog));
  }
  if (path === "/api/me") {
    if (req.headers.cookie?.includes("nucleo_ui_test=1"))
      return res.end(JSON.stringify(user));
    res.statusCode = 401;
    return res.end('{"error":"Unauthenticated"}');
  }
  if (path === "/api/progress") {
    if (!req.headers.cookie?.includes("nucleo_ui_test=1")) {
      res.statusCode = 401;
      return res.end('{"error":"Unauthenticated"}');
    }
    return res.end(JSON.stringify(progress));
  }
  if (path === "/api/exercises") return res.end("[]");
  res.statusCode = 404;
  res.end("{}");
});
server.listen(3172, "127.0.0.1");
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => server.close(() => process.exit(0)));
