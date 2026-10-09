import {
  CpuError,
  type CpuState,
  type RegisterSpec,
  type Mode,
} from "./types.ts";
const parents = [
  "rax",
  "rcx",
  "rdx",
  "rbx",
  "rsp",
  "rbp",
  "rsi",
  "rdi",
  "r8",
  "r9",
  "r10",
  "r11",
  "r12",
  "r13",
  "r14",
  "r15",
];
export const registerSpecs: Record<string, RegisterSpec> = {};
const traditional = [
  ["rax", "eax", "ax", "al", "ah"],
  ["rcx", "ecx", "cx", "cl", "ch"],
  ["rdx", "edx", "dx", "dl", "dh"],
  ["rbx", "ebx", "bx", "bl", "bh"],
  ["rsp", "esp", "sp", "spl"],
  ["rbp", "ebp", "bp", "bpl"],
  ["rsi", "esi", "si", "sil"],
  ["rdi", "edi", "di", "dil"],
];
for (const group of traditional)
  group.forEach((name, position) => {
    registerSpecs[name] = {
      parent: group[0]!,
      bits: [64, 32, 16, 8, 8][position]!,
      shift: position === 4 ? 8 : 0,
      index: parents.indexOf(group[0]!),
      high: position === 4,
    };
  });
for (let index = 8; index < 16; index++)
  for (const [suffix, bits] of [
    ["", 64],
    ["d", 32],
    ["w", 16],
    ["b", 8],
  ] as const)
    registerSpecs[`r${index}${suffix}`] = {
      parent: `r${index}`,
      bits,
      shift: 0,
      index,
    };
export function spec(name: string, mode?: Mode): RegisterSpec {
  const result = registerSpecs[name.toLowerCase()];
  if (
    !result ||
    (mode === "x86-32" && (result.bits === 64 || result.index >= 8))
  )
    throw new CpuError(
      `Registrador ${name.toUpperCase()} inválido para ${mode ?? "esta arquitetura"}.`,
    );
  return result;
}
export function readRegister(state: CpuState, name: string): bigint {
  const s = spec(name, state.mode);
  return BigInt.asUintN(
    s.bits,
    (state.registers[s.parent] ?? 0n) >> BigInt(s.shift),
  );
}
export function writeRegister(
  state: CpuState,
  name: string,
  value: bigint,
): void {
  const s = spec(name, state.mode);
  const v = BigInt.asUintN(s.bits, value);
  const before = state.registers[s.parent] ?? 0n;
  const mask = ((1n << BigInt(s.bits)) - 1n) << BigInt(s.shift);
  const after =
    s.bits === 64 || s.bits === 32
      ? v
      : (before & ~mask) | (v << BigInt(s.shift));
  state.registers[s.parent] = BigInt.asUintN(64, after);
  if (after !== before) state.changes.push(s.parent.toUpperCase());
}
export function initialRegisters(): Record<string, bigint> {
  return Object.fromEntries(
    parents.map((name) => [
      name,
      name === "rsp" || name === "rbp" ? 0x201000n : 0n,
    ]),
  );
}
export function registerNames(mode: Mode): string[] {
  return mode === "x86-64"
    ? parents.map((name) => name.toUpperCase())
    : ["EAX", "EBX", "ECX", "EDX", "ESP", "EBP", "ESI", "EDI"];
}
export function hex(value: bigint, bits = 64): string {
  return `0x${BigInt.asUintN(bits, value)
    .toString(16)
    .padStart(bits / 4, "0")
    .toUpperCase()}`;
}
