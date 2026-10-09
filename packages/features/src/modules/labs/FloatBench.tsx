"use client";

import { useId, useState } from "react";
import { ArrowRight, CornerDownLeft } from "lucide-react";
import { Link } from "@nucleo/platform";
import { encodeFloat32, inspectFloat32, formatFloat } from "@nucleo/models";

const presets = [
  { label: "0.1", bits: encodeFloat32(0.1).bits },
  { label: "1", bits: 0x3f800000 },
  { label: "−0", bits: 0x80000000 },
  { label: "Subnormal", bits: 1 },
  { label: "+∞", bits: 0x7f800000 },
  { label: "NaN", bits: 0x7fc00000 },
];
function bitField(bit: number) {
  return bit === 31
    ? { name: "Sinal", key: "sign" }
    : bit >= 23
      ? { name: "Expoente", key: "exponent" }
      : { name: "Fração", key: "fraction" };
}

export function FloatBench() {
  const inputId = useId();
  const [bits, setBits] = useState(encodeFloat32(0.1).bits);
  const [input, setInput] = useState("0.1");
  const [error, setError] = useState("");
  const [selectedBit, setSelectedBit] = useState<number | null>(null);
  const result = inspectFloat32(bits);
  const ordinary =
    result.category === "normal" || result.category === "subnormal";
  const exponent = result.exponent === 0 ? -126 : result.exponent - 127;
  const mantissa = (result.exponent === 0 ? 0 : 1) + result.fraction / 2 ** 23;
  const exact = Object.is(Number(input), result.value);
  const change = (value: number) => {
    setBits(value >>> 0);
    setInput(formatFloat(inspectFloat32(value).value));
    setError("");
  };
  const convert = () => {
    const value = Number(input);
    if (
      !input.trim() ||
      (Number.isNaN(value) && input.trim().toLowerCase() !== "nan")
    ) {
      setError("Digite um número decimal, Infinity ou NaN.");
      return;
    }
    setBits(encodeFloat32(value).bits);
    setSelectedBit(null);
    setError("");
  };
  return (
    <div className="concept-bench float-bench">
      <header className="float-heading">
        <span className="overline">IEEE 754 · PRECISÃO SIMPLES</span>
        <h3>O que cabe em 32 bits.</h3>
        <p>
          Um sinal, um expoente e uma fração. Mude um bit e acompanhe o número.
        </p>
      </header>
      <div className="float-conversion">
        <form
          className="float-entry"
          onSubmit={(event) => {
            event.preventDefault();
            convert();
          }}
        >
          <label htmlFor={inputId}>Você escreve</label>
          <div>
            <input
              id={inputId}
              aria-label="Valor decimal"
              value={input}
              maxLength={60}
              spellCheck={false}
              autoComplete="off"
              onChange={(event) => setInput(event.target.value)}
            />
            <button aria-label="Representar número" title="Representar · Enter">
              <CornerDownLeft size={19} />
            </button>
          </div>
          <span>Decimal · pressione Enter para converter</span>
        </form>
        <ArrowRight
          className="float-conversion-arrow"
          size={20}
          aria-hidden="true"
        />
        <div className="float-result" aria-live="polite" aria-atomic="true">
          <span>
            O computador armazena <small>{result.category.toUpperCase()}</small>
          </span>
          <strong>{formatFloat(result.value)}</strong>
          <code>0x{bits.toString(16).padStart(8, "0").toUpperCase()}</code>
          <p>
            {ordinary && !exact
              ? "O valor foi arredondado para o binary32 mais próximo."
              : result.category === "NaN"
                ? "Uma representação para um resultado que não é um número."
                : result.category === "infinito"
                  ? "Expoente reservado para os valores especiais."
                  : "Este valor tem representação exata em binary32."}
          </p>
        </div>
      </div>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      <div
        className="float-presets"
        role="group"
        aria-label="Casos de ponto flutuante"
      >
        <span>Experimente</span>
        {presets.map((preset) => (
          <button
            key={preset.label}
            aria-pressed={bits === preset.bits}
            onClick={() => {
              change(preset.bits);
              setSelectedBit(null);
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <section
        className="float-word-section"
        aria-label="Representação binária editável"
      >
        <header>
          <span>OS 32 BITS</span>
          <span className="float-legend" aria-hidden="true">
            <span className="sign">
              <i />
              Sinal <small>31</small>
            </span>
            <span className="exponent">
              <i />
              Expoente <small>30–23</small>
            </span>
            <span className="fraction">
              <i />
              Fração <small>22–0</small>
            </span>
          </span>
          <span>Selecione um bit para inverter 0 ↔ 1</span>
        </header>
        <div className="float-word">
          {[0, 1, 2, 3].map((byte) => (
            <div className="float-byte" key={byte}>
              <span className="float-byte-range">
                {31 - byte * 8} — {24 - byte * 8}
              </span>
              <div>
                {Array.from({ length: 8 }, (_, index) => {
                  const bit = 31 - byte * 8 - index;
                  const field = bitField(bit);
                  const on = Boolean((bits >>> bit) & 1);
                  return (
                    <button
                      key={bit}
                      className={`float-bit ${field.key}`}
                      aria-label={`Bit ${bit}, ${field.name}`}
                      aria-pressed={on}
                      data-selected={bit === selectedBit}
                      onClick={() => {
                        setSelectedBit(bit);
                        change((bits ^ (1 << bit)) >>> 0);
                      }}
                    >
                      <span>{on ? "1" : "0"}</span>
                      <small>{bit}</small>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="float-bit-hint" aria-live="polite">
          {selectedBit === null
            ? "Do bit mais significativo (31) ao menos significativo (0)."
            : `Bit ${selectedBit} · ${bitField(selectedBit).name.toLowerCase()} · agora ${(bits >>> selectedBit) & 1}${selectedBit < 23 ? ` · peso 2^(${selectedBit} − 23) na fração` : ""}`}
        </p>
      </section>
      <div className="float-fields">
        <div className="sign">
          <span>
            <i />
            Sinal <small>1 bit</small>
          </span>
          <strong>{result.sign === 0 ? "+" : "−"}</strong>
          <p>{result.sign === 0 ? "Bit 0 · positivo" : "Bit 1 · negativo"}</p>
        </div>
        <div className="exponent">
          <span>
            <i />
            Expoente <small>8 bits</small>
          </span>
          <strong>{result.exponent}</strong>
          <p>
            {result.exponent === 255
              ? "255 · valor especial"
              : result.exponent === 0
                ? "0 · expoente efetivo −126"
                : `${result.exponent} − 127 = ${exponent}`}
          </p>
        </div>
        <div className="fraction">
          <span>
            <i />
            Fração <small>23 bits</small>
          </span>
          <strong>{result.fraction.toLocaleString("pt-BR")}</strong>
          <p>
            {ordinary
              ? `Significando: ${formatFloat(mantissa)}`
              : result.category === "NaN"
                ? "Fração não nula · payload de NaN"
                : "Todos os bits da fração são zero"}
          </p>
        </div>
      </div>
      <div className="float-formula">
        <span>O número reconstruído</span>
        {ordinary ? (
          <p>
            <span className="sign">{result.sign ? "−1" : "+1"}</span>
            <span>×</span>
            <span className="float-significand">
              ({result.exponent === 0 ? "0" : "1"} +{" "}
              <span className="float-ratio">
                <span className="fraction">{result.fraction}</span>
                <span>
                  2<sup>23</sup>
                </span>
              </span>
              )
            </span>
            <span>×</span>
            <span>
              2<sup className="exponent">{exponent}</sup>
            </span>
          </p>
        ) : (
          <p className="float-special">
            {result.category === "zero"
              ? "Expoente 0 + fração 0 = zero com sinal"
              : result.category === "NaN"
                ? "Expoente 255 + fração não nula = NaN"
                : "Expoente 255 + fração 0 = infinito com sinal"}
          </p>
        )}
        {ordinary && (
          <small>
            O sinal multiplica o significando completo; o expoente define a
            escala.
          </small>
        )}
      </div>
      <footer className="float-storage">
        <div>
          <span>NA MEMÓRIA</span>
          <p>4 bytes · little-endian</p>
        </div>
        <div className="float-storage-bytes">
          {Array.from(result.bytes).map((byte, index) => (
            <span key={index}>
              <small>+{index}</small>
              <code>{byte.toString(16).padStart(2, "0").toUpperCase()}</code>
            </span>
          ))}
        </div>
        <Link href="/playground/hex" aria-label="Explorar bytes no Hex Viewer">
          <ArrowRight size={18} />
        </Link>
      </footer>
    </div>
  );
}
