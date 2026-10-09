import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { Catalog } from "@nucleo/core";
import { codeTokens } from "./syntax";
it("destaca C, Python e Assembly preservando cada caractere dos 141 trechos originais", () => {
  const catalog = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../content/.generated/catalog.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as Catalog;
  const blocks = [
    ...catalog.modules.flatMap((module) => module.lessons),
    ...catalog.references,
  ]
    .flatMap((document) => document.blocks)
    .filter((block) => block.type === "code");
  expect(blocks).toHaveLength(141);
  for (const block of blocks)
    expect(
      codeTokens(block.raw, block.language)
        .map((token) => token.text)
        .join(""),
      block.id,
    ).toBe(block.raw);
  for (const [language, source] of [
    [
      "c",
      '#include <windows.h>\nint main(void) { MessageBoxW(0, L"Mundo", L"Olá", 0); return 0; }',
    ],
    ["python", 'import struct\nprint("núcleo", 42) # comentário'],
    ["assembly", "mov rax, 0x2a\n; comentário"],
  ]) {
    const tokens = codeTokens(source!, language!);
    expect(
      tokens.some((token) => token.className?.includes("tok-keyword")),
      language,
    ).toBe(true);
    expect(
      tokens.some((token) => token.className?.includes("tok-number")),
      language,
    ).toBe(true);
  }
});
