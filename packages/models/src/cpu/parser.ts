import { registerSpecs } from "./registers.ts";
import { numberLiteral, littleEndian } from "./numbers.ts";
import { encode } from "./encoding.ts";
import {
  CpuError,
  type Instruction,
  type Mode,
  type Operand,
  type Program,
} from "./types.ts";

export function parseOperand(
  raw: string,
  dialect: Program["dialect"],
): Operand {
  const source = raw.trim().toLowerCase();
  if (registerSpecs[source]) return { kind: "register", name: source };
  const memory = source.match(
    /^(?:(byte|word|dword|qword)\s+(?:ptr\s+)?)?(?:(?:ss|ds|es|fs|gs):)?\[([^\]]+)\]$/,
  );
  if (memory)
    return {
      kind: "memory",
      expression: memory[2]!.replace(/[<>]/g, ""),
      ...(memory[1]
        ? {
            bits: (
              { byte: 8, word: 16, dword: 32, qword: 64 } as Record<
                string,
                number
              >
            )[memory[1]]!,
          }
        : {}),
    };
  try {
    return { kind: "immediate", value: numberLiteral(source, dialect) };
  } catch {
    /* A symbol can be resolved in the second pass. */
  }
  if (/^[a-z_.][a-z0-9_.]*$/.test(source))
    return { kind: "label", name: source };
  throw new CpuError(`Operando inválido: ${raw}`);
}
export function parseProgram(
  code: string,
  mode: Mode = "x86-64",
  preferredDialect?: Program["dialect"],
): Program {
  if (code.length > 65536 || code.split("\n").length > 512)
    throw new CpuError("O modelo aceita até 512 linhas e 64 KiB.");
  const dialect =
    preferredDialect ??
    (/\bptr\b|^[\s\da-f]+\s*\|/im.test(code) ? "debugger-hex" : "assembly");
  const instructions: Instruction[] = [];
  const labels: Record<string, bigint> = {};
  const data: Program["data"] = [];
  let address = mode === "x86-64" ? 0x140001000n : 0x401000n;
  let dataAddress = 0x300000n;
  let entryName = "";
  let pendingLabels: string[] = [];
  const lines = code.split("\n");
  for (let index = 0; index < lines.length; index++) {
    let source = lines[index]!.split(";")[0]!.trim();
    if (!source) continue;
    const entry = source.match(/^entry\s+(\w+)/i);
    if (entry) {
      entryName = entry[1]!.toLowerCase();
      continue;
    }
    if (/^(format|section|include|use32|use64|align)\b/i.test(source)) continue;
    const dataMatch = source.match(/^(\w+)\s+(db|dw|dd|dq)\s+(.+)$/i);
    if (dataMatch) {
      labels[dataMatch[1]!.toLowerCase()] = dataAddress;
      const bytes: number[] = [];
      const unit = ({ db: 1, dw: 2, dd: 4, dq: 8 } as Record<string, number>)[
        dataMatch[2]!.toLowerCase()
      ]!;
      for (const item of dataMatch[3]!.split(/,(?=(?:[^']*'[^']*')*[^']*$)/)) {
        const value = item.trim();
        if (/^'.*'$/.test(value) || /^".*"$/.test(value))
          for (const char of value.slice(1, -1))
            bytes.push(...littleEndian(BigInt(char.codePointAt(0)!), unit));
        else bytes.push(...littleEndian(numberLiteral(value, dialect), unit));
      }
      if (bytes.length > 4096)
        throw new CpuError("Declaração de dados grande demais.", index + 1);
      data.push({ address: dataAddress, bytes });
      dataAddress += BigInt(bytes.length + 16);
      continue;
    }
    const label = source.match(/^<?([a-zA-Z_][\w.]*)>?:\s*(.*)$/);
    if (label) {
      const name = label[1]!.toLowerCase();
      labels[name] = address;
      pendingLabels.push(name);
      source = label[2]!.trim();
      if (!source) continue;
    }
    let originalBytes: number[] | undefined;
    const disassembly = source.match(/^([\da-f]+)\s*(?:\||:)\s*(.*)$/i);
    if (disassembly) {
      address = BigInt("0x" + disassembly[1]);
      source = disassembly[2]!.trim();
    }
    const bytesPrefix = source.match(/^((?:[\da-f]{2}\s+)+)\s*([a-z].*)$/i);
    if (bytesPrefix) {
      originalBytes = bytesPrefix[1]!
        .trim()
        .split(/\s+/)
        .map((byte) => parseInt(byte, 16));
      source = bytesPrefix[2]!.trim();
    }
    for (const name of pendingLabels) labels[name] = address;
    pendingLabels = [];
    const split = source.match(/^([a-zA-Z]+)\s*(.*)$/);
    if (!split) throw new CpuError("Instrução inválida.", index + 1);
    const mnemonic = split[1]!.toUpperCase();
    const operands = split[2]!.trim()
      ? split[2]!
          .split(/,(?![^\[]*\])/)
          .map((operand) => parseOperand(operand, dialect))
      : [];
    try {
      const bytes =
        originalBytes ??
        encode(mnemonic, operands, mode, {
          address,
          labels,
          dialect,
          allowUnresolved: true,
        });
      instructions.push({
        mnemonic,
        operands,
        line: index + 1,
        source,
        address,
        bytes,
        length: bytes.length,
        originalEncoding: Boolean(originalBytes),
      });
      address += BigInt(bytes.length);
    } catch (error) {
      throw new CpuError(
        error instanceof Error ? error.message : "Instrução não suportada.",
        index + 1,
      );
    }
  }
  if (!instructions.length)
    throw new CpuError("Escreva pelo menos uma instrução para iniciar.");
  const apiNames = [
    "MessageBoxW",
    "MessageBoxA",
    "ExitProcess",
    "DeleteFileA",
    "GetEnvironmentVariableA",
    "FatalExit",
  ];
  apiNames.forEach((name, index) => {
    labels[name.toLowerCase()] = 0xff000000n + BigInt(index * 16);
  });
  const bindings = Object.fromEntries(
    Object.entries(labels)
      .map(([name, value]) => [
        name,
        instructions.findIndex((instruction) => instruction.address === value),
      ])
      .filter(([, index]) => Number(index) >= 0),
  ) as Record<string, number>;
  for (const instruction of instructions)
    for (const operand of instruction.operands)
      if (operand.kind === "label" && labels[operand.name] === undefined)
        throw new CpuError(
          `Rótulo ${operand.name} não encontrado.`,
          instruction.line,
        );
  // Forward symbols can change an addressing form's encoded length. Resolve layout
  // until instruction boundaries and relative displacements agree.
  for (let pass = 0; pass < 8; pass++) {
    let changed = false;
    for (const [name, index] of Object.entries(bindings))
      labels[name] = instructions[index]!.address;
    let cursor = instructions[0]!.address;
    for (const instruction of instructions) {
      if (instruction.originalEncoding) {
        cursor = instruction.address + BigInt(instruction.length);
        continue;
      }
      if (instruction.address !== cursor) {
        instruction.address = cursor;
        changed = true;
      }
      const bytes = encode(instruction.mnemonic, instruction.operands, mode, {
        address: cursor,
        labels,
        dialect,
      });
      if (bytes.length !== instruction.length) changed = true;
      instruction.bytes = bytes;
      instruction.length = bytes.length;
      cursor += BigInt(bytes.length);
    }
    address = cursor;
    if (!changed) break;
    if (pass === 7)
      throw new CpuError("Não foi possível resolver os endereços do programa.");
  }
  return {
    instructions,
    labels,
    data,
    entry: labels[entryName] ?? labels.main ?? instructions[0]!.address,
    end: address,
    mode,
    dialect,
  };
}
