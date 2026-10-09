import { CpuError } from "./types.ts";
export function numberLiteral(
  text: string,
  dialect: "assembly" | "debugger-hex" = "assembly",
): bigint {
  const source = text.trim().toLowerCase();
  const negative = source.startsWith("-");
  const value = negative ? source.slice(1) : source;
  if (value.length > 20) throw new CpuError("Literal numérico grande demais.");
  let parsed: bigint;
  if (/^0x[0-9a-f]+$/.test(value)) parsed = BigInt(value);
  else if (/^[0-9a-f]+h$/.test(value))
    parsed = BigInt("0x" + value.slice(0, -1));
  else if (/^0b[01]+$/.test(value)) parsed = BigInt(value);
  else if (/^\d+$/.test(value))
    parsed = BigInt(dialect === "debugger-hex" ? "0x" + value : value);
  else if (dialect === "debugger-hex" && /^[0-9a-f]+$/.test(value))
    parsed = BigInt("0x" + value);
  else throw new CpuError(`Literal inválido: ${text}`);
  return negative ? -parsed : parsed;
}
export function littleEndian(value: bigint, byteCount: number): number[] {
  return Array.from({ length: byteCount }, (_, index) =>
    Number((BigInt.asUintN(byteCount * 8, value) >> BigInt(index * 8)) & 255n),
  );
}
