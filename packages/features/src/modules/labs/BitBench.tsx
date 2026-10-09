"use client";
import { useState } from "react";
import { rotate } from "@nucleo/models";
import { Select } from "@nucleo/features/components/Select";

const operations = [
  { value: "AND", label: "AND", description: "1 quando os dois bits são 1" },
  { value: "OR", label: "OR", description: "1 quando pelo menos um bit é 1" },
  {
    value: "XOR",
    label: "XOR",
    description: "1 quando os bits são diferentes",
  },
  { value: "NOT", label: "NOT", description: "Inverte cada bit de A" },
  { value: "SHL", label: "SHL", description: "Desloca A para a esquerda" },
  { value: "SHR", label: "SHR", description: "Desloca A para a direita" },
  { value: "ROL", label: "ROL", description: "Rotaciona A para a esquerda" },
  { value: "ROR", label: "ROR", description: "Rotaciona A para a direita" },
];
export function BitBench({ initial = "0x85" }: { initial?: string }) {
  const [a, setA] = useState(initial),
    [b, setB] = useState("0x0C");
  const [width, setWidth] = useState(8),
    [operation, setOperation] = useState("XOR");
  let left = 0n,
    right = 0n,
    error = "";
  try {
    left = BigInt.asUintN(width, BigInt(a || "0"));
    right = BigInt(b || "0");
  } catch {
    error = "Use um número decimal, 0x para hexadecimal ou 0b para binário.";
  }
  const shifts = ["SHL", "SHR", "ROL", "ROR"].includes(operation);
  const count = Number(BigInt.asUintN(width === 64 ? 6 : 5, right));
  const raw =
    operation === "AND"
      ? left & right
      : operation === "OR"
        ? left | right
        : operation === "XOR"
          ? left ^ right
          : operation === "NOT"
            ? ~left
            : operation === "SHL"
              ? left << BigInt(count)
              : operation === "SHR"
                ? left >> BigInt(count)
                : rotate(
                    left,
                    count,
                    width,
                    operation === "ROL" ? "left" : "right",
                  );
  const result = BigInt.asUintN(width, raw);
  const format = (value: bigint) =>
    `0x${BigInt.asUintN(width, value)
      .toString(16)
      .toUpperCase()
      .padStart(width / 4, "0")}`;
  return (
    <div className="concept-bench bit-bench">
      <div className="bench-heading">
        <span className="overline">REPRESENTAÇÃO / OPERAÇÕES</span>
        <h3>
          O mesmo dado.
          <br />
          Outros pontos de vista.
        </h3>
        <p>Altere um valor ou toque nos bits para ver o resultado.</p>
      </div>
      <div className="bit-inputs">
        <label>
          Operando A
          <input
            value={a}
            onChange={(event) => setA(event.target.value)}
            maxLength={24}
            spellCheck={false}
          />
        </label>
        <label>
          {shifts ? "Deslocamento" : "Operando B"}
          <input
            value={b}
            onChange={(event) => setB(event.target.value)}
            maxLength={24}
            disabled={operation === "NOT"}
            spellCheck={false}
          />
        </label>
        <div className="bit-width">
          <span>Largura</span>
          <Select
            label="Largura"
            value={String(width)}
            onChange={(value) => setWidth(Number(value))}
            options={[8, 16, 32, 64].map((value) => ({
              value: String(value),
              label: `${value} bits`,
            }))}
          />
        </div>
      </div>
      {error ? (
        <p className="error-text" role="alert">
          {error}
        </p>
      ) : (
        <>
          <div className="bit-word" aria-label="Bits do operando A">
            {Array.from({ length: width / 8 }, (_, byte) => (
              <div className="bit-byte" key={byte}>
                <span>
                  {width - byte * 8 - 1} — {width - byte * 8 - 8}
                </span>
                <div>
                  {Array.from({ length: 8 }, (_, index) => {
                    const position = width - byte * 8 - index - 1;
                    const on = Boolean((left >> BigInt(position)) & 1n);
                    return (
                      <button
                        key={position}
                        aria-label={`Alternar bit ${position}`}
                        aria-pressed={on}
                        onClick={() =>
                          setA(format(left ^ (1n << BigInt(position))))
                        }
                      >
                        <strong>{on ? "1" : "0"}</strong>
                        <small>{position}</small>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <dl className="bit-representations">
            <div>
              <dt>Hexadecimal</dt>
              <dd>{format(left)}</dd>
            </div>
            <div>
              <dt>Sem sinal</dt>
              <dd>{left.toString()}</dd>
            </div>
            <div>
              <dt>Com sinal</dt>
              <dd>{BigInt.asIntN(width, left).toString()}</dd>
            </div>
          </dl>
          <section className="bit-operation" aria-label="Operação e resultado">
            <div className="bit-operation-heading">
              <span>Aplicar operação</span>
              <Select
                label="Operação de bits"
                value={operation}
                onChange={setOperation}
                options={operations}
              />
            </div>
            <div className="bit-calculation">
              <code>
                {operation === "NOT"
                  ? `NOT ${format(left)}`
                  : `${format(left)} ${operation} ${shifts ? count : format(right)}`}
              </code>
              <span>=</span>
            </div>
            <div className="bit-result" aria-live="polite">
              <span>RESULTADO · {width} BITS</span>
              <strong>{format(result)}</strong>
              <p>
                {result.toString()} sem sinal <span>·</span>{" "}
                {BigInt.asIntN(width, result).toString()} com sinal
              </p>
            </div>
            {shifts && (
              <p className="bit-operation-note">
                Contagem após máscara x86: {count}.{" "}
                {operation === "ROL" || operation === "ROR"
                  ? `A rotação usa essa contagem módulo ${width}.`
                  : "Os bits que ultrapassam a largura são descartados."}
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
