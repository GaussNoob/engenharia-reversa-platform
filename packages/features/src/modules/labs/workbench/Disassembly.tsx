"use client";
import { SyntaxCode } from "@nucleo/features/components/CodeSnippet";
import { useMemo } from "react";
import { parseProgram, hex, type CpuState, type Mode } from "@nucleo/models";
export function Disassembly({
  code,
  mode,
  cpu,
  breakpoints,
  onBreakpoint,
}: {
  code: string;
  mode: Mode;
  cpu?: CpuState;
  breakpoints: number[];
  onBreakpoint: (line: number) => void;
}) {
  const parsed = useMemo(() => {
    try {
      return { program: parseProgram(code, mode), error: "" };
    } catch (cause) {
      return {
        program: null,
        error: cause instanceof Error ? cause.message : "Instrução inválida.",
      };
    }
  }, [code, mode]);
  if (!parsed.program) return <p className="workbench-error">{parsed.error}</p>;
  return (
    <div className="disassembly-panel">
      <div className="disassembly-header">
        <span>PARADA</span>
        <span>ENDEREÇO / BYTES</span>
        <span>INSTRUÇÃO</span>
      </div>
      {parsed.program.instructions.map((instruction) => (
        <div
          key={instruction.line}
          className={`disassembly-row ${instruction.address === (cpu?.ip ?? parsed.program!.entry) && !cpu?.halted ? "current" : ""}`}
        >
          <button
            className="breakpoint-toggle"
            aria-label={`Ponto de parada na linha ${instruction.line}`}
            aria-pressed={breakpoints.includes(instruction.line)}
            onClick={() => onBreakpoint(instruction.line)}
          >
            <span />
          </button>
          <div>
            <code>{hex(instruction.address)}</code>
            <small>
              {instruction.bytes
                .map((byte) => byte.toString(16).padStart(2, "0"))
                .join(" ")
                .toUpperCase()}
            </small>
          </div>
          <SyntaxCode source={instruction.source} language="assembly" />
        </div>
      ))}
      <p className="disassembly-note">
        Clique na primeira coluna para marcar uma parada. “Continuar” executa
        até a próxima parada ou o fim.
      </p>
    </div>
  );
}
