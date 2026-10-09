"use client";
import { useState } from "react";
import { HexViewer } from "./HexViewer";
import { unsignedValue } from "@nucleo/models";
export function MemoryBench() {
  const [items, setItems] = useState<Array<{ name: string; value: number }>>([
    { name: "x", value: 5 },
    { name: "y", value: 3 },
  ]);
  const [selected, setSelected] = useState(0);
  const [count, setCount] = useState(0);
  const bytes = new Uint8Array(64);
  const view = new DataView(bytes.buffer);
  items.forEach((item, index) => view.setUint32(index * 4, item.value, true));
  const push = () => {
    if (items.length >= 12) return;
    setCount((value) => value + 1);
    setItems([
      ...items,
      { name: `local_${count + 1}`, value: items.length + 1 },
    ]);
  };
  return (
    <div className="concept-bench">
      <div className="bench-heading">
        <span className="overline">MEMÓRIA / ENDEREÇOS</span>
        <h3>
          Uma variável tem um valor.
          <br />E um lugar.
        </h3>
      </div>
      <div className="memory-controls">
        <button
          className="button button-small"
          onClick={push}
          disabled={items.length >= 12}
        >
          Alocar uma variável
        </button>
        <button
          className="button button-secondary button-small"
          onClick={() => setItems(items.slice(0, -1))}
          disabled={items.length < 2}
        >
          Remover a última
        </button>
      </div>
      <div className="memory-variables">
        {items.map((item, index) => (
          <div className={selected === index ? "selected" : ""} key={item.name}>
            <button onClick={() => setSelected(index)}>
              <span>{item.name}</span>
              <code>0x{(0x300000 + index * 4).toString(16).toUpperCase()}</code>
            </button>
            <input
              aria-label={`Valor da variável ${item.name}`}
              type="number"
              value={item.value}
              onChange={(event) =>
                setItems(
                  items.map((row, i) =>
                    i === index
                      ? { ...row, value: Number(event.target.value) || 0 }
                      : row,
                  ),
                )
              }
            />
            <small>DWORD · 4 bytes</small>
          </div>
        ))}
      </div>
      <div className="pointer-explanation">
        <span className="mono">PONTEIRO p</span>
        <strong>
          0x{(0x300000 + selected * 4).toString(16).toUpperCase()}
        </strong>
        <span>aponta para {items[selected]?.name ?? "memória liberada"}</span>
        <p>
          O endereço é a localização. Os quatro bytes guardados ali representam{" "}
          <strong>
            {unsignedValue(
              bytes.slice(selected * 4, selected * 4 + 4),
            ).toString()}
          </strong>{" "}
          sem sinal.
        </p>
      </div>
      <HexViewer
        bytes={bytes}
        base={0x300000}
        highlight={{ offset: selected * 4, size: 4 }}
        onSelect={(offset) => setSelected(Math.floor(offset / 4))}
      />
    </div>
  );
}
