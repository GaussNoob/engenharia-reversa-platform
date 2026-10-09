"use client";
import { Select } from "@nucleo/features/components/Select";
import { useState } from "react";
import { encodeText } from "@nucleo/models";
import { HexViewer } from "./HexViewer";
type Encoding = Parameters<typeof encodeText>[1];
export function EncodingBench() {
  const [text, setText] = useState("binária");
  const [encoding, setEncoding] = useState<Encoding>("utf-16-le");
  const [terminated, setTerminated] = useState(true);
  const [bom, setBom] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  let bytes: Uint8Array = new Uint8Array(),
    error = "",
    prefix: number[] = [];
  try {
    bytes = encodeText(text, encoding, terminated);
    if (bom) {
      prefix =
        encoding === "utf-8"
          ? [0xef, 0xbb, 0xbf]
          : encoding === "utf-16-le"
            ? [0xff, 0xfe]
            : encoding === "utf-16-be"
              ? [0xfe, 0xff]
              : encoding === "utf-32-le"
                ? [0xff, 0xfe, 0, 0]
                : encoding === "utf-32-be"
                  ? [0, 0, 0xfe, 0xff]
                  : [];
      bytes = Uint8Array.from([...prefix, ...bytes]);
    }
  } catch (cause) {
    error =
      cause instanceof Error ? cause.message : "Não foi possível codificar.";
  }
  // Byte range of each code point, so a character can be traced into the dump.
  const pieces: Array<{
    key: string;
    label: string;
    detail: string;
    offset: number;
    size: number;
    extra?: boolean;
    failed?: boolean;
  }> = [];
  let cursor = 0;
  if (prefix.length) {
    pieces.push({
      key: "bom",
      label: "BOM",
      detail: "marca",
      offset: 0,
      size: prefix.length,
      extra: true,
    });
    cursor = prefix.length;
  }
  for (const [index, char] of Array.from(text).entries()) {
    let size = 0,
      failed = false;
    try {
      size = encodeText(char, encoding, false).length;
    } catch {
      failed = true;
    }
    pieces.push({
      key: `c${index}`,
      label: char === " " ? "␠" : char,
      detail: `U+${char.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}`,
      offset: cursor,
      size,
      failed,
    });
    cursor += size;
  }
  if (terminated && bytes.length > cursor)
    pieces.push({
      key: "nul",
      label: "NUL",
      detail: "fim",
      offset: cursor,
      size: bytes.length - cursor,
      extra: true,
    });
  const active = selected === null ? undefined : pieces[selected];
  const hexOf = (piece: (typeof pieces)[number]) =>
    Array.from(bytes.slice(piece.offset, piece.offset + piece.size), (value) =>
      value.toString(16).padStart(2, "0").toUpperCase(),
    ).join(" ");
  return (
    <div className="concept-bench">
      <div className="bench-heading">
        <span className="overline">STRINGS / CODIFICAÇÃO</span>
        <h3>
          Texto também
          <br />é uma sequência de bytes.
        </h3>
      </div>
      <div className="bench-fields">
        <label>
          Texto
          <input
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setSelected(null);
            }}
            maxLength={256}
          />
        </label>
        <label>
          Codificação
          <Select
            label="Codificação"
            value={encoding}
            onChange={(value) => setEncoding(value as Encoding)}
            options={[
              "ascii",
              "latin-1",
              "utf-8",
              "utf-16-le",
              "utf-16-be",
              "utf-32-le",
              "utf-32-be",
            ].map((value) => ({ value, label: value.toUpperCase() }))}
          />
        </label>
      </div>
      <div className="bench-toggles">
        <label>
          <input
            type="checkbox"
            checked={terminated}
            onChange={(event) => setTerminated(event.target.checked)}
          />
          Terminador nulo
        </label>
        <label>
          <input
            type="checkbox"
            checked={bom}
            onChange={(event) => setBom(event.target.checked)}
          />
          Incluir BOM
        </label>
      </div>
      {error ? (
        <p className="error-text">{error}</p>
      ) : (
        <>
          <div className="encoding-measures">
            <span>
              <strong>{Array.from(text).length}</strong> code points
            </span>
            <span>
              <strong>{bytes.length}</strong> bytes
            </span>
            <span className="tag">{encoding.toUpperCase()}</span>
          </div>
          <p className="encoding-chars-hint">
            Cada caractere vira um ou mais bytes. Selecione um para encontrá-lo
            no dump.
          </p>
          <div
            className="encoding-chars"
            role="group"
            aria-label="Caracteres e seus bytes"
          >
            {pieces.map((piece, index) => (
              <button
                key={piece.key}
                type="button"
                className={`${piece.extra ? "encoding-extra" : ""} ${piece.failed ? "encoding-error" : ""}`}
                aria-pressed={selected === index}
                disabled={!piece.size}
                onClick={() => setSelected(selected === index ? null : index)}
                title={`${piece.detail} · ${piece.size} byte${piece.size === 1 ? "" : "s"}`}
              >
                <strong>{piece.label}</strong>
                <small>{piece.detail}</small>
                <code>{piece.size ? hexOf(piece) : "—"}</code>
              </button>
            ))}
          </div>
          <HexViewer
            bytes={bytes}
            highlight={
              active ? { offset: active.offset, size: active.size } : undefined
            }
          />
        </>
      )}
    </div>
  );
}
