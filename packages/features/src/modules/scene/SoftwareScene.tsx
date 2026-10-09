"use client";
import { SyntaxCode } from "@nucleo/features/components/CodeSnippet";
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "@nucleo/platform";
import {
  ArrowUpRight,
  Layers3,
  RotateCcw,
  Focus,
  ArrowLeft,
} from "lucide-react";
import { softwareLayers, type LayerIndex } from "./scene-data";
import { SceneInspection } from "./SceneInspection";
import type { createSoftwareScene } from "./create-software-scene";

export function SoftwareScene({ compact = false }: { compact?: boolean }) {
  const id = useId();
  const [layer, setLayer] = useState<LayerIndex>(0);
  const [component, setComponent] = useState(0);
  const [isolated, setIsolated] = useState(compact);
  const [focused, setFocused] = useState(false);
  const [exploded, setExploded] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [available, setAvailable] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<ReturnType<typeof createSoftwareScene> | null>(null);
  const select = (nextLayer: LayerIndex, nextPart = 0) => {
    setLayer(nextLayer);
    setComponent(nextPart);
    setIsolated(true);
    setFocused(false);
  };
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    let alive = true;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        observer.disconnect();
        // The 3D labels are drawn on canvases, so the mono face must be ready.
        const font = document.fonts
          ?.load('600 64px "Commit Mono"')
          .catch(() => undefined);
        void Promise.all([import("./create-software-scene"), font])
          .then(([{ createSoftwareScene }]) => {
            if (!alive || !host.current) return;
            try {
              scene.current = createSoftwareScene(
                host.current,
                {
                  layer: 0,
                  component: 0,
                  isolated: compact,
                  focused: false,
                  exploded: true,
                  rotation: 0,
                  reduced: media.matches,
                },
                select,
                setRotation,
              );
              setAvailable(true);
            } catch {
              setAvailable(false);
            }
          })
          .catch(() => setAvailable(false));
      },
      { rootMargin: "120px" },
    );
    if (host.current) observer.observe(host.current);
    return () => {
      alive = false;
      observer.disconnect();
      media.removeEventListener("change", update);
      scene.current?.dispose();
      scene.current = null;
    };
  }, [compact]);
  useEffect(() => {
    scene.current?.update({
      layer,
      component,
      isolated,
      focused,
      exploded,
      rotation,
      reduced,
    });
  }, [
    layer,
    component,
    isolated,
    focused,
    exploded,
    rotation,
    reduced,
    available,
  ]);
  const current = softwareLayers[layer];
  return (
    <div
      className={`software-scene ${compact ? "scene-compact" : ""} ${isolated ? "scene-isolated" : ""}`}
    >
      <div className="scene-topline">
        <span className="mono">ANATOMIA DO SOFTWARE</span>
        <span className="scene-live">
          <i /> EXPLORAR EM 3D
        </span>
      </div>
      <div className="scene-viewport">
        <div className="scene-halo" />
        {!available && (
          <div
            className={`scene-fallback ${isolated ? "isolated" : exploded ? "exploded" : ""}`}
            aria-hidden="true"
          >
            {softwareLayers.map((item, index) => (
              <div
                key={item.id}
                hidden={isolated && index !== layer}
                className={layer === index ? "selected" : ""}
              >
                <span>{item.label}</span>
                <SyntaxCode source={item.code} language="assembly" />
              </div>
            ))}
          </div>
        )}
        <div
          ref={host}
          className="three-canvas"
          data-renderer={available ? "three" : "fallback"}
          data-view={focused ? "component" : isolated ? "isolated" : "overview"}
          data-layer={current.id}
          data-component={component}
        />
        <div className="scene-view-control">
          {isolated ? (
            <button
              onClick={() => {
                setIsolated(false);
                setFocused(false);
                setRotation(0);
              }}
            >
              <ArrowLeft size={14} />
              Visão geral
            </button>
          ) : (
            <button onClick={() => setIsolated(true)}>
              <Focus size={14} />
              Isolar {current.label}
            </button>
          )}
          <span>
            {focused
              ? "COMPONENTE ISOLADO"
              : isolated
                ? `${current.label.toUpperCase()} · CAMADA ISOLADA`
                : "TRÊS CAMADAS DO SOFTWARE"}
          </span>
        </div>
        <span className="scene-axis mono">
          {isolated ? "SELECIONE UM COMPONENTE" : "SELECIONE UMA CAMADA"}
          {available && " · ARRASTE PARA GIRAR"}
        </span>
        <span className="scene-address mono">{current.address}</span>
      </div>
      <div className="scene-controls">
        <div
          className="scene-layers"
          role="tablist"
          aria-label="Camadas do software"
        >
          {softwareLayers.map((item, index) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={layer === index}
              aria-controls={`${id}-description`}
              id={`${id}-tab-${index}`}
              tabIndex={layer === index ? 0 : -1}
              onClick={() => select(index as LayerIndex)}
              onKeyDown={(event) => {
                if (
                  !["ArrowRight", "ArrowLeft", "Home", "End"].includes(
                    event.key,
                  )
                )
                  return;
                event.preventDefault();
                const next = (
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? 2
                      : (index + (event.key === "ArrowRight" ? 1 : 2)) % 3
                ) as LayerIndex;
                select(next);
                document.getElementById(`${id}-tab-${next}`)?.focus();
              }}
            >
              <span>0{index + 1}</span>
              {item.label}
            </button>
          ))}
        </div>
        {!isolated && (
          <button
            className="scene-explode icon-button"
            aria-label={exploded ? "Agrupar camadas" : "Separar camadas"}
            aria-pressed={exploded}
            onClick={() => setExploded(!exploded)}
          >
            <Layers3 size={18} />
          </button>
        )}
      </div>
      <div
        id={`${id}-description`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${layer}`}
      >
        <div className="scene-description">
          <div className="scene-description-copy" key={layer}>
            <strong>{current.title}</strong>
            <p>{current.detail}</p>
          </div>
          <Link href={current.href} aria-label={current.action}>
            <ArrowUpRight size={20} />
          </Link>
        </div>
        {isolated && (
          <SceneInspection
            layer={layer}
            component={component}
            focused={focused}
            onSelect={setComponent}
            onFocus={() => setFocused((value) => !value)}
          />
        )}
      </div>
      {(compact || isolated) && (
        <label className="scene-rotation">
          <button
            className="icon-button"
            type="button"
            aria-label="Restaurar rotação"
            onClick={() => setRotation(0)}
          >
            <RotateCcw size={14} />
          </button>
          <span>Rotação</span>
          <input
            type="range"
            min="-90"
            max="90"
            value={rotation}
            onChange={(event) => setRotation(Number(event.target.value))}
            aria-label="Rotação do diagrama"
          />
          <output>{rotation}°</output>
        </label>
      )}
      <p className="scene-note">
        Modelo conceitual · componentes lógicos, sem escala física.
      </p>
    </div>
  );
}
