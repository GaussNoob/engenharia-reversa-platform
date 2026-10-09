"use client";
import { SyntaxCode } from "@nucleo/features/components/CodeSnippet";
import { Select } from "@nucleo/features/components/Select";
import { useState } from "react";
import {
  createCpu,
  parseProgram,
  stepCpu,
  readRegister,
  type CpuState,
} from "@nucleo/models";
import { StepForward, RotateCcw, FastForward, Check, X } from "lucide-react";
function source(a: number, b: number, signed: boolean) {
  return `mov al, ${a}\nmov bl, ${b}\ncmp al, bl\n${signed ? "jg" : "ja"} maior\nmov dl, 0\njmp fim\nmaior:\nmov dl, 1\nfim:\nnop`;
}
const comparison = (a: number, b: number, signed: boolean) =>
  parseProgram(source(a, b, signed));
const clone = (cpu: CpuState): CpuState => ({
  ...cpu,
  registers: { ...cpu.registers },
  flags: { ...cpu.flags },
  memory: new Map(cpu.memory),
  frames: [...cpu.frames],
  changes: [],
  output: [...cpu.output],
});
const flagNames = {
  ZF: "Zero: A − B resultou em 0",
  CF: "Carry: houve empréstimo sem sinal",
  SF: "Sinal: o bit 7 do resultado é 1",
  OF: "Overflow: estouro com sinal",
} as const;
type NodeState = "done" | "current" | "skipped" | "pending";
const byte = (value: number) => Number(BigInt.asUintN(8, BigInt(value)));
const hex = (value: number) =>
  `0x${byte(value).toString(16).toUpperCase().padStart(2, "0")}`;
const bits = (value: number) => byte(value).toString(2).padStart(8, "0");

function Operand({
  name,
  value,
  signed,
}: {
  name: string;
  value: number;
  signed: boolean;
}) {
  const unsigned = byte(value);
  const withSign = Number(BigInt.asIntN(8, BigInt(value)));
  return (
    <div className="branch-operand">
      <span className="branch-operand-name">{name}</span>
      <code className="branch-operand-bits" aria-label={`Bits de ${name}`}>
        <b>{bits(value)[0]}</b>
        {bits(value).slice(1)}
      </code>
      <span className="branch-operand-hex">{hex(value)}</span>
      <span className={`branch-reading ${signed ? "active" : ""}`}>
        <small>com sinal</small>
        {withSign}
      </span>
      <span className={`branch-reading ${signed ? "" : "active"}`}>
        <small>sem sinal</small>
        {unsigned}
      </span>
    </div>
  );
}

