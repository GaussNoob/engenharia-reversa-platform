import type { Flags } from "./types.ts";
const sign = (bits: number) => 1n << BigInt(bits - 1);
export function statusFlags(
  result: bigint,
  bits: number,
): Pick<Flags, "ZF" | "SF" | "PF"> {
  const value = BigInt.asUintN(bits, result);
  let count = 0;
  let low = Number(value & 255n);
  while (low) {
    count += low & 1;
    low >>>= 1;
  }
  return {
    ZF: value === 0n,
    SF: (value & sign(bits)) !== 0n,
    PF: count % 2 === 0,
  };
}
export function arithmeticFlags(
  a: bigint,
  b: bigint,
  result: bigint,
  bits: number,
  subtract: boolean,
): Flags {
  a = BigInt.asUintN(bits, a);
  b = BigInt.asUintN(bits, b);
  const r = BigInt.asUintN(bits, result);
  const s = sign(bits);
  return {
    ...statusFlags(r, bits),
    CF: subtract ? a < b : a + b >= 1n << BigInt(bits),
    OF: subtract
      ? ((a ^ b) & (a ^ r) & s) !== 0n
      : (~(a ^ b) & (a ^ r) & s) !== 0n,
    AF: ((a ^ b ^ r) & 0x10n) !== 0n,
  };
}
export function logicalFlags(result: bigint, bits: number): Flags {
  return { ...statusFlags(result, bits), CF: false, OF: false, AF: null };
}
export function initialFlags(): Flags {
  return { CF: false, ZF: false, SF: false, OF: false, AF: false, PF: false };
}
