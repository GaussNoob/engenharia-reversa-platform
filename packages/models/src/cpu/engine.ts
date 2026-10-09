import type { CpuSnapshot } from "@nucleo/core";
import {
  arithmeticFlags,
  initialFlags,
  logicalFlags,
  statusFlags,
} from "./flags.ts";
import {
  initialRegisters,
  readRegister,
  writeRegister,
  spec,
  registerNames,
  hex,
} from "./registers.ts";
import {
  readMemory,
  writeMemory,
  effectiveAddress,
  readOperand,
} from "./memory.ts";
import {
  CpuError,
  type CpuState,
  type Program,
  type Operand,
  type Instruction,
} from "./types.ts";

export function createCpu(program: Program): CpuState {
  const state: CpuState = {
    registers: initialRegisters(),
    flags: initialFlags(),
    ip: program.entry,
    memory: new Map(),
    frames: [],
    halted: false,
    steps: 0,
    output: [],
    changes: [],
    mode: program.mode,
  };
  for (const block of program.data)
    block.bytes.forEach((byte, index) =>
      state.memory.set(block.address + BigInt(index), byte),
    );
  return state;
}
function destinationBits(
  operand: Operand | undefined,
  state: CpuState,
  other?: Operand,
): number {
  return operand?.kind === "register"
    ? spec(operand.name, state.mode).bits
    : operand?.kind === "memory"
      ? (operand.bits ??
        (other?.kind === "register"
          ? spec(other.name).bits
          : state.mode === "x86-64"
            ? 64
            : 32))
      : state.mode === "x86-64"
        ? 64
        : 32;
}
function write(
  operand: Operand | undefined,
  value: bigint,
  state: CpuState,
  program: Program,
  bits: number,
): void {
  if (operand?.kind === "register") writeRegister(state, operand.name, value);
  else if (operand?.kind === "memory")
    writeMemory(
      state,
      effectiveAddress(operand.expression, state, program),
      value,
      operand.bits ?? bits,
    );
  else throw new CpuError("O destino deve ser um registrador ou memória.");
}
function push(
  state: CpuState,
  value: bigint,
  bits = state.mode === "x86-64" ? 64 : 32,
): void {
  const name = state.mode === "x86-64" ? "rsp" : "esp";
  const address = readRegister(state, name) - BigInt(bits / 8);
  writeRegister(state, name, address);
  writeMemory(state, address, value, bits);
}
function pop(
  state: CpuState,
  bits = state.mode === "x86-64" ? 64 : 32,
): bigint {
  const name = state.mode === "x86-64" ? "rsp" : "esp";
  const address = readRegister(state, name);
  const value = readMemory(state, address, bits);
  writeRegister(state, name, address + BigInt(bits / 8));
  return value;
}
function jumpCondition(mnemonic: string, state: CpuState): boolean {
  const flag = (name: keyof CpuState["flags"]) => {
    const value = state.flags[name];
    if (value === null)
      throw new CpuError(
        `A flag ${name} está indefinida; este salto não tem resultado previsível.`,
      );
    return value;
  };
  switch (mnemonic) {
    case "JE":
    case "JZ":
      return flag("ZF");
    case "JNE":
    case "JNZ":
      return !flag("ZF");
    case "JB":
    case "JC":
      return flag("CF");
    case "JAE":
    case "JNC":
      return !flag("CF");
    case "JA":
      return !flag("CF") && !flag("ZF");
    case "JBE":
      return flag("CF") || flag("ZF");
    case "JG":
      return !flag("ZF") && flag("SF") === flag("OF");
    case "JGE":
      return flag("SF") === flag("OF");
    case "JL":
      return flag("SF") !== flag("OF");
    case "JLE":
      return flag("ZF") || flag("SF") !== flag("OF");
    case "JS":
      return flag("SF");
    case "JNS":
      return !flag("SF");
    case "JO":
      return flag("OF");
    case "JNO":
      return !flag("OF");
    case "JP":
      return flag("PF");
    case "JNP":
      return !flag("PF");
    default:
      throw new CpuError("Condição de salto não suportada.");
  }
}
function shift(
  instruction: Instruction,
  state: CpuState,
  program: Program,
  bits: number,
): void {
  const [a, b] = instruction.operands;
  const original = BigInt.asUintN(bits, readOperand(a, state, program, bits));
  let count = Number(
    readOperand(b, state, program, bits) & BigInt(bits === 64 ? 63 : 31),
  );
  const kind = instruction.mnemonic;
  if (kind === "ROL" || kind === "ROR") count %= bits;
  if (!count) return;
  const shift = BigInt(count);
  let result: bigint;
  let carry: boolean | null;
  if (kind === "ROL" || kind === "ROR") {
    result = BigInt.asUintN(
      bits,
      kind === "ROL"
        ? (original << shift) | (original >> BigInt(bits - count))
        : (original >> shift) | (original << BigInt(bits - count)),
    );
    carry =
      kind === "ROL"
        ? (result & 1n) !== 0n
        : (result & (1n << BigInt(bits - 1))) !== 0n;
    state.flags = {
      ...state.flags,
      CF: carry,
      OF:
        count === 1
          ? kind === "ROL"
            ? ((result >> BigInt(bits - 1)) & 1n) !== BigInt(carry)
            : ((result >> BigInt(bits - 1)) & 1n) !==
              ((result >> BigInt(bits - 2)) & 1n)
          : null,
    };
  } else {
    result = BigInt.asUintN(
      bits,
      kind === "SHL"
        ? original << shift
        : kind === "SAR"
          ? BigInt.asIntN(bits, original) >> shift
          : original >> shift,
    );
    carry =
      count <= bits
        ? kind === "SHL"
          ? ((original >> BigInt(bits - count)) & 1n) !== 0n
          : ((original >> BigInt(count - 1)) & 1n) !== 0n
        : null;
    state.flags = {
      ...statusFlags(result, bits),
      CF: carry,
      AF: null,
      OF:
        count === 1
          ? kind === "SHL"
            ? Boolean((result >> BigInt(bits - 1)) & 1n) !== carry
            : kind === "SAR"
              ? false
              : Boolean((original >> BigInt(bits - 1)) & 1n)
          : null,
    };
  }
  write(a, result, state, program, bits);
}
export function stepCpu(program: Program, state: CpuState): CpuState {
  if (state.halted) return state;
  const instruction = program.instructions.find(
    (item) => item.address === state.ip,
  );
  if (!instruction) {
    if (state.ip === program.end) {
      state.halted = true;
      return state;
    }
    throw new CpuError(`Não há instrução no endereço ${hex(state.ip)}.`);
  }
  if (state.steps >= 5000)
    throw new CpuError(
      "Limite de 5.000 instruções atingido.",
      instruction.line,
    );
  state.changes = [];
  const [a, b] = instruction.operands;
  const bits = destinationBits(a, state, b);
  const next = state.ip + BigInt(instruction.length);
  let jumped = false;
  const value = () => readOperand(a, state, program, bits);
  const other = () => readOperand(b, state, program, bits);
  switch (instruction.mnemonic) {
    case "MOV":
      write(a, other(), state, program, bits);
      break;
    case "LEA":
      if (b?.kind !== "memory")
        throw new CpuError("LEA exige uma expressão de endereço.");
      write(
        a,
        effectiveAddress(b.expression, state, program),
        state,
        program,
        bits,
      );
      break;
    case "ADD":
    case "SUB":
    case "CMP": {
      const x = value(),
        y = other();
      const subtract = instruction.mnemonic !== "ADD";
      const result = subtract ? x - y : x + y;
      state.flags = arithmeticFlags(x, y, result, bits, subtract);
      if (instruction.mnemonic !== "CMP")
        write(a, result, state, program, bits);
      break;
    }
    case "INC":
    case "DEC": {
      const x = value();
      const subtract = instruction.mnemonic === "DEC";
      const carry = state.flags.CF;
      const result = subtract ? x - 1n : x + 1n;
      state.flags = {
        ...arithmeticFlags(x, 1n, result, bits, subtract),
        CF: carry,
      };
      write(a, result, state, program, bits);
      break;
    }
    case "XOR":
    case "OR":
    case "AND":
    case "TEST": {
      const x = value(),
        y = other();
      const result =
        instruction.mnemonic === "XOR"
          ? x ^ y
          : instruction.mnemonic === "OR"
            ? x | y
            : x & y;
      state.flags = logicalFlags(result, bits);
      if (instruction.mnemonic !== "TEST")
        write(a, result, state, program, bits);
      break;
    }
    case "NOT":
      write(a, ~value(), state, program, bits);
      break;
    case "NEG": {
      const x = value();
      state.flags = arithmeticFlags(0n, x, -x, bits, true);
      write(a, -x, state, program, bits);
      break;
    }
    case "SHL":
    case "SHR":
    case "SAR":
    case "ROL":
    case "ROR":
      shift(instruction, state, program, bits);
      break;
    case "MUL":
    case "IMUL": {
      const low =
        bits === 64 ? "rax" : bits === 32 ? "eax" : bits === 16 ? "ax" : "al";
      const signed = instruction.mnemonic === "IMUL";
      const x = readRegister(state, low),
        y = value();
      const product = signed
        ? BigInt.asIntN(bits, x) * BigInt.asIntN(bits, y)
        : x * y;
      const high = BigInt.asUintN(bits, product >> BigInt(bits));
      if (bits === 8) writeRegister(state, "ax", product);
      else {
        writeRegister(state, low, product);
        writeRegister(
          state,
          bits === 64 ? "rdx" : bits === 32 ? "edx" : "dx",
          high,
        );
      }
      const overflow = signed
        ? BigInt.asIntN(bits, product) !== product
        : high !== 0n;
      state.flags = {
        CF: overflow,
        OF: overflow,
        ZF: null,
        SF: null,
        PF: null,
        AF: null,
      };
      break;
    }
    case "DIV":
    case "IDIV": {
      const signed = instruction.mnemonic === "IDIV";
      const low =
        bits === 64 ? "rax" : bits === 32 ? "eax" : bits === 16 ? "ax" : "al";
      const high =
        bits === 64 ? "rdx" : bits === 32 ? "edx" : bits === 16 ? "dx" : "ah";
      const raw =
        (readRegister(state, high) << BigInt(bits)) | readRegister(state, low);
      const dividend = signed ? BigInt.asIntN(bits * 2, raw) : raw;
      const divisor = signed
        ? BigInt.asIntN(bits, value())
        : BigInt.asUintN(bits, value());
      if (!divisor) throw new CpuError("Divisão por zero.");
      const quotient = dividend / divisor;
      const min = signed ? -(1n << BigInt(bits - 1)) : 0n,
        max = signed
          ? (1n << BigInt(bits - 1)) - 1n
          : (1n << BigInt(bits)) - 1n;
      if (quotient < min || quotient > max)
        throw new CpuError("Quociente fora da largura do destino.");
      writeRegister(state, low, quotient);
      writeRegister(state, high, dividend % divisor);
      state.flags = {
        CF: null,
        OF: null,
        ZF: null,
        SF: null,
        PF: null,
        AF: null,
      };
      break;
    }
    case "PUSH":
      push(
        state,
        value(),
        a?.kind === "immediate" ? (state.mode === "x86-64" ? 64 : 32) : bits,
      );
      break;
    case "POP":
      write(a, pop(state, bits), state, program, bits);
      break;
    case "CALL": {
      const target = readOperand(a, state, program, bits);
      const api = Object.entries(program.labels).find(
        ([name, address]) =>
          address === target && address >= 0xff000000n && address < 0xff000100n,
      )?.[0];
      if (api) {
        state.output.push(`Chamada modelada: ${api}`);
        if (api === "exitprocess" || api === "fatalexit") state.halted = true;
        else
          writeRegister(
            state,
            state.mode === "x86-64" ? "eax" : "eax",
            api === "deletefilea" ? 0n : 1n,
          );
      } else {
        push(state, next);
        state.frames.push({
          label: a?.kind === "label" ? a.name : hex(target),
          returnAddress: next,
        });
        state.ip = target;
        jumped = true;
      }
      break;
    }
    case "RET":
      if (
        !state.frames.length &&
        readRegister(state, state.mode === "x86-64" ? "rsp" : "esp") ===
          0x201000n
      )
        state.halted = true;
      else {
        state.ip = pop(state);
        state.frames.pop();
        jumped = true;
      }
      break;
    case "JMP":
      state.ip = readOperand(a, state, program, bits);
      jumped = true;
      break;
    case "NOP":
      break;
    case "XCHG": {
      if (
        a?.kind === "register" &&
        b?.kind === "register" &&
        a.name === b.name &&
        (a.name === "eax" || a.name === "ax")
      )
        break;
      const x = value(),
        y = other();
      write(a, y, state, program, bits);
      write(b, x, state, program, bits);
      break;
    }
    case "INT3":
      state.output.push("INT3: ponto de parada atingido.");
      state.halted = true;
      break;
    case "JCXZ":
    case "JECXZ":
    case "JRCXZ": {
      const name =
        instruction.mnemonic === "JCXZ"
          ? "cx"
          : instruction.mnemonic === "JECXZ"
            ? "ecx"
            : "rcx";
      if (readRegister(state, name) === 0n) {
        state.ip = readOperand(a, state, program, bits);
        jumped = true;
      }
      break;
    }
    default:
      if (!instruction.mnemonic.startsWith("J"))
        throw new CpuError("Instrução não suportada.");
      if (jumpCondition(instruction.mnemonic, state)) {
        state.ip = readOperand(a, state, program, bits);
        jumped = true;
      }
  }
  state.steps++;
  if (!jumped) state.ip = next;
  if (state.ip === program.end) state.halted = true;
  return state;
}
export function runCpu(
  program: Program,
  state = createCpu(program),
  limit = 5000,
): CpuState {
  for (let count = 0; !state.halted && count < limit; count++)
    stepCpu(program, state);
  if (!state.halted) throw new CpuError("Limite de execução atingido.");
  return state;
}
export function cpuSnapshot(state: CpuState): CpuSnapshot {
  const top = readRegister(state, state.mode === "x86-64" ? "rsp" : "esp");
  return {
    mode: state.mode,
    registers: Object.fromEntries(
      registerNames(state.mode).map((name) => [
        name,
        hex(readRegister(state, name), state.mode === "x86-64" ? 64 : 32),
      ]),
    ),
    flags: { ...state.flags },
    ip: hex(state.ip, state.mode === "x86-64" ? 64 : 32),
    memory: [
      {
        address: hex(top),
        bytes: Array.from(
          { length: 128 },
          (_, index) => state.memory.get(top + BigInt(index)) ?? 0,
        ),
      },
      {
        address: "0x00300000",
        bytes: Array.from(
          { length: 128 },
          (_, index) => state.memory.get(0x300000n + BigInt(index)) ?? 0,
        ),
      },
    ],
    steps: state.steps,
    halted: state.halted,
    output: state.output.slice(-20),
  };
}
