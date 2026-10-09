import {
  completionCatalog,
  cppHeaders,
  cppStandard,
  cHeaders,
  pythonMembers,
  pythonModules,
  registers,
  type CodeSuggestion,
  type CompletionDialect,
} from "./completion-data";

type Document = { name: string; content: string };
export type CompletionRequest = {
  dialect: CompletionDialect;
  source: string;
  offset: number;
  files?: readonly Document[];
  mode?: "x86-32" | "x86-64";
};
export type CompletionResult = { from: number; items: CodeSuggestion[] };

/** Mask comments and strings without changing positions. No code is evaluated. */
function maskSource(
  source: string,
  dialect: CompletionDialect,
): { text: string; inLiteral: boolean } {
  const python = dialect === "python",
    assembly = dialect === "assembly" || dialect === "fasm";
  let quote = "",
    block = false,
    lineComment = false,
    text = "";
  for (let index = 0; index < source.length; index++) {
    const char = source[index]!,
      next = source[index + 1];
    if (lineComment) {
      if (char === "\n") lineComment = false;
      text += char === "\n" ? "\n" : " ";
      continue;
    }
    if (block) {
      if (char === "*" && next === "/") {
        block = false;
        text += "  ";
        index++;
      } else text += char === "\n" ? "\n" : " ";
      continue;
    }
    if (quote) {
      if (char === "\\") {
        text += "  ";
        index++;
        continue;
      }
      if (source.slice(index, index + quote.length) === quote) {
        text += " ".repeat(quote.length);
        index += quote.length - 1;
        quote = "";
      } else text += char === "\n" ? "\n" : " ";
      continue;
    }
    if (
      (char === "#" && python) ||
      (char === ";" && assembly) ||
      (!python && !assembly && char === "/" && next === "/")
    ) {
      lineComment = true;
      text += " ";
      continue;
    }
    if (!python && !assembly && char === "/" && next === "*") {
      block = true;
      text += "  ";
      index++;
      continue;
    }
    if (char === '"' || char === "'") {
      quote =
        python && source.slice(index, index + 3) === char.repeat(3)
          ? char.repeat(3)
          : char;
      text += " ".repeat(quote.length);
      index += quote.length - 1;
      continue;
    }
    text += char;
  }
  return { text, inLiteral: Boolean(quote || block || lineComment) };
}

export function documentSymbols(
  source: string,
  dialect: CompletionDialect,
): CodeSuggestion[] {
  const text = maskSource(source.slice(0, 65536), dialect).text;
  const result: CodeSuggestion[] = [];
  const add = (
    label: string,
    kind: CodeSuggestion["kind"],
    detail: string,
    parameters?: string[],
  ) => {
    if (!result.some((item) => item.label === label) && result.length < 300)
      result.push({
        label,
        kind,
        detail,
        description: "Símbolo declarado nos arquivos desta bancada.",
        parameters,
      });
  };
  if (dialect === "python") {
    for (const match of text.matchAll(
      /\bdef\s+([A-Za-z_]\w*)\s*\(([^)]*)\)/g,
    )) {
      const parameters = match[2]!
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
      add(
        match[1]!,
        "function",
        `${match[1]}(${parameters.join(", ")})`,
        parameters,
      );
      parameters.forEach((parameter) => {
        const name = parameter.split(/[:=]/)[0]?.trim();
        if (name && /^\w+$/.test(name)) add(name, "variable", "Parâmetro");
      });
    }
    for (const match of text.matchAll(/\bclass\s+([A-Za-z_]\w*)/g))
      add(match[1]!, "type", "Classe local");
    for (const match of text.matchAll(
      /(?:^|\n)\s*([A-Za-z_]\w*)\s*(?::[^=\n]+)?=(?!=)/g,
    ))
      add(match[1]!, "variable", "Variável local");
    for (const match of text.matchAll(/\bfor\s+([A-Za-z_]\w*)\s+in\b/g))
      add(match[1]!, "variable", "Variável de iteração");
  } else if (dialect === "assembly" || dialect === "fasm") {
    for (const match of text.matchAll(
      /^\s*([A-Za-z_.$][\w.$]*)\s*(?::|\s+(?:db|dw|dd|dq|rb|rw|rd|rq|equ)\b)/gim,
    ))
      add(match[1]!, "variable", "Rótulo / endereço local");
  } else {
    for (const match of text.matchAll(
      /\b(?:struct|class|enum)\s+([A-Za-z_]\w*)/g,
    ))
      add(match[1]!, "type", "Tipo local");
    for (const match of text.matchAll(
      /\b(?:const\s+)?(?:unsigned\s+|signed\s+)?(?:int|char|short|long|float|double|bool|void|auto|size_t|u?int\d+_t|DWORD|HANDLE|std::\w+(?:<[^;{}]+>)?)\s*[*&]*\s+([A-Za-z_]\w*)\s*(\([^;{}]*\))?/g,
    )) {
      const parameters = match[2]
        ?.slice(1, -1)
        .split(",")
        .map((part) => part.trim())
        .filter((part) => part && part !== "void");
      add(
        match[1]!,
        match[2] ? "function" : "variable",
        match[2] ? `${match[1]}(${parameters?.join(", ")})` : "Variável local",
        parameters,
      );
    }
  }
  return result;
}

