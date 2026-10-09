"use client";
import { useState } from "react";
import {
  createCpu,
  parseProgram,
  stepCpu,
  type CpuState,
  type Mode,
  type Program,
} from "@nucleo/models";
export type Machine = { program: Program; cpu: CpuState; code: string };
export const cloneCpu = (state: CpuState): CpuState => ({
  ...state,
  registers: { ...state.registers },
  flags: { ...state.flags },
  memory: new Map(state.memory),
  frames: [...state.frames],
  changes: [],
  output: [...state.output],
});
export function useMachine(code: string, mode: Mode) {
  const [machine, setMachine] = useState<Machine | null>(null);
  const [breakpoints, setBreakpoints] = useState<number[]>([]);
  const [history, setHistory] = useState<
    Array<{ line: number; source: string; changes: string[] }>
  >([]);
  const [error, setError] = useState("");
  const current = () => {
    if (machine?.code === code && machine.program.mode === mode)
      return { ...machine, cpu: cloneCpu(machine.cpu) };
    const program = parseProgram(code, mode);
    return { code, program, cpu: createCpu(program) };
  };
  function step(kind: "into" | "over" | "continue" = "into") {
    setError("");
    try {
      const next = current();
      if (next.cpu.halted) return;
      const first = next.program.instructions.find(
        (item) => item.address === next.cpu.ip,
      );
      const target = first ? first.address + BigInt(first.length) : next.cpu.ip;
      const trace: typeof history = [];
      do {
        const instruction = next.program.instructions.find(
          (item) => item.address === next.cpu.ip,
        );
        stepCpu(next.program, next.cpu);
        if (instruction)
          trace.push({
            line: instruction.line,
            source: instruction.source,
            changes: [...next.cpu.changes],
          });
        if (next.cpu.halted || kind === "into") break;
        if (
          kind === "over" &&
          (first?.mnemonic !== "CALL" || next.cpu.ip === target)
        )
          break;
        const upcoming = next.program.instructions.find(
          (item) => item.address === next.cpu.ip,
        );
        if (upcoming && breakpoints.includes(upcoming.line)) break;
      } while (trace.length < 5000);
      setMachine(next);
      setHistory((previous) =>
        [...(machine?.code === code ? previous : []), ...trace].slice(-80),
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Não foi possível avançar.",
      );
    }
  }
  function reset() {
    setMachine(null);
    setHistory([]);
    setError("");
  }
  function toggleBreakpoint(line: number) {
    setBreakpoints((items) =>
      items.includes(line)
        ? items.filter((item) => item !== line)
        : [...items, line],
    );
  }
  const valid =
    machine?.code === code && machine.program.mode === mode ? machine : null;
  return {
    machine: valid,
    setMachine,
    breakpoints,
    toggleBreakpoint,
    history,
    error,
    step,
    reset,
  };
}
