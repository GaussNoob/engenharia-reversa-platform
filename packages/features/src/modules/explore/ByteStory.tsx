"use client";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
const sample = 0x12345678;
export function ByteStory() {
  const [little, setLittle] = useState(true);
  const [selected, setSelected] = useState(0);
  const bytes = little ? [0x78, 0x56, 0x34, 0x12] : [0x12, 0x34, 0x56, 0x78];
  return (
    <div className="byte-story">
      <div className="byte-story-top">
        <span className="mono">UM VALOR. QUATRO BYTES.</span>
        <span className="tag">uint32_t</span>
      </div>
      <div className="byte-story-value">
        <span>0x</span>12345678
      </div>
      <div className="byte-connector" aria-hidden="true">
        <span />
        <ArrowRight size={17} />
        <span />
      </div>
      <div className="byte-story-cells">
        {bytes.map((byte, index) => (
          <button
            key={index}
            className={index === selected ? "selected" : ""}
            aria-pressed={index === selected}
            aria-label={`Offset ${index}, byte ${byte.toString(16)}`}
            onClick={() => setSelected(index)}
          >
            <span className="mono">+0{index}</span>
            <strong>{byte.toString(16).toUpperCase()}</strong>
            <small>{byte.toString(2).padStart(8, "0")}</small>
          </button>
        ))}
      </div>
      <div className="byte-story-bottom">
        <div role="group" aria-label="Ordem dos bytes">
          <button
            aria-pressed={little}
            className={little ? "active" : ""}
            onClick={() => setLittle(true)}
          >
            Little-endian
          </button>
          <button
            aria-pressed={!little}
            className={!little ? "active" : ""}
            onClick={() => setLittle(false)}
          >
            Big-endian
          </button>
        </div>
        <p aria-live="polite">
          Offset +{selected}:{" "}
          <strong>0x{bytes[selected]!.toString(16).toUpperCase()}</strong>.
          <br />O número continua sendo {sample.toLocaleString("pt-BR")}.
        </p>
      </div>
    </div>
  );
}
