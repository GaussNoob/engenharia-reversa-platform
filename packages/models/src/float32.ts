export type Float32Value = {
  bits: number;
  value: number;
  sign: number;
  exponent: number;
  fraction: number;
  category: "normal" | "subnormal" | "zero" | "infinito" | "NaN";
  bytes: Uint8Array;
};
export function inspectFloat32(bits: number): Float32Value {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setUint32(0, bits >>> 0, true);
  const sign = bits >>> 31,
    exponent = (bits >>> 23) & 0xff,
    fraction = bits & 0x7fffff;
  return {
    bits: bits >>> 0,
    value: view.getFloat32(0, true),
    sign,
    exponent,
    fraction,
    category:
      exponent === 255
        ? fraction === 0
          ? "infinito"
          : "NaN"
        : exponent === 0
          ? fraction === 0
            ? "zero"
            : "subnormal"
          : "normal",
    bytes: new Uint8Array(buffer),
  };
}
export function encodeFloat32(value: number): Float32Value {
  const view = new DataView(new ArrayBuffer(4));
  view.setFloat32(0, value, true);
  return inspectFloat32(view.getUint32(0, true));
}
export function formatFloat(value: number): string {
  return Object.is(value, -0) ? "-0" : String(value);
}
