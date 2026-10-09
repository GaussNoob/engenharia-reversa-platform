import { readRegister } from "./registers.ts";
import { numberLiteral } from "./numbers.ts";
import {
  CpuError,
  type CpuState,
  type Operand,
  type Program,
} from "./types.ts";
export function effectiveAddress(
  expression: string,
  state: CpuState,
  program: Program,
): bigint {
  const value = expression.replace(/\s+/g, "").replace(/[<>]/g, "");
  const parts = value.match(/[+-]?[^+-]+/g) ?? [];
  let address = 0n;
  for (const part of parts) {
    const negative = part.startsWith("-");
    const token = part.replace(/^[+-]/, "");
    let amount: bigint;
    if (token === "rip" || token === "eip") amount = state.ip;
    else if (program.labels[token] !== undefined)
      amount = program.labels[token]!;
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
function assertRange(address: bigint, count: number): void {
  const allowed =
    (address >= 0x1ff000n && address + BigInt(count) <= 0x202000n) ||
    (address >= 0x300000n && address + BigInt(count) <= 0x310000n);
  if (!allowed)
    throw new CpuError(
      `Endereço 0x${address.toString(16)} fora das regiões de memória do laboratório.`,
    );
}
export function readMemory(
  state: CpuState,
  address: bigint,
  bits: number,
): bigint {
  assertRange(address, bits / 8);
  let result = 0n;
  for (let i = 0; i < bits / 8; i++)
    result |=
      BigInt(state.memory.get(address + BigInt(i)) ?? 0) << BigInt(i * 8);
  return result;
}
export function writeMemory(
  state: CpuState,
  address: bigint,
  value: bigint,
  bits: number,
): void {
  assertRange(address, bits / 8);
  for (let i = 0; i < bits / 8; i++)
    state.memory.set(
      address + BigInt(i),
      Number((BigInt.asUintN(bits, value) >> BigInt(i * 8)) & 255n),
    );
  state.changes.push(`MEM[0x${address.toString(16)}]`);
}
export function readOperand(
  operand: Operand | undefined,
  state: CpuState,
  program: Program,
  bits = 64,
): bigint {
  if (!operand) throw new CpuError("Operando ausente.");
  if (operand.kind === "register") return readRegister(state, operand.name);
  if (operand.kind === "immediate") return operand.value;
  if (operand.kind === "label") {
    const address = program.labels[operand.name];
    if (address === undefined)
      throw new CpuError(`Rótulo ${operand.name} não encontrado.`);
    return address;
  }
  return readMemory(
    state,
    effectiveAddress(operand.expression, state, program),
    operand.bits ?? bits,
  );
}
