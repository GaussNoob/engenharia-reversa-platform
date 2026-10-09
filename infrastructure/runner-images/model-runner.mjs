// infrastructure/runner-images/model-entry.ts
import { readFileSync } from "node:fs";

// packages/models/src/cpu/types.ts
var CpuError = class extends Error {
  constructor(message, line) {
    super(message);
    this.line = line;
    this.name = "CpuError";
  }
  line;
};

// packages/models/src/cpu/registers.ts
var parents = ["rax", "rcx", "rdx", "rbx", "rsp", "rbp", "rsi", "rdi", "r8", "r9", "r10", "r11", "r12", "r13", "r14", "r15"];
var registerSpecs = {};
var traditional = [["rax", "eax", "ax", "al", "ah"], ["rcx", "ecx", "cx", "cl", "ch"], ["rdx", "edx", "dx", "dl", "dh"], ["rbx", "ebx", "bx", "bl", "bh"], ["rsp", "esp", "sp", "spl"], ["rbp", "ebp", "bp", "bpl"], ["rsi", "esi", "si", "sil"], ["rdi", "edi", "di", "dil"]];
for (const group of traditional) group.forEach((name, position) => {
  registerSpecs[name] = { parent: group[0], bits: [64, 32, 16, 8, 8][position], shift: position === 4 ? 8 : 0, index: parents.indexOf(group[0]), high: position === 4 };
});
for (let index2 = 8; index2 < 16; index2++) for (const [suffix, bits] of [["", 64], ["d", 32], ["w", 16], ["b", 8]]) registerSpecs[`r${index2}${suffix}`] = { parent: `r${index2}`, bits, shift: 0, index: index2 };
function spec(name, mode) {
  const result = registerSpecs[name.toLowerCase()];
  if (!result || mode === "x86-32" && (result.bits === 64 || result.index >= 8)) throw new CpuError(`Registrador ${name.toUpperCase()} inv\xE1lido para ${mode ?? "esta arquitetura"}.`);
  return result;
}
function readRegister(state, name) {
  const s = spec(name, state.mode);
  return BigInt.asUintN(s.bits, (state.registers[s.parent] ?? 0n) >> BigInt(s.shift));
}
function writeRegister(state, name, value) {
  const s = spec(name, state.mode);
  const v = BigInt.asUintN(s.bits, value);
  const before = state.registers[s.parent] ?? 0n;
  const mask = (1n << BigInt(s.bits)) - 1n << BigInt(s.shift);
  const after = s.bits === 64 || s.bits === 32 ? v : before & ~mask | v << BigInt(s.shift);
  state.registers[s.parent] = BigInt.asUintN(64, after);
  if (after !== before) state.changes.push(s.parent.toUpperCase());
}
function initialRegisters() {
  return Object.fromEntries(parents.map((name) => [name, name === "rsp" || name === "rbp" ? 0x201000n : 0n]));
}
function registerNames(mode) {
  return mode === "x86-64" ? parents.map((name) => name.toUpperCase()) : ["EAX", "EBX", "ECX", "EDX", "ESP", "EBP", "ESI", "EDI"];
}
function hex(value, bits = 64) {
  return `0x${BigInt.asUintN(bits, value).toString(16).padStart(bits / 4, "0").toUpperCase()}`;
}

// packages/models/src/cpu/numbers.ts
function numberLiteral(text, dialect = "assembly") {
  const source = text.trim().toLowerCase();
  const negative = source.startsWith("-");
  const value = negative ? source.slice(1) : source;
  if (value.length > 20) throw new CpuError("Literal num\xE9rico grande demais.");
  let parsed;
  if (/^0x[0-9a-f]+$/.test(value)) parsed = BigInt(value);
  else if (/^[0-9a-f]+h$/.test(value)) parsed = BigInt("0x" + value.slice(0, -1));
  else if (/^0b[01]+$/.test(value)) parsed = BigInt(value);
  else if (/^\d+$/.test(value)) parsed = BigInt(dialect === "debugger-hex" ? "0x" + value : value);
  else if (dialect === "debugger-hex" && /^[0-9a-f]+$/.test(value)) parsed = BigInt("0x" + value);
  else throw new CpuError(`Literal inv\xE1lido: ${text}`);
  return negative ? -parsed : parsed;
}
function littleEndian(value, byteCount) {
  return Array.from({ length: byteCount }, (_, index2) => Number(BigInt.asUintN(byteCount * 8, value) >> BigInt(index2 * 8) & 255n));
}

