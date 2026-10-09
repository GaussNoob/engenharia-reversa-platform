"use client";

import { apiAssetUrl } from "@nucleo/api-client";
import { useId, useRef, useState } from "react";
import { Expand, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import type { Block } from "@nucleo/core";

export function SourceFigure({
  block,
}: {
  block: Extract<Block, { type: "image" }>;
}) {
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [failed, setFailed] = useState(false);
  const [revision, setRevision] = useState(0);
  const [zoom, setZoom] = useState(1);
  const src = apiAssetUrl(
    `/assets/${encodeURIComponent(block.asset)}${revision ? `?retry=${revision}` : ""}`,
  );

  return (
    <figure id={block.id} className="source-figure">
      {failed ? (
        <div className="source-image-error" role="status">
          <p>A imagem não carregou.</p>
          <button
            className="tool-button"
            onClick={() => {
              setFailed(false);
              setRevision((value) => value + 1);
            }}
          >
            <RotateCcw size={15} /> Tentar novamente
          </button>
        </div>
      ) : (
        <button
          className="source-image-open"
          aria-label={`Ampliar: ${block.alt}`}
          onClick={() => {
            setZoom(1);
            dialog.current?.showModal();
          }}
        >
          <img
            src={src}
            alt={block.alt}
            loading="lazy"
            onError={() => setFailed(true)}
          />
          <span>
            <Expand size={15} /> Ampliar imagem
          </span>
        </button>
      )}
      <figcaption>
        {block.alt}
        <span>Imagem do material original</span>
      </figcaption>
      <dialog
        ref={dialog}
        className="source-image-dialog"
        aria-labelledby={titleId}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <header>
          <h2 id={titleId}>{block.alt}</h2>
          <div>
            <button
              className="icon-button"
              aria-label="Reduzir imagem"
              disabled={zoom === 1}
              onClick={() => setZoom((value) => Math.max(1, value - 0.5))}
            >
              <ZoomOut size={18} />
            </button>
            <output>{zoom * 100}%</output>
            <button
              className="icon-button"
              aria-label="Aumentar imagem"
              disabled={zoom === 3}
              onClick={() => setZoom((value) => Math.min(3, value + 0.5))}
            >
              <ZoomIn size={18} />
            </button>
            <button
              autoFocus
              className="icon-button"
              aria-label="Fechar imagem"
              onClick={() => dialog.current?.close()}
            >
              <X size={20} />
            </button>
          </div>
        </header>
        <div
          className="source-image-canvas"
          tabIndex={0}
          aria-label="Imagem ampliada; use as setas para mover quando houver zoom"
        >
          <img
            src={src}
            alt={block.alt}
            style={{ width: `${zoom * 100}%`, maxWidth: "none" }}
          />
        </div>
      </dialog>
    </figure>
  );
}
