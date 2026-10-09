"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { ScanLine } from "lucide-react";
const Inspector = dynamic(
  () =>
    import("@/modules/labs/BinaryInspector").then(
      (module) => module.BinaryInspector,
    ),
  {
    ssr: false,
    loading: () => (
      <p className="empty-state">Abrindo as estruturas do executável…</p>
    ),
  },
);
export function BinaryStory() {
  const [open, setOpen] = useState(false);
  return (
    <div className={`binary-story ${open ? "inspecting" : ""}`}>
      {open ? (
        <Inspector />
      ) : (
        <>
          <div className="binary-story-header">
            <span className="mono">BANCADA.EXE</span>
            <span className="tag">PE32+ · AMD64</span>
          </div>
          <div className="binary-map">
            <div className="binary-map-header">
              <code>MZ</code>
              <span>Cabeçalhos DOS + PE</span>
              <small>Formato e arquitetura</small>
            </div>
            <div className="binary-map-section text-section">
              <code>.text</code>
              <span>Instruções do programa</span>
              <small>READ / EXECUTE</small>
            </div>
            <div className="binary-map-section data-section">
              <code>.data</code>
              <span>Dados inicializados</span>
              <small>READ / WRITE</small>
            </div>
            <div className="binary-map-section import-section">
              <code>.idata</code>
              <span>Importações</span>
              <small>MessageBoxW · ExitProcess</small>
            </div>
          </div>
          <button
            className="button button-secondary"
            onClick={() => setOpen(true)}
          >
            <ScanLine size={17} />
            Inspecionar estes bytes
          </button>
          <p>O arquivo é aberto aqui mesmo, sem upload.</p>
        </>
      )}
    </div>
  );
}
