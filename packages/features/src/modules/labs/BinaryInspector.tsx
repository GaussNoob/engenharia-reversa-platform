"use client";
import { useEffect, useState } from "react";
import { parsePe, type PeImage, type BinaryField } from "@nucleo/models";
import { HexViewer } from "./HexViewer";
import { Upload, FileCode2 } from "lucide-react";
import { BinaryStrings, BinaryAddresses } from "./BinaryDetails";
export function BinaryInspector() {
  const [image, setImage] = useState<PeImage | null>(null);
  const [name, setName] = useState("bancada.exe");
  const [tab, setTab] = useState("Cabeçalhos");
  const [selected, setSelected] = useState<BinaryField | null>(null);
  const [error, setError] = useState("");
  const load = (bytes: Uint8Array, label: string) => {
    try {
      const parsed = parsePe(bytes);
      setImage(parsed);
      setName(label);
      setSelected(parsed.fields[0] ?? null);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Arquivo inválido.");
    }
  };
  useEffect(() => {
    void fetch("/fixtures/bancada.exe")
      .then((response) => response.arrayBuffer())
      .then((buffer) => load(new Uint8Array(buffer), "bancada.exe"))
      .catch(() => setError("Não foi possível carregar o exemplo."));
  }, []);
  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 8388608) {
      setError("O limite de inspeção é 8 MiB.");
      return;
    }
    load(new Uint8Array(await file.arrayBuffer()), file.name);
  };
  return (
    <div className="binary-inspector">
      <div className="binary-title">
        <div>
          <FileCode2 size={20} />
          <span>
            {name}
            <small>Inspeção estática · o arquivo não é executado</small>
          </span>
        </div>
        <label className="button button-secondary button-small">
          <Upload size={14} />
          Abrir arquivo
          <input
            className="sr-only"
            type="file"
            onChange={(event) => void upload(event.target.files?.[0])}
          />
        </label>
      </div>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      {image && (
        <>
          <div className="binary-facts">
            <span className="tag tag-accent">{image.architecture}</span>
            <span className="mono">{image.is64 ? "PE32+" : "PE32"}</span>
            <span>{image.sections.length} seções</span>
            <span>
              EP <code>{image.entrypointVa}</code>
            </span>
          </div>
          <div
            className="bench-tabs"
            role="tablist"
            aria-label="Estruturas do executável"
          >
            {[
              "Cabeçalhos",
              "Seções",
              "Imports",
              "Exports",
              "Strings",
              "Endereços",
            ].map((item) => (
              <button
                key={item}
                role="tab"
                aria-selected={tab === item}
                className={tab === item ? "active" : ""}
                onClick={() => setTab(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="binary-structure">
            {tab === "Strings" ? (
              <BinaryStrings image={image} onSelect={setSelected} />
            ) : tab === "Endereços" ? (
              <BinaryAddresses
                key={name}
                image={image}
                onSelect={setSelected}
              />
            ) : tab === "Cabeçalhos" ? (
              <div className="binary-fields">
                {image.fields.map((field) => (
                  <button
                    key={field.name}
                    className={selected?.name === field.name ? "selected" : ""}
                    onClick={() => setSelected(field)}
                  >
                    <span>{field.name}</span>
                    <code>{field.value}</code>
                    <small>
                      {field.offset.toString(16).toUpperCase().padStart(4, "0")}
                    </small>
                  </button>
                ))}
              </div>
            ) : tab === "Seções" ? (
              <div className="section-table">
                <div className="section-table-head">
                  <span>SEÇÃO</span>
                  <span>RVA</span>
                  <span>OFFSET</span>
                  <span>PERMISSÕES</span>
                </div>
                {image.sections.map((section) => (
                  <button
                    key={section.name}
                    onClick={() =>
                      setSelected({
                        name: section.name,
                        offset: section.offset,
                        size: Math.min(section.rawSize, 64),
                        value: `${section.rawSize} bytes`,
                        explanation: `${section.virtualSize} bytes virtuais; ${section.permissions} em memória.`,
                      })
                    }
                  >
                    <strong>{section.name}</strong>
                    <code>0x{section.rva.toString(16).toUpperCase()}</code>
                    <code>0x{section.offset.toString(16).toUpperCase()}</code>
                    <span className="tag">{section.permissions}</span>
                  </button>
                ))}
              </div>
            ) : tab === "Imports" ? (
              <div className="import-list">
                {image.imports.length ? (
                  image.imports.map((item) => (
                    <section key={item.dll}>
                      <strong>{item.dll}</strong>
                      {item.functions.map((fn) => (
                        <span key={fn.name}>
                          <code>{fn.name}</code>
                          <small>
                            {fn.ordinal === null ? "por nome" : "por ordinal"}
                          </small>
                        </span>
                      ))}
                    </section>
                  ))
                ) : (
                  <p className="empty-state">
                    Este arquivo não possui importações reconhecidas.
                  </p>
                )}
              </div>
            ) : (
              <div className="import-list">
                {image.exports.length ? (
                  image.exports.map((item) => (
                    <span key={item.name}>
                      <code>{item.name}</code>
                      <small>RVA 0x{item.rva.toString(16)}</small>
                    </span>
                  ))
                ) : (
                  <p className="empty-state">
                    Este executável não exporta funções.
                    <br />
                    Experimente inspecionar uma DLL.
                  </p>
                )}
              </div>
            )}
          </div>
          {selected && (
            <div className="field-explanation">
              <strong>{selected.name}</strong>
              <p>{selected.explanation}</p>
              <span className="mono">
                OFFSET 0x{selected.offset.toString(16).toUpperCase()} /{" "}
                {selected.size} BYTES
              </span>
            </div>
          )}
          <HexViewer
            bytes={image.bytes}
            highlight={
              selected
                ? { offset: selected.offset, size: selected.size }
                : undefined
            }
          />
        </>
      )}
    </div>
  );
}