export function BranchBench() {
  const [a, setA] = useState(-1),
    [b, setB] = useState(1),
    [signed, setSigned] = useState(true);
  const [cpu, setCpu] = useState(() => createCpu(comparison(-1, 1, true)));
  const [executed, setExecuted] = useState<number[]>([]);
  const program = comparison(a, b, signed);
  const [error, setError] = useState("");
  const reset = (nextA = a, nextB = b, nextSigned = signed) => {
    setA(nextA);
    setB(nextB);
    setSigned(nextSigned);
    setCpu(createCpu(comparison(nextA, nextB, nextSigned)));
    setExecuted([]);
    setError("");
  };
  const indexAt = (state: CpuState) =>
    program.instructions.findIndex(
      (instruction) => instruction.address === state.ip,
    );
  const advance = (state: CpuState, trail: number[]) => {
    const index = indexAt(state);
    return { cpu: stepCpu(program, clone(state)), trail: [...trail, index] };
  };
  const step = () => {
    try {
      const next = advance(cpu, executed);
      setCpu(next.cpu);
      setExecuted(next.trail);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Instrução inválida.");
    }
  };
  const runAll = () => {
    try {
      let next = { cpu, trail: executed };
      for (let guard = 0; !next.cpu.halted && guard < 32; guard++)
        next = advance(next.cpu, next.trail);
      setCpu(next.cpu);
      setExecuted(next.trail);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Instrução inválida.");
    }
  };
  const current = cpu.halted ? -1 : indexAt(cpu);
  const compared = executed.includes(2),
    branched = executed.includes(3);
  const taken = signed
    ? !cpu.flags.ZF && cpu.flags.SF === cpu.flags.OF
    : !cpu.flags.CF && !cpu.flags.ZF;
  const conditions = signed
    ? [
        { label: "ZF = 0", ok: !cpu.flags.ZF },
        { label: "SF = OF", ok: cpu.flags.SF === cpu.flags.OF },
      ]
    : [
        { label: "CF = 0", ok: !cpu.flags.CF },
        { label: "ZF = 0", ok: !cpu.flags.ZF },
      ];
  // Node index -> instruction indexes it represents.
  const nodeState = (instructions: number[], branch?: "taken" | "fall") => {
    if (instructions.some((index) => index === current)) return "current";
    if (instructions.some((index) => executed.includes(index))) return "done";
    if (branch && branched && (branch === "taken" ? !taken : taken))
      return "skipped";
    return "pending";
  };
  const states: Record<string, NodeState> = {
    compare: nodeState([0, 1, 2]),
    decision: nodeState([3]),
    fall: nodeState([4, 5], "fall"),
    jump: nodeState([6], "taken"),
    end: nodeState([7]),
  };
  const path = (side: "taken" | "fall") =>
    !branched ? "" : (side === "taken") === taken ? "active" : "muted";
  const jump = signed ? "JG" : "JA";
  const lines = source(a, b, signed).split("\n");
  let instruction = -1;
  return (
    <div className="concept-bench branch-bench">
      <div className="bench-heading">
        <span className="overline">COMPARAÇÃO / 8 BITS</span>
        <h3>Qual caminho a CPU segue?</h3>
        <p>
          Os mesmos bits podem representar valores com ou sem sinal. A instrução
          de salto escolhe qual leitura usar.
        </p>
      </div>
      <div className="bench-fields">
        <label>
          A
          <input
            type="number"
            min="-128"
            max="255"
            value={a}
            onChange={(event) =>
              reset(Math.min(255, Math.max(-128, Number(event.target.value))))
            }
          />
        </label>
        <label>
          B
          <input
            type="number"
            min="-128"
            max="255"
            value={b}
            onChange={(event) =>
              reset(
                a,
                Math.min(255, Math.max(-128, Number(event.target.value))),
              )
            }
          />
        </label>
        <label>
          Interpretação
          <Select
            label="Interpretação"
            value={signed ? "signed" : "unsigned"}
            onChange={(value) => reset(a, b, value === "signed")}
            options={[
              { value: "signed", label: "Com sinal / JG" },
              { value: "unsigned", label: "Sem sinal / JA" },
            ]}
          />
        </label>
      </div>
      <div className="branch-operands">
        <Operand name="AL" value={a} signed={signed} />
        <Operand name="BL" value={b} signed={signed} />
      </div>
      <div className="branch-layout">
        <section className="branch-program" aria-label="Programa">
          <header className="mono">PROGRAMA</header>
          <ol>
            {lines.map((line, row) => {
              const label = line.endsWith(":");
              if (!label) instruction++;
              const index = label ? -2 : instruction;
              const state =
                index === current
                  ? "current"
                  : executed.includes(index)
                    ? "done"
                    : "";
              return (
                <li
                  key={row}
                  className={`${state} ${label ? "label" : ""}`}
                  aria-current={state === "current" ? "step" : undefined}
                >
                  <span className="branch-gutter" aria-hidden="true">
                    {state === "current" ? "▶" : state === "done" ? "✓" : ""}
                  </span>
                  <SyntaxCode source={line} language="assembly" />
                </li>
              );
            })}
          </ol>
          <div className="branch-flags">
            {(["ZF", "CF", "SF", "OF"] as const).map((flag) => (
              <span
                key={flag}
                className={compared && cpu.flags[flag] ? "on" : ""}
                title={flagNames[flag]}
              >
                {flag}
                <strong>{compared ? Number(cpu.flags[flag]) : "—"}</strong>
              </span>
            ))}
          </div>
        </section>
        <div className="branch-flow" aria-label="Fluxo de controle">
          <div className={`flow-node flow-compare ${states.compare}`}>
            <SyntaxCode source="CMP AL, BL" language="assembly" />
            <span>Calcula A − B e atualiza as flags</span>
          </div>
          <div className={`flow-connection ${compared ? "active" : ""}`} />
          <div className={`flow-node flow-decision ${states.decision}`}>
            <SyntaxCode source={`${jump} maior`} language="assembly" />
            <span className="flow-conditions">
              {conditions.map((condition, index) => (
                <span
                  key={condition.label}
                  className={
                    compared ? (condition.ok ? "ok" : "fail") : undefined
                  }
                >
                  {index > 0 && <i>e</i>}
                  {condition.label}
                  {compared &&
                    (condition.ok ? <Check size={12} /> : <X size={12} />)}
                </span>
              ))}
            </span>
          </div>
          <svg
            className="flow-lines"
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path className={path("fall")} d="M50 0 V16 H25 V40" />
            <path className={path("taken")} d="M50 0 V16 H75 V40" />
          </svg>
          <div className="flow-fork">
            <div className={branched && !taken ? "taken" : ""}>
              <span className="flow-label">Não desvia · condição falsa</span>
              <div className={`flow-node ${states.fall}`}>
                <SyntaxCode source="MOV DL, 0" language="assembly" />
                <small>A não é maior que B</small>
              </div>
            </div>
            <div className={branched && taken ? "taken" : ""}>
              <span className="flow-label">Desvia para maior</span>
              <div className={`flow-node ${states.jump}`}>
                <SyntaxCode source="MOV DL, 1" language="assembly" />
                <small>A é maior que B</small>
              </div>
            </div>
          </div>
          <svg
            className="flow-lines flow-merge"
            viewBox="0 0 100 32"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path className={path("fall")} d="M25 0 V16 H50 V32" />
            <path className={path("taken")} d="M75 0 V16 H50 V32" />
          </svg>
          <div className={`flow-node flow-end ${states.end}`}>
            <SyntaxCode source="fim: NOP" language="assembly" />
            <span>
              {cpu.halted
                ? `DL = ${readRegister(cpu, "dl")}`
                : "Os dois caminhos se encontram"}
            </span>
          </div>
        </div>
      </div>
      <div className="branch-toolbar">
        <button
          className="button button-small"
          onClick={step}
          disabled={cpu.halted}
        >
          <StepForward size={15} />
          Avançar instrução
        </button>
        <button
          className="button button-small button-secondary"
          onClick={runAll}
          disabled={cpu.halted}
        >
          <FastForward size={15} />
          Executar até o fim
        </button>
        <button
          className="icon-button"
          aria-label="Reiniciar comparação"
          title="Reiniciar"
          onClick={() => reset()}
        >
          <RotateCcw size={16} />
        </button>
      </div>
      <div className="branch-current" aria-live="polite">
        <span className="mono">
          {cpu.halted
            ? "CONCLUÍDO"
            : `PRÓXIMA / ${program.instructions[current]?.source.toUpperCase()}`}
        </span>
        <p>
          {cpu.halted
            ? `DL = ${readRegister(cpu, "dl")}. ${taken ? `${jump} desviou: as condições foram satisfeitas.` : `${jump} não desviou: ao menos uma condição falhou.`}`
            : !compared
              ? `${cpu.steps} de 3 instruções até a comparação. CMP preserva AL e BL; só as flags mudam.`
              : !branched
                ? `As flags estão prontas. ${jump} vai ${taken ? "desviar" : "seguir em frente"}.`
                : `${cpu.steps} instruções executadas.`}
        </p>
      </div>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
    </div>
  );
}
