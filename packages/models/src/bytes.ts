export function parseHex(input: string): Uint8Array {
  const cleaned = input.replace(/0x/gi, "").replace(/[\s,:_-]/g, "");
  if (!/^(?:[0-9a-f]{2})*$/i.test(cleaned))
    throw new Error("Use pares de dígitos hexadecimais, como 4D 5A 00 00.");
  if (cleaned.length > 16384)
    throw new Error("Entrada hexadecimal grande demais.");
  return Uint8Array.from(
    cleaned.match(/.{2}/g)?.map((value) => parseInt(value, 16)) ?? [],
  );
}
export function hexBytes(bytes: ArrayLike<number>): string {
  return Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0").toUpperCase(),
  ).join(" ");
}
export function unsignedValue(bytes: Uint8Array, littleEndian = true): bigint {
  const ordered = littleEndian ? bytes : Uint8Array.from(bytes).reverse();
  let result = 0n;
  ordered.forEach(
    (byte, index) => (result |= BigInt(byte) << BigInt(index * 8)),
  );
  return result;
}
export function signedValue(value: bigint, bits: number): bigint {
  return BigInt.asIntN(bits, value);
}
export function rotate(
  value: bigint,
  count: number,
  bits: number,
  direction: "left" | "right",
): bigint {
  if (![8, 16, 32, 64].includes(bits))
    throw new Error("Largura não suportada.");
  const shift = ((count % bits) + bits) % bits;
  const v = BigInt.asUintN(bits, value);
  return BigInt.asUintN(
    bits,
    direction === "left"
      ? (v << BigInt(shift)) | (v >> BigInt(bits - shift))
      : (v >> BigInt(shift)) | (v << BigInt(bits - shift)),
  );
}
export function encodeText(
  text: string,
  encoding:
    | "ascii"
    | "latin-1"
    | "utf-8"
    | "utf-16-le"
    | "utf-16-be"
    | "utf-32-le"
    | "utf-32-be",
  terminated = false,
): Uint8Array {
  const bytes: number[] = [];
  const push = (value: number, size: number, le: boolean) => {
    const row = Array.from(
      { length: size },
      (_, index) => (value >>> (index * 8)) & 255,
    );
    bytes.push(...(le ? row : row.reverse()));
  };
  if (encoding === "utf-8") bytes.push(...new TextEncoder().encode(text));
  else if (encoding === "ascii" || encoding === "latin-1") {
    for (const char of text) {
      const value = char.codePointAt(0)!;
      if (value > (encoding === "ascii" ? 127 : 255))
        throw new Error(`O caractere ${char} não existe em ${encoding}.`);
      bytes.push(value);
    }
  } else if (encoding.startsWith("utf-16"))
    for (let index = 0; index < text.length; index++)
      push(text.charCodeAt(index), 2, encoding.endsWith("le"));
  else
    for (const char of text)
      push(char.codePointAt(0)!, 4, encoding.endsWith("le"));
  if (terminated)
    bytes.push(
      ...Array(
        encoding.startsWith("utf-32")
          ? 4
          : encoding.startsWith("utf-16")
            ? 2
            : 1,
      ).fill(0),
    );
  return Uint8Array.from(bytes);
}
