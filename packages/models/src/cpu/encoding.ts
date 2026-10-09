import { spec } from "./registers.ts";
import { littleEndian, numberLiteral } from "./numbers.ts";
import { CpuError, type Operand, type Mode } from "./types.ts";
import { validateInstruction } from "./validate.ts";
type Context = {
  address: bigint;
  labels: Record<string, bigint>;
  dialect: "assembly" | "debugger-hex";
  allowUnresolved?: boolean;
};
const emptyContext: Context = { address: 0n, labels: {}, dialect: "assembly" };
function prefix(bits: number, register = 0, rm = 0, force = false): number[] {
  const result = bits === 16 ? [0x66] : [];
  const rex =
    0x40 | (bits === 64 ? 8 : 0) | (register >= 8 ? 4 : 0) | (rm >= 8 ? 1 : 0);
  if (rex !== 0x40 || force) result.push(rex);
  return result;
}
function index(operand: Operand | undefined): number {
  if (operand?.kind !== "register") throw new CpuError("Registrador esperado.");
  const s = spec(operand.name);
  return s.high ? s.index + 4 : s.index;
}
function width(operand: Operand | undefined, fallback: number): number {
  return operand?.kind === "register"
    ? spec(operand.name).bits
    : operand?.kind === "memory"
      ? (operand.bits ?? fallback)
      : fallback;
}
function constant(text: string, context: Context): bigint {
  let value = 0n;
  for (const part of text.replace(/\s+/g, "").match(/[+-]?[^+-]+/g) ?? []) {
    const negative = part.startsWith("-");
    const token = part.replace(/^[+-]/, "");
    let number = context.labels[token];
    if (number === undefined) {
      try {
        number = numberLiteral(token, context.dialect);
      } catch (error) {
        if (context.allowUnresolved && /^[a-z_.][a-z0-9_.]*$/.test(token))
          number = 0n;
        else throw error;
      }
    }
    value += negative ? -number : number;
  }
  return value;
}
function target(operand: Operand | undefined, context: Context): bigint {
  return operand?.kind === "immediate"
    ? operand.value
    : operand?.kind === "label"
      ? (context.labels[operand.name] ?? 0n)
      : 0n;
}
function modrm(
  register: number,
  operand: Operand,
  bits: number,
  mode: Mode,
  context: Context,
  extraBytes = 0,
): { prefix: number[]; tail: number[] } {
  if (operand.kind === "register") {
    const s = spec(operand.name, mode);
    return {
      prefix: prefix(
        bits,
        register,
        s.index,
        s.bits === 8 && !s.high && s.index >= 4,
      ),
      tail: [
        0xc0 | ((register & 7) << 3) | (s.high ? s.index + 4 : s.index & 7),
      ],
    };
  }
  if (operand.kind !== "memory")
    throw new CpuError("Registrador ou endereço de memória esperado.");
  const expression = operand.expression.toLowerCase();
  const match = expression.match(
    /\b(r(?:ax|bx|cx|dx|sp|bp|si|di|[89]|1[0-5])|e(?:ax|bx|cx|dx|sp|bp|si|di))\b/,
  );
  if (match) {
    const base = spec(match[1]!, mode);
    const rest = expression.replace(match[1]!, "");
    const displacement = rest.trim() ? constant(rest, context) : 0n;
    const short = displacement >= -128n && displacement <= 127n;
    const hasDisp = displacement !== 0n || (base.index & 7) === 5;
    const mod = hasDisp ? (short ? 0x40 : 0x80) : 0;
    const pref = [
      ...(mode === "x86-64" && base.bits === 32 ? [0x67] : []),
      ...prefix(bits, register, base.index),
    ];
    return {
      prefix: pref,
      tail: [
        mod | ((register & 7) << 3) | (base.index & 7),
        ...((base.index & 7) === 4 ? [0x24] : []),
        ...(hasDisp ? littleEndian(displacement, short ? 1 : 4) : []),
      ],
    };
  }
  const address = constant(expression, context);
  const pref = prefix(bits, register);
  if (mode === "x86-32")
    return {
      prefix: pref,
      tail: [((register & 7) << 3) | 5, ...littleEndian(address, 4)],
    };
  const relative =
    address - (context.address + BigInt(pref.length + 1 + 1 + 4 + extraBytes));
  if (relative >= -2147483648n && relative <= 2147483647n)
    return {
      prefix: pref,
      tail: [((register & 7) << 3) | 5, ...littleEndian(relative, 4)],
    };
  if (address < 0n || address > 0x7fffffffn)
    throw new CpuError("Endereço absoluto não codificável neste formato.");
  return {
    prefix: pref,
    tail: [((register & 7) << 3) | 4, 0x25, ...littleEndian(address, 4)],
  };
}
export function encode(
  mnemonic: string,
  operands: Operand[],
  mode: Mode,
  context: Context = emptyContext,
): number[] {
  validateInstruction(mnemonic, operands, mode);
  if (mnemonic === "MOV" && operands[1]?.kind === "label")
    return encode(
      mnemonic,
      [
        operands[0]!,
        { kind: "immediate", value: context.labels[operands[1].name] ?? 0n },
      ],
      mode,
      context,
    );
  const [a, b] = operands;
  const bits = width(
    a,
    b?.kind === "register" ? spec(b.name).bits : mode === "x86-64" ? 64 : 32,
  );
  if (mnemonic === "NOP") return [0x90];
  if (mnemonic === "RET") return [0xc3];
  if (mnemonic === "INT3") return [0xcc];
  if (mnemonic === "MOV" && a?.kind === "register" && b?.kind === "immediate") {
    const s = spec(a.name, mode);
    return [
      ...prefix(s.bits, 0, s.index, s.bits === 8 && !s.high && s.index >= 4),
      (s.bits === 8 ? 0xb0 : 0xb8) + (s.high ? s.index + 4 : s.index & 7),
      ...littleEndian(b.value, s.bits / 8),
    ];
  }
  if (mnemonic === "PUSH" || mnemonic === "POP") {
    if (a?.kind === "register") {
      const s = spec(a.name, mode);
      return [
        ...(s.bits === 16 ? [0x66] : []),
        ...(s.index >= 8 ? [0x41] : []),
        (mnemonic === "PUSH" ? 0x50 : 0x58) + (s.index & 7),
      ];
    }
    if (mnemonic === "PUSH" && a?.kind === "immediate") {
      if (a.value < -2147483648n || a.value > 2147483647n)
        throw new CpuError(
          "PUSH imediato aceita um valor de 32 bits com sinal.",
        );
      return a.value >= -128n && a.value <= 127n
        ? [0x6a, ...littleEndian(a.value, 1)]
        : [0x68, ...littleEndian(a.value, 4)];
    }
  }
  if (mnemonic === "CALL" || mnemonic === "JMP") {
    if (a?.kind === "register" || a?.kind === "memory") {
      const rm = modrm(mnemonic === "CALL" ? 2 : 4, a, 32, mode, context);
      return [...rm.prefix, 0xff, ...rm.tail];
    }
    return [
      mnemonic === "CALL" ? 0xe8 : 0xe9,
      ...littleEndian(target(a, context) - context.address - 5n, 4),
    ];
  }
  const jumps: Record<string, number> = {
    JE: 4,
    JZ: 4,
    JNE: 5,
    JNZ: 5,
    JA: 7,
    JAE: 3,
    JB: 2,
    JBE: 6,
    JC: 2,
    JNC: 3,
    JG: 15,
    JGE: 13,
    JL: 12,
    JLE: 14,
    JS: 8,
    JNS: 9,
    JO: 0,
    JNO: 1,
    JP: 10,
    JNP: 11,
  };
  if (mnemonic in jumps)
    return [
      0x0f,
      0x80 + jumps[mnemonic]!,
      ...littleEndian(target(a, context) - context.address - 6n, 4),
    ];
  if (mnemonic === "JCXZ" || mnemonic === "JECXZ" || mnemonic === "JRCXZ") {
    const pref = (
      mode === "x86-64" ? mnemonic === "JECXZ" : mnemonic === "JCXZ"
    )
      ? [0x67]
      : [];
    if (mode === "x86-64" && mnemonic === "JCXZ")
      throw new CpuError("JCXZ não é válido em long mode.");
    return [
      ...pref,
      0xe3,
      ...littleEndian(
        target(a, context) - context.address - BigInt(pref.length + 2),
        1,
      ),
    ];
  }
  if (mnemonic === "MOV" && a && b) {
    if (b.kind === "immediate") {
      const size = bits === 64 ? 4 : bits / 8;
      const rm = modrm(0, a, bits, mode, context, size);
      return [
        ...rm.prefix,
        bits === 8 ? 0xc6 : 0xc7,
        ...rm.tail,
        ...littleEndian(b.value, size),
      ];
    }
    const source = b.kind === "register";
    const rm = modrm(
      index(source ? b : a),
      source ? a : b,
      bits,
      mode,
      context,
    );
    return [
      ...rm.prefix,
      source ? (bits === 8 ? 0x88 : 0x89) : bits === 8 ? 0x8a : 0x8b,
      ...rm.tail,
    ];
  }
  if (mnemonic === "LEA" && a && b) {
    const rm = modrm(index(a), b, bits, mode, context);
    return [...rm.prefix, 0x8d, ...rm.tail];
  }
  const groups: Record<string, number> = {
    ADD: 0,
    OR: 1,
    AND: 4,
    SUB: 5,
    XOR: 6,
    CMP: 7,
  };
  const opcodes: Record<string, number> = {
    ADD: 0x01,
    OR: 0x09,
    AND: 0x21,
    SUB: 0x29,
    XOR: 0x31,
    CMP: 0x39,
  };
  if (mnemonic in groups && a && b) {
    if (b.kind === "immediate") {
      const size = bits === 64 ? 4 : bits / 8;
      const rm = modrm(groups[mnemonic]!, a, bits, mode, context, size);
      return [
        ...rm.prefix,
        bits === 8 ? 0x80 : 0x81,
        ...rm.tail,
        ...littleEndian(b.value, size),
      ];
    }
    const memorySource = b.kind === "memory";
    const rm = modrm(
      index(memorySource ? a : b),
      memorySource ? b : a,
      bits,
      mode,
      context,
    );
    return [
      ...rm.prefix,
      opcodes[mnemonic]! + (memorySource ? 2 : 0) - (bits === 8 ? 1 : 0),
      ...rm.tail,
    ];
  }
  if (mnemonic === "TEST" && a && b) {
    const size = bits === 64 ? 4 : bits / 8;
    const rm = modrm(
      b.kind === "register" ? index(b) : 0,
      a,
      bits,
      mode,
      context,
      b.kind === "immediate" ? size : 0,
    );
    return [
      ...rm.prefix,
      b.kind === "immediate"
        ? bits === 8
          ? 0xf6
          : 0xf7
        : bits === 8
          ? 0x84
          : 0x85,
      ...rm.tail,
      ...(b.kind === "immediate" ? littleEndian(b.value, size) : []),
    ];
  }
  const unary: Record<string, number> = {
    INC: 0,
    DEC: 1,
    NOT: 2,
    NEG: 3,
    MUL: 4,
    IMUL: 5,
    DIV: 6,
    IDIV: 7,
  };
  if (mnemonic in unary && a) {
    const rm = modrm(unary[mnemonic]!, a, bits, mode, context);
    const arithmetic = mnemonic === "INC" || mnemonic === "DEC";
    return [
      ...rm.prefix,
      arithmetic ? (bits === 8 ? 0xfe : 0xff) : bits === 8 ? 0xf6 : 0xf7,
      ...rm.tail,
    ];
  }
  const shifts: Record<string, number> = {
    ROL: 0,
    ROR: 1,
    SHL: 4,
    SHR: 5,
    SAR: 7,
  };
  if (mnemonic in shifts && a && b) {
    const rm = modrm(
      shifts[mnemonic]!,
      a,
      bits,
      mode,
      context,
      b.kind === "immediate" ? 1 : 0,
    );
    return [
      ...rm.prefix,
      b.kind === "register"
        ? bits === 8
          ? 0xd2
          : 0xd3
        : bits === 8
          ? 0xc0
          : 0xc1,
      ...rm.tail,
      ...(b.kind === "immediate" ? littleEndian(b.value, 1) : []),
    ];
  }
  if (mnemonic === "XCHG" && a && b) {
    if (
      a.kind === "register" &&
      b.kind === "register" &&
      a.name === b.name &&
      (a.name === "eax" || a.name === "ax")
    )
      return a.name === "ax" ? [0x66, 0x90] : [0x90];
    const rm = modrm(index(b), a, bits, mode, context);
    return [...rm.prefix, bits === 8 ? 0x86 : 0x87, ...rm.tail];
  }
  throw new CpuError(`Instrução ${mnemonic} não suportada pelo modelo.`);
}