function pythonOwner(owner: string, source: string): string {
  const alias = [...source.matchAll(/\bimport\s+(\w+)\s+as\s+(\w+)/g)].find(
    (match) => match[2] === owner,
  );
  if (alias) return alias[1]!;
  if (pythonModules[owner] || pythonMembers[owner]) return owner;
  const assigned = [
    ...source.matchAll(/(?:^|\n)\s*([A-Za-z_]\w*)\s*=\s*([^\n]+)/g),
  ]
    .find((match) => match[1] === owner)?.[2]
    ?.trim();
  if (!assigned) return owner;
  if (/^b['"]|^bytes\(|^bytearray\(/.test(assigned)) return "bytes";
  if (/^[fFrR]?['"]|^str\(/.test(assigned)) return "str";
  if (/^\[|^list\(/.test(assigned)) return "list";
  if (/^\{|^dict\(/.test(assigned)) return "dict";
  if (/^-?\d|^int\(/.test(assigned)) return "int";
  return owner;
}
function structMembers(owner: string, source: string): CodeSuggestion[] {
  const variables = [
    ...source.matchAll(/\b(?:struct\s+)?(\w+)\s*[*&]?\s+(\w+)\s*[;=]/g),
  ];
  const type = variables.find((match) => match[2] === owner)?.[1];
  const declaration = [
    ...source.matchAll(/\b(?:struct|class)\s+(\w+)\s*\{([^}]+)\}/g),
  ].find((match) => match[1] === type)?.[2];
  return declaration
    ? documentSymbols(declaration, "cpp").map((item) => ({
        ...item,
        kind: "property",
      }))
    : [];
}

export function getCompletions({
  dialect,
  source,
  offset,
  files = [],
  mode = "x86-64",
}: CompletionRequest): CompletionResult {
  const before = source.slice(0, offset);
  const line = before.slice(before.lastIndexOf("\n") + 1);
  const word = line.match(/[\w$]*$/)?.[0] ?? "";
  let from = offset - word.length;
  const includes = line.match(/^\s*#\s*include\s*[<"]([^>"]*)$/);
  if ((dialect === "c" || dialect === "cpp") && includes) {
    from = offset - includes[1]!.length;
    return {
      from,
      items: (dialect === "cpp" ? cppHeaders : cHeaders).map((label) => ({
        label,
        kind: "module",
        detail: "Header",
        description: `Incluir ${label}.`,
        insert: label,
      })),
    };
  }
  const context = maskSource(before, dialect);
  if (context.inLiteral) return { from, items: [] };
  const documents = [
    source,
    ...files
      .filter((file) => file.content !== source)
      .map((file) => file.content),
  ].join("\n");
  const member = line.match(/([A-Za-z_]\w*)(\.|::|->)\w*$/);
  if (member) {
    const owner = member[1]!;
    if (dialect === "python") {
      const resolved = pythonOwner(owner, source);
      return {
        from,
        items: pythonModules[resolved] ?? pythonMembers[resolved] ?? [],
      };
    }
    if (dialect === "cpp" && owner === "std")
      return { from, items: cppStandard };
    return { from, items: structMembers(owner, documents) };
  }
  const imported =
    dialect === "python"
      ? line.match(/^\s*from\s+(\w+)\s+import\s+\w*$/)
      : null;
  if (imported) return { from, items: pythonModules[imported[1]!] ?? [] };
  const locals = documentSymbols(documents, dialect);
  if (dialect === "assembly" || dialect === "fasm") {
    const body = line.replace(/^\s*[\w.$]+:\s*/, "").trimStart();
    const operands = /^\w+\s/.test(body);
    const items = operands
      ? [
          ...registers
            .filter(
              (label) =>
                mode !== "x86-32" || !/^r|^(spl|bpl|sil|dil)$/.test(label),
            )
            .map((label) => ({
              label,
              kind: "variable" as const,
              detail: `Registrador ${mode}`,
              description: "Operando da instrução.",
            })),
          ...["byte", "word", "dword", "qword"].map((label) => ({
            label,
            kind: "type" as const,
            detail: "Largura do operando",
            description: "Define o tamanho de um acesso à memória.",
          })),
          ...locals,
          ...(dialect === "fasm" ? completionCatalog.fasm : []),
        ]
      : completionCatalog[dialect];
    return { from, items };
  }
  const items = [...locals, ...completionCatalog[dialect]];
  return {
    from,
    items: items.filter(
      (item, index) =>
        items.findIndex(
          (other) => other.label === item.label && other.kind === item.kind,
        ) === index,
    ),
  };
}

export function callSignature(
  request: CompletionRequest,
): { item: CodeSuggestion; parameter: number } | undefined {
  const before = request.source.slice(0, request.offset);
  const masked = maskSource(before, request.dialect).text;
  const call = masked.match(/([A-Za-z_]\w*(?:(?:\.|::)\w+)?)\s*\(([^()]*)$/);
  if (!call) return;
  const qualified = call[1]!,
    name = qualified.split(/\.|::/).at(-1)!;
  const offset = before.lastIndexOf(qualified) + qualified.length;
  const item = getCompletions({ ...request, offset }).items.find(
    (item) => item.label === name && item.parameters,
  );
  return item
    ? {
        item,
        parameter: Math.min(
          call[2]!.split(",").length - 1,
          Math.max(0, (item.parameters?.length ?? 1) - 1),
        ),
      }
    : undefined;
}
