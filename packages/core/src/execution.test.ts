import { it, expect } from "vitest";
import { executionInputSchema, draftSchema } from "./execution.ts";
const base = {
  language: "python",
  files: [{ name: "main.py", content: "print(10)" }],
  entryFile: "main.py",
  submissionId: "6fa4657d-b71b-4824-9ca3-669eb118219e",
};
it("bloqueia traversal, linguagens desconhecidas e nomes duplicados", () => {
  expect(executionInputSchema.safeParse(base).success).toBe(true);
  for (const input of [
    { ...base, language: "sh" },
    { ...base, files: [{ name: "../secret.py", content: "" }] },
    { ...base, files: [base.files[0], base.files[0]] },
    { ...base, entryFile: "hidden.py" },
  ])
    expect(executionInputSchema.safeParse(input).success).toBe(false);
});
it("valida versão otimista e limite total de bytes do rascunho", () => {
  const draft = {
    files: base.files,
    language: "python",
    activeFile: "main.py",
    expectedVersion: 1,
  };
  expect(draftSchema.safeParse(draft).success).toBe(true);
  expect(draftSchema.safeParse({ ...draft, expectedVersion: -1 }).success).toBe(
    false,
  );
  expect(
    draftSchema.safeParse({
      ...draft,
      files: Array.from({ length: 8 }, (_, i) => ({
        name: `f${i}.py`,
        content: "ã".repeat(65000),
      })),
      activeFile: "f0.py",
    }).success,
  ).toBe(false);
});
