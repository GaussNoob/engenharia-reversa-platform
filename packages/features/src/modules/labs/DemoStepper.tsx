"use client";
import { SyntaxCode } from "@nucleo/features/components/CodeSnippet";
import { useState } from "react";
import { Play, RotateCcw, StepForward } from "lucide-react";
import {
  parseProgram,
  createCpu,
  stepCpu,
  hex,
  type CpuState,
} from "@nucleo/models";
const source = "mov rax, 0x05\nadd rax, 0x03\nmov rbx, rax\nxor rcx, rcx";
const program = parseProgram(source);
const clone = (state: CpuState): CpuState => ({
  ...state,
  registers: { ...state.registers },
  flags: { ...state.flags },
  memory: new Map(state.memory),
  frames: [...state.frames],
  output: [...state.output],
  changes: [],
});
export function DemoStepper({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState(() => createCpu(program));
  const step = () => setState((previous) => stepCpu(program, clone(previous)));
  const reset = () => setState(createCpu(program));
  return (
    <div className={`demo-machine ${compact ? "compact" : ""}`}>
      <div className="window-bar">
        <span className="window-label">
          <span className="tiny-square" />
          primeiros-passos.asm
        </span>
        <span className="mono subtle">x86-64</span>
      </div>
      <div className="demo-body">
        <div className="demo-code">
          {program.instructions.map((instruction, index) => (
            <div
              className={
                instruction.address === state.ip && !state.halted
                  ? "instruction-line current"
                  : "instruction-line"
              }
              key={instruction.line}
            >
              <span className="line-no">
                {String(index + 1).padStart(2, "0")}
              </span>
              <SyntaxCode source={instruction.source} language="assembly" />
              <span className="instruction-byte">
                {instruction.bytes
                  .map((byte) => byte.toString(16).padStart(2, "0"))
                  .join(" ")}
              </span>
            </div>
          ))}
          <div className="code-comment">
            ; observe o estado a cada instrução
          </div>
        </div>
        <div className="demo-registers">
          {["rax", "rbx", "rcx"].map((name) => (
            <div
              key={name}
              className={
                state.changes.includes(name.toUpperCase())
                  ? "register-preview changed"
                  : "register-preview"
              }
            >
              <span className="mono">{name.toUpperCase()}</span>
              <strong>{hex(state.registers[name] ?? 0n).slice(2)}</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="demo-controls">
        <button
          className="button button-small"
          onClick={step}
          disabled={state.halted}
        >
          <StepForward size={15} />
          Avançar instrução
        </button>
        <button
          className="icon-button"
          aria-label="Resetar demonstração"
          onClick={reset}
        >
          <RotateCcw size={16} />
        </button>
        <span className="mono subtle">
          {state.halted ? "Fim do trecho" : `RIP ${hex(state.ip)}`}
        </span>
      </div>
    </div>
  );
}
