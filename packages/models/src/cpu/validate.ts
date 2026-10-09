import { spec } from "./registers.ts";
import { CpuError, type Mode, type Operand } from "./types.ts";
const arity: Record<string, number> = {
  NOP: 0,
  RET: 0,
  INT3: 0,
  MOV: 2,
  LEA: 2,
  ADD: 2,
  SUB: 2,
  CMP: 2,
  TEST: 2,
  AND: 2,
  OR: 2,
  XOR: 2,
  XCHG: 2,
  SHL: 2,
  SHR: 2,
  SAR: 2,
  ROL: 2,
  ROR: 2,
  INC: 1,
  DEC: 1,
  NOT: 1,
  NEG: 1,
  MUL: 1,
  IMUL: 1,
  DIV: 1,
  IDIV: 1,
  PUSH: 1,
  POP: 1,
  CALL: 1,
  JMP: 1,
};
export function validateInstruction(
  mnemonic: string,
  operands: Operand[],
  mode: Mode,
) {
  const count = arity[mnemonic] ?? (mnemonic.startsWith("J") ? 1 : null);
  if (count !== null && operands.length !== count)
    throw new CpuError(
      `${mnemonic}: este modelo suporta a forma com ${count} operandos.`,
    );
  const registers = operands
    .filter(
      (operand): operand is Extract<Operand, { kind: "register" }> =>
        operand.kind === "register",
    )
    .map((operand) => spec(operand.name, mode));
  const [a, b] = operands;
  if (
    ["MOV", "ADD", "SUB", "CMP", "AND", "OR", "XOR", "TEST", "XCHG"].includes(
      mnemonic,
    )
  ) {
    const widths = operands.flatMap((operand) =>
      operand.kind === "register"
        ? [spec(operand.name, mode).bits]
        : operand.kind === "memory" && operand.bits
          ? [operand.bits]
          : [],
    );
    if (new Set(widths).size > 1)
      throw new CpuError("Os operandos precisam ter a mesma largura.");
    if (a?.kind === "memory" && b?.kind === "memory")
      throw new CpuError("Esta forma não permite dois operandos de memória.");
  }
  if (
    ["SHL", "SHR", "SAR", "ROL", "ROR"].includes(mnemonic) &&
    ((b?.kind !== "immediate" &&
      !(b?.kind === "register" && b.name === "cl")) ||
      (b?.kind === "immediate" && (b.value < 0n || b.value > 255n)))
  )
    throw new CpuError(
      "O deslocamento precisa ser CL ou um imediato de 8 bits.",
    );
  if (["PUSH", "POP"].includes(mnemonic) && a?.kind === "register") {
    const bits = spec(a.name, mode).bits;
    if (bits !== 16 && bits !== (mode === "x86-64" ? 64 : 32))
      throw new CpuError("Largura inválida para PUSH/POP neste modo.");
  }
  if (
    mnemonic === "LEA" &&
    a?.kind === "register" &&
    spec(a.name, mode).bits === 8
  )
    throw new CpuError("LEA não aceita destino de 8 bits.");
  if (
    mode === "x86-64" &&
    registers.some((register) => register.high) &&
    (registers.some(
      (register) =>
        register.index >= 8 ||
        (!register.high && register.bits === 8 && register.index >= 4),
    ) ||
      operands.some(
        (operand) =>
          operand.kind === "memory" &&
          /\br(?:[89]|1[0-5])\b/.test(operand.expression),
      ))
  )
    throw new CpuError(
      "AH/BH/CH/DH não podem ser combinados com um prefixo REX.",
    );
  if (b?.kind === "immediate") {
    const bits =
      a?.kind === "register"
        ? spec(a.name, mode).bits
        : a?.kind === "memory"
          ? a.bits
          : undefined;
    if (bits && !["SHL", "SHR", "SAR", "ROL", "ROR"].includes(mnemonic)) {
      if (b.value < -(1n << BigInt(bits - 1)) || b.value >= 1n << BigInt(bits))
        throw new CpuError("Imediato fora da largura do destino.");
      if (bits === 64 && !(mnemonic === "MOV" && a?.kind === "register")) {
        const signed = BigInt.asIntN(64, b.value);
        if (signed < -2147483648n || signed > 2147483647n)
          throw new CpuError(
            "Esta forma exige um imediato de 32 bits com extensão de sinal.",
          );
      }
    }
  }
}
