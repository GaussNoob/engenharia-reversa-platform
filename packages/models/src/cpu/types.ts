export type Mode = "x86-32" | "x86-64";
export type FlagName = "CF" | "ZF" | "SF" | "OF" | "AF" | "PF";
export type Flags = Record<FlagName, boolean | null>;
export type RegisterSpec = {
  parent: string;
  bits: number;
  shift: number;
  index: number;
  high?: boolean;
};
export type Operand =
  | { kind: "register"; name: string }
  | { kind: "immediate"; value: bigint }
  | { kind: "memory"; expression: string; bits?: number }
  | { kind: "label"; name: string };
export type Instruction = {
  mnemonic: string;
  operands: Operand[];
  line: number;
  source: string;
  address: bigint;
  bytes: number[];
  length: number;
  originalEncoding?: boolean;
};
export type Program = {
  instructions: Instruction[];
  labels: Record<string, bigint>;
  data: Array<{ address: bigint; bytes: number[] }>;
  entry: bigint;
  end: bigint;
  mode: Mode;
  dialect: "assembly" | "debugger-hex";
};
export type CpuState = {
  registers: Record<string, bigint>;
  flags: Flags;
  ip: bigint;
  memory: Map<bigint, number>;
  frames: Array<{ label: string; returnAddress: bigint }>;
  halted: boolean;
  steps: number;
  output: string[];
  changes: string[];
  mode: Mode;
};
export class CpuError extends Error {
  constructor(
    message: string,
    public readonly line?: number,
  ) {
    super(message);
    this.name = "CpuError";
  }
}