// packages/models/src/cpu/validate.ts
var arity = { NOP: 0, RET: 0, INT3: 0, MOV: 2, LEA: 2, ADD: 2, SUB: 2, CMP: 2, TEST: 2, AND: 2, OR: 2, XOR: 2, XCHG: 2, SHL: 2, SHR: 2, SAR: 2, ROL: 2, ROR: 2, INC: 1, DEC: 1, NOT: 1, NEG: 1, MUL: 1, IMUL: 1, DIV: 1, IDIV: 1, PUSH: 1, POP: 1, CALL: 1, JMP: 1 };
function validateInstruction(mnemonic, operands, mode) {
  const count = arity[mnemonic] ?? (mnemonic.startsWith("J") ? 1 : null);
  if (count !== null && operands.length !== count) throw new CpuError(`${mnemonic}: este modelo suporta a forma com ${count} operandos.`);
  const registers = operands.filter((operand) => operand.kind === "register").map((operand) => spec(operand.name, mode));
  const [a, b] = operands;
  if (["MOV", "ADD", "SUB", "CMP", "AND", "OR", "XOR", "TEST", "XCHG"].includes(mnemonic)) {
    const widths = operands.flatMap((operand) => operand.kind === "register" ? [spec(operand.name, mode).bits] : operand.kind === "memory" && operand.bits ? [operand.bits] : []);
    if (new Set(widths).size > 1) throw new CpuError("Os operandos precisam ter a mesma largura.");
    if (a?.kind === "memory" && b?.kind === "memory") throw new CpuError("Esta forma n\xE3o permite dois operandos de mem\xF3ria.");
  }
  if (["SHL", "SHR", "SAR", "ROL", "ROR"].includes(mnemonic) && (b?.kind !== "immediate" && !(b?.kind === "register" && b.name === "cl") || b?.kind === "immediate" && (b.value < 0n || b.value > 255n))) throw new CpuError("O deslocamento precisa ser CL ou um imediato de 8 bits.");
  if (["PUSH", "POP"].includes(mnemonic) && a?.kind === "register") {
    const bits = spec(a.name, mode).bits;
    if (bits !== 16 && bits !== (mode === "x86-64" ? 64 : 32)) throw new CpuError("Largura inv\xE1lida para PUSH/POP neste modo.");
  }
  if (mnemonic === "LEA" && a?.kind === "register" && spec(a.name, mode).bits === 8) throw new CpuError("LEA n\xE3o aceita destino de 8 bits.");
  if (mode === "x86-64" && registers.some((register) => register.high) && (registers.some((register) => register.index >= 8 || !register.high && register.bits === 8 && register.index >= 4) || operands.some((operand) => operand.kind === "memory" && /\br(?:[89]|1[0-5])\b/.test(operand.expression)))) throw new CpuError("AH/BH/CH/DH n\xE3o podem ser combinados com um prefixo REX.");
  if (b?.kind === "immediate") {
    const bits = a?.kind === "register" ? spec(a.name, mode).bits : a?.kind === "memory" ? a.bits : void 0;
    if (bits && !["SHL", "SHR", "SAR", "ROL", "ROR"].includes(mnemonic)) {
      if (b.value < -(1n << BigInt(bits - 1)) || b.value >= 1n << BigInt(bits)) throw new CpuError("Imediato fora da largura do destino.");
      if (bits === 64 && !(mnemonic === "MOV" && a?.kind === "register")) {
        const signed = BigInt.asIntN(64, b.value);
        if (signed < -2147483648n || signed > 2147483647n) throw new CpuError("Esta forma exige um imediato de 32 bits com extens\xE3o de sinal.");
      }
    }
  }
}

