export type BinaryString = {
  offset: number;
  size: number;
  encoding: "ASCII" | "UTF-16LE";
  text: string;
};
/** Bounded static scan. Reports printable runs as candidates, not proof of usage. */
export function extractStrings(
  bytes: Uint8Array,
  minimum = 4,
  limit = 500,
): BinaryString[] {
  const found: BinaryString[] = [];
  const printable = (byte: number) => byte >= 32 && byte <= 126;
  for (let offset = 0; offset < bytes.length && found.length < limit;) {
    const start = offset;
    while (offset < bytes.length && printable(bytes[offset]!)) offset++;
    if (offset - start >= minimum)
      found.push({
        offset: start,
        size: offset - start,
        encoding: "ASCII",
        text: new TextDecoder().decode(
          bytes.subarray(start, Math.min(offset, start + 512)),
        ),
      });
    offset++;
  }
  for (let parity = 0; parity < 2; parity++) {
    for (
      let offset = parity;
      offset + 1 < bytes.length && found.length < limit;
    ) {
      const start = offset;
      while (
        offset + 1 < bytes.length &&
        printable(bytes[offset]!) &&
        bytes[offset + 1] === 0
      )
        offset += 2;
      if ((offset - start) / 2 >= minimum)
        found.push({
          offset: start,
          size: offset - start,
          encoding: "UTF-16LE",
          text: new TextDecoder("utf-16le").decode(
            bytes.subarray(start, Math.min(offset, start + 1024)),
          ),
        });
      offset += 2;
    }
  }
  return found.sort((a, b) => a.offset - b.offset);
}
