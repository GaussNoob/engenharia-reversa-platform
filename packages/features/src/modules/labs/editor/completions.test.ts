import { describe, expect, it } from "vitest";
import { callSignature, getCompletions } from "./completions";
import type { CompletionDialect } from "./completion-data";

function suggestions(dialect: CompletionDialect, source: string) {
  return getCompletions({ dialect, source, offset: source.length }).items;
}
describe("Autocomplete contextual compartilhado entre Monaco e editor móvel", () => {
  it("oferece funções Python, snippets e variáveis locais", () => {
    expect(
      suggestions("python", "pri").find((item) => item.label === "print")
        ?.insert,
    ).toBe("print(${1:value})");
    expect(
      suggestions("python", "valor = 42\nval").some(
        (item) => item.label === "valor",
      ),
    ).toBe(true);
    expect(
      suggestions("python", "fo").find(
        (item) => item.label === "for" && item.kind === "snippet",
      )?.insert,
    ).toContain("range");
  });
  it("resolve módulos importados, aliases e métodos de tipos Python", () => {
    expect(
      suggestions("python", "import struct as st\nst.unp").map(
        (item) => item.label,
      ),
    ).toContain("unpack");
    expect(
      suggestions("python", 'data = b"123"\ndata.he').map((item) => item.label),
    ).toContain("hex");
    expect(
      suggestions("python", "from struct import un").map((item) => item.label),
    ).toContain("unpack");
  });
  it("separa C, C++ e headers da Windows API", () => {
    expect(
      suggestions("c", "pri").some((item) => item.label === "printf"),
    ).toBe(true);
    expect(
      suggestions("c", "Mess").some((item) => item.label === "MessageBoxW"),
    ).toBe(false);
    expect(
      suggestions("cpp", "Mess").some((item) => item.label === "MessageBoxW"),
    ).toBe(true);
    expect(
      suggestions("cpp", "std::vec").find((item) => item.label === "vector")
        ?.insert,
    ).toContain("vector<");
    expect(
      suggestions("c", "#include <std").some(
        (item) => item.label === "stdint.h",
      ),
    ).toBe(true);
  });
  it("sugere rótulos e registradores de acordo com a arquitetura", () => {
    expect(
      suggestions("assembly", "destino:\n nop\n jmp des").some(
        (item) => item.label === "destino",
      ),
    ).toBe(true);
    expect(
      suggestions("assembly", "mov ra").some((item) => item.label === "rax"),
    ).toBe(true);
    expect(
      getCompletions({
        dialect: "assembly",
        source: "mov ",
        offset: 4,
        mode: "x86-32",
      }).items.some((item) => item.label === "rax"),
    ).toBe(false);
    expect(
      suggestions("fasm", "sec").some(
        (item) => item.label === "section" && item.kind === "snippet",
      ),
    ).toBe(true);
  });
  it("não oferece código dentro de comentários e strings", () => {
    expect(suggestions("python", "# pri")).toEqual([]);
    expect(suggestions("python", 'print("pri')).toEqual([]);
    expect(suggestions("c", "/* pri")).toEqual([]);
    expect(suggestions("assembly", "; mov ra")).toEqual([]);
    expect(
      suggestions("python", "# comentário\npri").some(
        (item) => item.label === "print",
      ),
    ).toBe(true);
  });
  it("encontra símbolos de outro arquivo e assinaturas de chamadas", () => {
    expect(
      getCompletions({
        dialect: "c",
        source: "som",
        offset: 3,
        files: [{ name: "helper.h", content: "int soma(int a, int b);" }],
      }).items.some((item) => item.label === "soma"),
    ).toBe(true);
    const source = 'import struct\nstruct.unpack("<I", ';
    const signature = callSignature({
      dialect: "python",
      source,
      offset: source.length,
    });
    expect(signature?.item.label).toBe("unpack");
    expect(signature?.parameter).toBe(1);
  });
});