// packages/models/src/cpu/encoding.ts
var emptyContext = { address: 0n, labels: {}, dialect: "assembly" };
function prefix(bits, register = 0, rm = 0, force = false) {
  const result = bits === 16 ? [102] : [];
  const rex = 64 | (bits === 64 ? 8 : 0) | (register >= 8 ? 4 : 0) | (rm >= 8 ? 1 : 0);
  if (rex !== 64 || force) result.push(rex);
  return result;
}
function index(operand) {
  if (operand?.kind !== "register") throw new CpuError("Registrador esperado.");
  const s = spec(operand.name);
  return s.high ? s.index + 4 : s.index;
}
function width(operand, fallback) {
  return operand?.kind === "register" ? spec(operand.name).bits : operand?.kind === "memory" ? operand.bits ?? fallback : fallback;
}
function constant(text, context) {
  let value = 0n;
  for (const part of text.replace(/\s+/g, "").match(/[+-]?[^+-]+/g) ?? []) {
    const negative = part.startsWith("-");
    const token = part.replace(/^[+-]/, "");
    let number = context.labels[token];
    if (number === void 0) {
      try {
        number = numberLiteral(token, context.dialect);
      } catch (error) {
        if (context.allowUnresolved && /^[a-z_.][a-z0-9_.]*$/.test(token)) number = 0n;
        else throw error;
      }
    }
    value += negative ? -number : number;
  }
  return value;
}
function target(operand, context) {
  return operand?.kind === "immediate" ? operand.value : operand?.kind === "label" ? context.labels[operand.name] ?? 0n : 0n;
}
function modrm(register, operand, bits, mode, context, extraBytes = 0) {
  if (operand.kind === "register") {
    const s = spec(operand.name, mode);
    return { prefix: prefix(bits, register, s.index, s.bits === 8 && !s.high && s.index >= 4), tail: [192 | (register & 7) << 3 | (s.high ? s.index + 4 : s.index & 7)] };
  }
  if (operand.kind !== "memory") throw new CpuError("Registrador ou endere\xE7o de mem\xF3ria esperado.");
  const expression = operand.expression.toLowerCase();
  const match = expression.match(/\b(r(?:ax|bx|cx|dx|sp|bp|si|di|[89]|1[0-5])|e(?:ax|bx|cx|dx|sp|bp|si|di))\b/);
  if (match) {
    const base = spec(match[1], mode);
    const rest = expression.replace(match[1], "");
    const displacement = rest.trim() ? constant(rest, context) : 0n;
    const short = displacement >= -128n && displacement <= 127n;
    const hasDisp = displacement !== 0n || (base.index & 7) === 5;
    const mod = hasDisp ? short ? 64 : 128 : 0;
    const pref2 = [...mode === "x86-64" && base.bits === 32 ? [103] : [], ...prefix(bits, register, base.index)];
    return { prefix: pref2, tail: [mod | (register & 7) << 3 | base.index & 7, ...(base.index & 7) === 4 ? [36] : [], ...hasDisp ? littleEndian(displacement, short ? 1 : 4) : []] };
  }
  const address = constant(expression, context);
  const pref = prefix(bits, register);
  if (mode === "x86-32") return { prefix: pref, tail: [(register & 7) << 3 | 5, ...littleEndian(address, 4)] };
  const relative = address - (context.address + BigInt(pref.length + 1 + 1 + 4 + extraBytes));
  if (relative >= -2147483648n && relative <= 2147483647n) return { prefix: pref, tail: [(register & 7) << 3 | 5, ...littleEndian(relative, 4)] };
  if (address < 0n || address > 0x7fffffffn) throw new CpuError("Endere\xE7o absoluto n\xE3o codific\xE1vel neste formato.");
  return { prefix: pref, tail: [(register & 7) << 3 | 4, 37, ...littleEndian(address, 4)] };
}
function encode(mnemonic, operands, mode, context = emptyContext) {
  validateInstruction(mnemonic, operands, mode);
  if (mnemonic === "MOV" && operands[1]?.kind === "label") return encode(mnemonic, [operands[0], { kind: "immediate", value: context.labels[operands[1].name] ?? 0n }], mode, context);
  const [a, b] = operands;
  const bits = width(a, b?.kind === "register" ? spec(b.name).bits : mode === "x86-64" ? 64 : 32);
  if (mnemonic === "NOP") return [144];
  if (mnemonic === "RET") return [195];
  if (mnemonic === "INT3") return [204];
  if (mnemonic === "MOV" && a?.kind === "register" && b?.kind === "immediate") {
    const s = spec(a.name, mode);
    return [...prefix(s.bits, 0, s.index, s.bits === 8 && !s.high && s.index >= 4), (s.bits === 8 ? 176 : 184) + (s.high ? s.index + 4 : s.index & 7), ...littleEndian(b.value, s.bits / 8)];
  }
  if (mnemonic === "PUSH" || mnemonic === "POP") {
    if (a?.kind === "register") {
      const s = spec(a.name, mode);
      return [...s.bits === 16 ? [102] : [], ...s.index >= 8 ? [65] : [], (mnemonic === "PUSH" ? 80 : 88) + (s.index & 7)];
    }
    if (mnemonic === "PUSH" && a?.kind === "immediate") {
      if (a.value < -2147483648n || a.value > 2147483647n) throw new CpuError("PUSH imediato aceita um valor de 32 bits com sinal.");
      return a.value >= -128n && a.value <= 127n ? [106, ...littleEndian(a.value, 1)] : [104, ...littleEndian(a.value, 4)];
    }
  }
  if (mnemonic === "CALL" || mnemonic === "JMP") {
    if (a?.kind === "register" || a?.kind === "memory") {
      const rm = modrm(mnemonic === "CALL" ? 2 : 4, a, 32, mode, context);
      return [...rm.prefix, 255, ...rm.tail];
    }
    return [mnemonic === "CALL" ? 232 : 233, ...littleEndian(target(a, context) - context.address - 5n, 4)];
  }
  const jumps = { JE: 4, JZ: 4, JNE: 5, JNZ: 5, JA: 7, JAE: 3, JB: 2, JBE: 6, JC: 2, JNC: 3, JG: 15, JGE: 13, JL: 12, JLE: 14, JS: 8, JNS: 9, JO: 0, JNO: 1, JP: 10, JNP: 11 };
  if (mnemonic in jumps) return [15, 128 + jumps[mnemonic], ...littleEndian(target(a, context) - context.address - 6n, 4)];
  if (mnemonic === "JCXZ" || mnemonic === "JECXZ" || mnemonic === "JRCXZ") {
    const pref = (mode === "x86-64" ? mnemonic === "JECXZ" : mnemonic === "JCXZ") ? [103] : [];
    if (mode === "x86-64" && mnemonic === "JCXZ") throw new CpuError("JCXZ n\xE3o \xE9 v\xE1lido em long mode.");
    return [...pref, 227, ...littleEndian(target(a, context) - context.address - BigInt(pref.length + 2), 1)];
  }
  if (mnemonic === "MOV" && a && b) {
    if (b.kind === "immediate") {
      const size = bits === 64 ? 4 : bits / 8;
      const rm2 = modrm(0, a, bits, mode, context, size);
      return [...rm2.prefix, bits === 8 ? 198 : 199, ...rm2.tail, ...littleEndian(b.value, size)];
    }
    const source = b.kind === "register";
    const rm = modrm(index(source ? b : a), source ? a : b, bits, mode, context);
    return [...rm.prefix, source ? bits === 8 ? 136 : 137 : bits === 8 ? 138 : 139, ...rm.tail];
  }
  if (mnemonic === "LEA" && a && b) {
    const rm = modrm(index(a), b, bits, mode, context);
    return [...rm.prefix, 141, ...rm.tail];
  }
  const groups = { ADD: 0, OR: 1, AND: 4, SUB: 5, XOR: 6, CMP: 7 };
  const opcodes = { ADD: 1, OR: 9, AND: 33, SUB: 41, XOR: 49, CMP: 57 };
  if (mnemonic in groups && a && b) {
    if (b.kind === "immediate") {
      const size = bits === 64 ? 4 : bits / 8;
      const rm2 = modrm(groups[mnemonic], a, bits, mode, context, size);
      return [...rm2.prefix, bits === 8 ? 128 : 129, ...rm2.tail, ...littleEndian(b.value, size)];
    }
    const memorySource = b.kind === "memory";
    const rm = modrm(index(memorySource ? a : b), memorySource ? b : a, bits, mode, context);
    return [...rm.prefix, opcodes[mnemonic] + (memorySource ? 2 : 0) - (bits === 8 ? 1 : 0), ...rm.tail];
  }
  if (mnemonic === "TEST" && a && b) {
    const size = bits === 64 ? 4 : bits / 8;
    const rm = modrm(b.kind === "register" ? index(b) : 0, a, bits, mode, context, b.kind === "immediate" ? size : 0);
    return [...rm.prefix, b.kind === "immediate" ? bits === 8 ? 246 : 247 : bits === 8 ? 132 : 133, ...rm.tail, ...b.kind === "immediate" ? littleEndian(b.value, size) : []];
  }
  const unary = { INC: 0, DEC: 1, NOT: 2, NEG: 3, MUL: 4, IMUL: 5, DIV: 6, IDIV: 7 };
  if (mnemonic in unary && a) {
    const rm = modrm(unary[mnemonic], a, bits, mode, context);
    const arithmetic = mnemonic === "INC" || mnemonic === "DEC";
    return [...rm.prefix, arithmetic ? bits === 8 ? 254 : 255 : bits === 8 ? 246 : 247, ...rm.tail];
  }
  const shifts = { ROL: 0, ROR: 1, SHL: 4, SHR: 5, SAR: 7 };
  if (mnemonic in shifts && a && b) {
    const rm = modrm(shifts[mnemonic], a, bits, mode, context, b.kind === "immediate" ? 1 : 0);
    return [...rm.prefix, b.kind === "register" ? bits === 8 ? 210 : 211 : bits === 8 ? 192 : 193, ...rm.tail, ...b.kind === "immediate" ? littleEndian(b.value, 1) : []];
  }
  if (mnemonic === "XCHG" && a && b) {
    if (a.kind === "register" && b.kind === "register" && a.name === b.name && (a.name === "eax" || a.name === "ax")) return a.name === "ax" ? [102, 144] : [144];
    const rm = modrm(index(b), a, bits, mode, context);
    return [...rm.prefix, bits === 8 ? 134 : 135, ...rm.tail];
  }
  throw new CpuError(`Instru\xE7\xE3o ${mnemonic} n\xE3o suportada pelo modelo.`);
}

