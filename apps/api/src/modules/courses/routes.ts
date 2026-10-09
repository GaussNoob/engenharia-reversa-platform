import { Hono } from "hono";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  catalog,
  publicCatalog,
  findLessonRoute,
  publicQuestion,
  quizzes,
  searchEntries,
} from "@nucleo/content/server";
import { config } from "../../config.ts";
import { supplements, type SearchEntry } from "@nucleo/core";
const additionalEntries: SearchEntry[] = supplements.map((item) => ({
  id: item.id,
  title: item.title,
  description: item.description,
  kind: "laboratório",
  href: `/explorar/${item.id}`,
  keywords: [item.concept, item.label],
}));
const assetDirectory = new URL(
  "../../../../../references/fundamentos-engenharia-reversa/.gitbook/assets/",
  import.meta.url,
);
const assets = new Set(
  [
    ...catalog.modules.flatMap((module) => module.lessons),
    ...catalog.references,
  ].flatMap((document) =>
    document.blocks
      .filter((block) => block.type === "image")
      .map((block) => block.asset),
  ),
);
export const courseRoutes = new Hono();
courseRoutes.get("/catalog", (context) => context.json(publicCatalog));
courseRoutes.get("/search", (context) => {
  const input = z
    .string()
    .max(100)
    .parse(context.req.query("q") ?? "");
  const normalize = (text: string) =>
    text
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  const tokens = normalize(input).split(/\s+/).filter(Boolean);
  const results = [...searchEntries, ...additionalEntries]
    .map((entry) => {
      const title = normalize(entry.title);
      const all = normalize(
        `${entry.title} ${entry.keywords.join(" ")} ${entry.description}`,
      );
      const score = tokens.every((token) => all.includes(token))
        ? tokens.reduce(
            (sum, token) =>
              sum +
              (title === token
                ? 120
                : title.startsWith(token)
                  ? 70
                  : title.includes(token)
                    ? 40
                    : 10),
            0,
          )
        : 0;
      return { ...entry, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 18);
  return context.json(results);
});
courseRoutes.use("/lessons/*", async (context, next) => {
  if (
    process.env.NODE_ENV === "production" &&
    config.BOOK_DISTRIBUTION_AUTHORIZED !== "true"
  )
    return context.json(
      {
        error: "A publicação integral do livro aguarda confirmação de licença.",
      },
      503,
    );
  await next();
});
courseRoutes.get("/lessons/:module/:slug", (context) => {
  const lesson = findLessonRoute(
    context.req.param("module"),
    context.req.param("slug"),
  );
  if (!lesson) return context.json({ error: "Aula não encontrada." }, 404);
  return context.json({
    lesson,
    questions: quizzes
      .filter((question) => question.lessonIds.includes(lesson.id))
      .map(publicQuestion),
  });
});
courseRoutes.get("/references/:slug", (context) => {
  const reference = catalog.references.find(
    (item) => item.slug === context.req.param("slug"),
  );
  if (!reference)
    return context.json({ error: "Referência não encontrada." }, 404);
  if (
    process.env.NODE_ENV === "production" &&
    config.BOOK_DISTRIBUTION_AUTHORIZED !== "true"
  )
    return context.json(
      { error: "Conteúdo disponível no ambiente local de estudo." },
      503,
    );
  return context.json(reference);
});
courseRoutes.get("/assets/:name", async (context) => {
  if (
    process.env.NODE_ENV === "production" &&
    config.BOOK_DISTRIBUTION_AUTHORIZED !== "true"
  )
    return context.json(
      { error: "Conteúdo disponível no ambiente local de estudo." },
      503,
    );
  const name = context.req.param("name");
  if (!assets.has(name))
    return context.json({ error: "Imagem não encontrada." }, 404);
  const location = fileURLToPath(
    new URL(encodeURIComponent(name), assetDirectory),
  );
  const bytes = await readFile(location);
  return new Response(bytes, {
    headers: {
      "Content-Type": "image/png",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=86400",
    },
  });
});