// packages/models/src/cpu/parser.ts
function parseOperand(raw, dialect) {
  const source = raw.trim().toLowerCase();
  if (registerSpecs[source]) return { kind: "register", name: source };
  const memory = source.match(/^(?:(byte|word|dword|qword)\s+(?:ptr\s+)?)?(?:(?:ss|ds|es|fs|gs):)?\[([^\]]+)\]$/);
  if (memory) return { kind: "memory", expression: memory[2].replace(/[<>]/g, ""), ...memory[1] ? { bits: { byte: 8, word: 16, dword: 32, qword: 64 }[memory[1]] } : {} };
  try {
    return { kind: "immediate", value: numberLiteral(source, dialect) };
  } catch {
  }
  if (/^[a-z_.][a-z0-9_.]*$/.test(source)) return { kind: "label", name: source };
  throw new CpuError(`Operando inv\xE1lido: ${raw}`);
}
function parseProgram(code, mode = "x86-64", preferredDialect) {
  if (code.length > 65536 || code.split("\n").length > 512) throw new CpuError("O modelo aceita at\xE9 512 linhas e 64 KiB.");
  const dialect = preferredDialect ?? (/\bptr\b|^[\s\da-f]+\s*\|/im.test(code) ? "debugger-hex" : "assembly");
  const instructions = [];
  const labels = {};
  const data = [];
  let address = mode === "x86-64" ? 0x140001000n : 0x401000n;
  let dataAddress = 0x300000n;
  let entryName = "";
  let pendingLabels = [];
  const lines = code.split("\n");
  for (let index2 = 0; index2 < lines.length; index2++) {
    let source = lines[index2].split(";")[0].trim();
    if (!source) continue;
    const entry = source.match(/^entry\s+(\w+)/i);
    if (entry) {
      entryName = entry[1].toLowerCase();
      continue;
    }
    if (/^(format|section|include|use32|use64|align)\b/i.test(source)) continue;
    const dataMatch = source.match(/^(\w+)\s+(db|dw|dd|dq)\s+(.+)$/i);
    if (dataMatch) {
      labels[dataMatch[1].toLowerCase()] = dataAddress;
      const bytes = [];
      const unit = { db: 1, dw: 2, dd: 4, dq: 8 }[dataMatch[2].toLowerCase()];
      for (const item of dataMatch[3].split(/,(?=(?:[^']*'[^']*')*[^']*$)/)) {
        const value = item.trim();
        if (/^'.*'$/.test(value) || /^".*"$/.test(value)) for (const char of value.slice(1, -1)) bytes.push(...littleEndian(BigInt(char.codePointAt(0)), unit));
        else bytes.push(...littleEndian(numberLiteral(value, dialect), unit));
      }
      if (bytes.length > 4096) throw new CpuError("Declara\xE7\xE3o de dados grande demais.", index2 + 1);
      data.push({ address: dataAddress, bytes });
      dataAddress += BigInt(bytes.length + 16);
      continue;
    }
    const label = source.match(/^<?([a-zA-Z_][\w.]*)>?:\s*(.*)$/);
    if (label) {
      const name = label[1].toLowerCase();
      labels[name] = address;
      pendingLabels.push(name);
      source = label[2].trim();
      if (!source) continue;
    }
    let originalBytes;
    const disassembly = source.match(/^([\da-f]+)\s*(?:\||:)\s*(.*)$/i);
    if (disassembly) {
      address = BigInt("0x" + disassembly[1]);
      source = disassembly[2].trim();
    }
    const bytesPrefix = source.match(/^((?:[\da-f]{2}\s+)+)\s*([a-z].*)$/i);
    if (bytesPrefix) {
      originalBytes = bytesPrefix[1].trim().split(/\s+/).map((byte) => parseInt(byte, 16));
      source = bytesPrefix[2].trim();
    }
    for (const name of pendingLabels) labels[name] = address;
    pendingLabels = [];
    const split = source.match(/^([a-zA-Z]+)\s*(.*)$/);
    if (!split) throw new CpuError("Instru\xE7\xE3o inv\xE1lida.", index2 + 1);
    const mnemonic = split[1].toUpperCase();
    const operands = split[2].trim() ? split[2].split(/,(?![^\[]*\])/).map((operand) => parseOperand(operand, dialect)) : [];
    try {
      const bytes = originalBytes ?? encode(mnemonic, operands, mode, { address, labels, dialect, allowUnresolved: true });
      instructions.push({ mnemonic, operands, line: index2 + 1, source, address, bytes, length: bytes.length, originalEncoding: Boolean(originalBytes) });
      address += BigInt(bytes.length);
    } catch (error) {
      throw new CpuError(error instanceof Error ? error.message : "Instru\xE7\xE3o n\xE3o suportada.", index2 + 1);
    }
  }
  if (!instructions.length) throw new CpuError("Escreva pelo menos uma instru\xE7\xE3o para iniciar.");
  const apiNames = ["MessageBoxW", "MessageBoxA", "ExitProcess", "DeleteFileA", "GetEnvironmentVariableA", "FatalExit"];
  apiNames.forEach((name, index2) => {
    labels[name.toLowerCase()] = 0xff000000n + BigInt(index2 * 16);
  });
  const bindings = Object.fromEntries(Object.entries(labels).map(([name, value]) => [name, instructions.findIndex((instruction) => instruction.address === value)]).filter(([, index2]) => Number(index2) >= 0));
  for (const instruction of instructions) for (const operand of instruction.operands) if (operand.kind === "label" && labels[operand.name] === void 0) throw new CpuError(`R\xF3tulo ${operand.name} n\xE3o encontrado.`, instruction.line);
  for (let pass = 0; pass < 8; pass++) {
    let changed = false;
    for (const [name, index2] of Object.entries(bindings)) labels[name] = instructions[index2].address;
    let cursor = instructions[0].address;
    for (const instruction of instructions) {
      if (instruction.originalEncoding) {
        cursor = instruction.address + BigInt(instruction.length);
        continue;
      }
      if (instruction.address !== cursor) {
        instruction.address = cursor;
        changed = true;
      }
      const bytes = encode(instruction.mnemonic, instruction.operands, mode, { address: cursor, labels, dialect });
      if (bytes.length !== instruction.length) changed = true;
      instruction.bytes = bytes;
      instruction.length = bytes.length;
      cursor += BigInt(bytes.length);
    }
    address = cursor;
    if (!changed) break;
    if (pass === 7) throw new CpuError("N\xE3o foi poss\xEDvel resolver os endere\xE7os do programa.");
  }
  return { instructions, labels, data, entry: labels[entryName] ?? labels.main ?? instructions[0].address, end: address, mode, dialect };
}

// packages/models/src/cpu/flags.ts
var sign = (bits) => 1n << BigInt(bits - 1);
function statusFlags(result, bits) {
  const value = BigInt.asUintN(bits, result);
  let count = 0;
  let low = Number(value & 255n);
  while (low) {
    count += low & 1;
    low >>>= 1;
  }
  return { ZF: value === 0n, SF: (value & sign(bits)) !== 0n, PF: count % 2 === 0 };
}
function arithmeticFlags(a, b, result, bits, subtract) {
  a = BigInt.asUintN(bits, a);
  b = BigInt.asUintN(bits, b);
  const r = BigInt.asUintN(bits, result);
  const s = sign(bits);
  return { ...statusFlags(r, bits), CF: subtract ? a < b : a + b >= 1n << BigInt(bits), OF: subtract ? ((a ^ b) & (a ^ r) & s) !== 0n : (~(a ^ b) & (a ^ r) & s) !== 0n, AF: ((a ^ b ^ r) & 0x10n) !== 0n };
}
function logicalFlags(result, bits) {
  return { ...statusFlags(result, bits), CF: false, OF: false, AF: null };
}
function initialFlags() {
  return { CF: false, ZF: false, SF: false, OF: false, AF: false, PF: false };
}

// packages/models/src/cpu/memory.ts
function effectiveAddress(expression, state, program) {
  const value = expression.replace(/\s+/g, "").replace(/[<>]/g, "");
  const parts = value.match(/[+-]?[^+-]+/g) ?? [];
  let address = 0n;
  for (const part of parts) {
    const negative = part.startsWith("-");
    const token = part.replace(/^[+-]/, "");
    let amount;
    if (token === "rip" || token === "eip") amount = state.ip;
    else if (program.labels[token] !== void 0) amount = program.labels[token];
    else {
      try {
        amount = readRegister(state, token);
      } catch {
        amount = numberLiteral(token, program.dialect);
      }
    }
    address += negative ? -amount : amount;
  }
  return BigInt.asUintN(state.mode === "x86-64" ? 64 : 32, address);
}
function assertRange(address, count) {
  const allowed = address >= 0x1ff000n && address + BigInt(count) <= 0x202000n || address >= 0x300000n && address + BigInt(count) <= 0x310000n;
  if (!allowed) throw new CpuError(`Endere\xE7o 0x${address.toString(16)} fora das regi\xF5es de mem\xF3ria do laborat\xF3rio.`);
}
function readMemory(state, address, bits) {
  assertRange(address, bits / 8);
  let result = 0n;
  for (let i = 0; i < bits / 8; i++) result |= BigInt(state.memory.get(address + BigInt(i)) ?? 0) << BigInt(i * 8);
  return result;
}
function writeMemory(state, address, value, bits) {
  assertRange(address, bits / 8);
  for (let i = 0; i < bits / 8; i++) state.memory.set(address + BigInt(i), Number(BigInt.asUintN(bits, value) >> BigInt(i * 8) & 255n));
  state.changes.push(`MEM[0x${address.toString(16)}]`);
}
function readOperand(operand, state, program, bits = 64) {
  if (!operand) throw new CpuError("Operando ausente.");
  if (operand.kind === "register") return readRegister(state, operand.name);
  if (operand.kind === "immediate") return operand.value;
  if (operand.kind === "label") {
    const address = program.labels[operand.name];
    if (address === void 0) throw new CpuError(`R\xF3tulo ${operand.name} n\xE3o encontrado.`);
    return address;
  }
  return readMemory(state, effectiveAddress(operand.expression, state, program), operand.bits ?? bits);
}

// packages/models/src/cpu/engine.ts
function createCpu(program) {
  const state = { registers: initialRegisters(), flags: initialFlags(), ip: program.entry, memory: /* @__PURE__ */ new Map(), frames: [], halted: false, steps: 0, output: [], changes: [], mode: program.mode };
  for (const block of program.data) block.bytes.forEach((byte, index2) => state.memory.set(block.address + BigInt(index2), byte));
  return state;
}
function destinationBits(operand, state, other) {
  return operand?.kind === "register" ? spec(operand.name, state.mode).bits : operand?.kind === "memory" ? operand.bits ?? (other?.kind === "register" ? spec(other.name).bits : state.mode === "x86-64" ? 64 : 32) : state.mode === "x86-64" ? 64 : 32;
}
function write(operand, value, state, program, bits) {
  if (operand?.kind === "register") writeRegister(state, operand.name, value);
  else if (operand?.kind === "memory") writeMemory(state, effectiveAddress(operand.expression, state, program), value, operand.bits ?? bits);
  else throw new CpuError("O destino deve ser um registrador ou mem\xF3ria.");
}
function push(state, value, bits = state.mode === "x86-64" ? 64 : 32) {
  const name = state.mode === "x86-64" ? "rsp" : "esp";
  const address = readRegister(state, name) - BigInt(bits / 8);
  writeRegister(state, name, address);
  writeMemory(state, address, value, bits);
}
function pop(state, bits = state.mode === "x86-64" ? 64 : 32) {
  const name = state.mode === "x86-64" ? "rsp" : "esp";
  const address = readRegister(state, name);
  const value = readMemory(state, address, bits);
  writeRegister(state, name, address + BigInt(bits / 8));
  return value;
}
function jumpCondition(mnemonic, state) {
  const flag = (name) => {
    const value = state.flags[name];
    if (value === null) throw new CpuError(`A flag ${name} est\xE1 indefinida; este salto n\xE3o tem resultado previs\xEDvel.`);
    return value;
  };
  switch (mnemonic) {
    case "JE":
    case "JZ":
      return flag("ZF");
    case "JNE":
    case "JNZ":
      return !flag("ZF");
    case "JB":
    case "JC":
      return flag("CF");
    case "JAE":
    case "JNC":
      return !flag("CF");
    case "JA":
      return !flag("CF") && !flag("ZF");
    case "JBE":
      return flag("CF") || flag("ZF");
    case "JG":
      return !flag("ZF") && flag("SF") === flag("OF");
    case "JGE":
      return flag("SF") === flag("OF");
    case "JL":
      return flag("SF") !== flag("OF");
    case "JLE":
      return flag("ZF") || flag("SF") !== flag("OF");
    case "JS":
      return flag("SF");
    case "JNS":
      return !flag("SF");
    case "JO":
      return flag("OF");
    case "JNO":
      return !flag("OF");
    case "JP":
      return flag("PF");
    case "JNP":
      return !flag("PF");
    default:
      throw new CpuError("Condi\xE7\xE3o de salto n\xE3o suportada.");
  }
}
function shift(instruction, state, program, bits) {
  const [a, b] = instruction.operands;
  const original = BigInt.asUintN(bits, readOperand(a, state, program, bits));
  let count = Number(readOperand(b, state, program, bits) & BigInt(bits === 64 ? 63 : 31));
  const kind = instruction.mnemonic;
  if (kind === "ROL" || kind === "ROR") count %= bits;
  if (!count) return;
  const shift2 = BigInt(count);
  let result;
  let carry;
  if (kind === "ROL" || kind === "ROR") {
    result = BigInt.asUintN(bits, kind === "ROL" ? original << shift2 | original >> BigInt(bits - count) : original >> shift2 | original << BigInt(bits - count));
    carry = kind === "ROL" ? (result & 1n) !== 0n : (result & 1n << BigInt(bits - 1)) !== 0n;
    state.flags = { ...state.flags, CF: carry, OF: count === 1 ? kind === "ROL" ? (result >> BigInt(bits - 1) & 1n) !== BigInt(carry) : (result >> BigInt(bits - 1) & 1n) !== (result >> BigInt(bits - 2) & 1n) : null };
  } else {
    result = BigInt.asUintN(bits, kind === "SHL" ? original << shift2 : kind === "SAR" ? BigInt.asIntN(bits, original) >> shift2 : original >> shift2);
    carry = count <= bits ? kind === "SHL" ? (original >> BigInt(bits - count) & 1n) !== 0n : (original >> BigInt(count - 1) & 1n) !== 0n : null;
    state.flags = { ...statusFlags(result, bits), CF: carry, AF: null, OF: count === 1 ? kind === "SHL" ? Boolean(result >> BigInt(bits - 1) & 1n) !== carry : kind === "SAR" ? false : Boolean(original >> BigInt(bits - 1) & 1n) : null };
  }
  write(a, result, state, program, bits);
}
function stepCpu(program, state) {
  if (state.halted) return state;
  const instruction = program.instructions.find((item) => item.address === state.ip);
  if (!instruction) {
    if (state.ip === program.end) {
      state.halted = true;
      return state;
    }
    throw new CpuError(`N\xE3o h\xE1 instru\xE7\xE3o no endere\xE7o ${hex(state.ip)}.`);
  }
  if (state.steps >= 5e3) throw new CpuError("Limite de 5.000 instru\xE7\xF5es atingido.", instruction.line);
  state.changes = [];
  const [a, b] = instruction.operands;
  const bits = destinationBits(a, state, b);
  const next = state.ip + BigInt(instruction.length);
  let jumped = false;
  const value = () => readOperand(a, state, program, bits);
  const other = () => readOperand(b, state, program, bits);
  switch (instruction.mnemonic) {
    case "MOV":
      write(a, other(), state, program, bits);
      break;
    case "LEA":
      if (b?.kind !== "memory") throw new CpuError("LEA exige uma express\xE3o de endere\xE7o.");
      write(a, effectiveAddress(b.expression, state, program), state, program, bits);
      break;
    case "ADD":
    case "SUB":
    case "CMP": {
      const x = value(), y = other();
      const subtract = instruction.mnemonic !== "ADD";
      const result = subtract ? x - y : x + y;
      state.flags = arithmeticFlags(x, y, result, bits, subtract);
      if (instruction.mnemonic !== "CMP") write(a, result, state, program, bits);
      break;
    }
    case "INC":
    case "DEC": {
      const x = value();
      const subtract = instruction.mnemonic === "DEC";
      const carry = state.flags.CF;
      const result = subtract ? x - 1n : x + 1n;
      state.flags = { ...arithmeticFlags(x, 1n, result, bits, subtract), CF: carry };
      write(a, result, state, program, bits);
      break;
    }
    case "XOR":
    case "OR":
    case "AND":
    case "TEST": {
      const x = value(), y = other();
      const result = instruction.mnemonic === "XOR" ? x ^ y : instruction.mnemonic === "OR" ? x | y : x & y;
      state.flags = logicalFlags(result, bits);
      if (instruction.mnemonic !== "TEST") write(a, result, state, program, bits);
      break;
    }
    case "NOT":
      write(a, ~value(), state, program, bits);
      break;
    case "NEG": {
      const x = value();
      state.flags = arithmeticFlags(0n, x, -x, bits, true);
      write(a, -x, state, program, bits);
      break;
    }
    case "SHL":
    case "SHR":
    case "SAR":
    case "ROL":
    case "ROR":
      shift(instruction, state, program, bits);
      break;
    case "MUL":
    case "IMUL": {
      const low = bits === 64 ? "rax" : bits === 32 ? "eax" : bits === 16 ? "ax" : "al";
      const signed = instruction.mnemonic === "IMUL";
      const x = readRegister(state, low), y = value();
      const product = signed ? BigInt.asIntN(bits, x) * BigInt.asIntN(bits, y) : x * y;
      const high = BigInt.asUintN(bits, product >> BigInt(bits));
      if (bits === 8) writeRegister(state, "ax", product);
      else {
        writeRegister(state, low, product);
        writeRegister(state, bits === 64 ? "rdx" : bits === 32 ? "edx" : "dx", high);
      }
      const overflow = signed ? BigInt.asIntN(bits, product) !== product : high !== 0n;
      state.flags = { CF: overflow, OF: overflow, ZF: null, SF: null, PF: null, AF: null };
      break;
    }
    case "DIV":
    case "IDIV": {
      const signed = instruction.mnemonic === "IDIV";
      const low = bits === 64 ? "rax" : bits === 32 ? "eax" : bits === 16 ? "ax" : "al";
      const high = bits === 64 ? "rdx" : bits === 32 ? "edx" : bits === 16 ? "dx" : "ah";
      const raw = readRegister(state, high) << BigInt(bits) | readRegister(state, low);
      const dividend = signed ? BigInt.asIntN(bits * 2, raw) : raw;
      const divisor = signed ? BigInt.asIntN(bits, value()) : BigInt.asUintN(bits, value());
      if (!divisor) throw new CpuError("Divis\xE3o por zero.");
      const quotient = dividend / divisor;
      const min = signed ? -(1n << BigInt(bits - 1)) : 0n, max = signed ? (1n << BigInt(bits - 1)) - 1n : (1n << BigInt(bits)) - 1n;
      if (quotient < min || quotient > max) throw new CpuError("Quociente fora da largura do destino.");
      writeRegister(state, low, quotient);
      writeRegister(state, high, dividend % divisor);
      state.flags = { CF: null, OF: null, ZF: null, SF: null, PF: null, AF: null };
      break;
    }
    case "PUSH":
      push(state, value(), a?.kind === "immediate" ? state.mode === "x86-64" ? 64 : 32 : bits);
      break;
    case "POP":
      write(a, pop(state, bits), state, program, bits);
      break;
    case "CALL": {
      const target2 = readOperand(a, state, program, bits);
      const api = Object.entries(program.labels).find(([name, address]) => address === target2 && address >= 0xff000000n && address < 0xff000100n)?.[0];
      if (api) {
        state.output.push(`Chamada modelada: ${api}`);
        if (api === "exitprocess" || api === "fatalexit") state.halted = true;
        else writeRegister(state, state.mode === "x86-64" ? "eax" : "eax", api === "deletefilea" ? 0n : 1n);
      } else {
        push(state, next);
        state.frames.push({ label: a?.kind === "label" ? a.name : hex(target2), returnAddress: next });
        state.ip = target2;
        jumped = true;
      }
      break;
    }
    case "RET":
      if (!state.frames.length && readRegister(state, state.mode === "x86-64" ? "rsp" : "esp") === 0x201000n) state.halted = true;
      else {
        state.ip = pop(state);
        state.frames.pop();
        jumped = true;
      }
      break;
    case "JMP":
      state.ip = readOperand(a, state, program, bits);
      jumped = true;
      break;
    case "NOP":
      break;
    case "XCHG": {
      if (a?.kind === "register" && b?.kind === "register" && a.name === b.name && (a.name === "eax" || a.name === "ax")) break;
      const x = value(), y = other();
      write(a, y, state, program, bits);
      write(b, x, state, program, bits);
      break;
    }
    case "INT3":
      state.output.push("INT3: ponto de parada atingido.");
      state.halted = true;
      break;
    case "JCXZ":
    case "JECXZ":
    case "JRCXZ": {
      const name = instruction.mnemonic === "JCXZ" ? "cx" : instruction.mnemonic === "JECXZ" ? "ecx" : "rcx";
      if (readRegister(state, name) === 0n) {
        state.ip = readOperand(a, state, program, bits);
        jumped = true;
      }
      break;
    }
    default:
      if (!instruction.mnemonic.startsWith("J")) throw new CpuError("Instru\xE7\xE3o n\xE3o suportada.");
      if (jumpCondition(instruction.mnemonic, state)) {
        state.ip = readOperand(a, state, program, bits);
        jumped = true;
      }
  }
  state.steps++;
  if (!jumped) state.ip = next;
  if (state.ip === program.end) state.halted = true;
  return state;
}
function runCpu(program, state = createCpu(program), limit = 5e3) {
  for (let count = 0; !state.halted && count < limit; count++) stepCpu(program, state);
  if (!state.halted) throw new CpuError("Limite de execu\xE7\xE3o atingido.");
  return state;
}
function cpuSnapshot(state) {
  const top = readRegister(state, state.mode === "x86-64" ? "rsp" : "esp");
  return { mode: state.mode, registers: Object.fromEntries(registerNames(state.mode).map((name) => [name, hex(readRegister(state, name), state.mode === "x86-64" ? 64 : 32)])), flags: { ...state.flags }, ip: hex(state.ip, state.mode === "x86-64" ? 64 : 32), memory: [{ address: hex(top), bytes: Array.from({ length: 128 }, (_, index2) => state.memory.get(top + BigInt(index2)) ?? 0) }, { address: "0x00300000", bytes: Array.from({ length: 128 }, (_, index2) => state.memory.get(0x300000n + BigInt(index2)) ?? 0) }], steps: state.steps, halted: state.halted, output: state.output.slice(-20) };
}

// infrastructure/runner-images/model-entry.ts
try {
  const input = JSON.parse(readFileSync(process.argv[2] ?? "", "utf8"));
  if (typeof input !== "object" || input === null || !("code" in input) || typeof input.code !== "string" || input.code.length > 65536) throw new Error("Programa inv\xE1lido.");
  const mode = "mode" in input && input.mode === "x86-32" ? "x86-32" : "x86-64";
  const state = runCpu(parseProgram(input.code, mode));
  process.stdout.write(JSON.stringify(cpuSnapshot(state)));
} catch (error) {
  process.stderr.write(error instanceof Error ? error.message : "Erro no modelo.");
  process.exitCode = 1;
}
