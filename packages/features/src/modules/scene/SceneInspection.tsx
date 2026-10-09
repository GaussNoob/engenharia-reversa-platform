"use client";
import { Focus, Undo2 } from "lucide-react";
import {
  layerComponents,
  memoryBase,
  memorySample,
  type LayerIndex,
} from "./scene-data";

export function SceneInspection({
  layer,
  component,
  focused,
  onSelect,
  onFocus,
}: {
  layer: LayerIndex;
  component: number;
  focused: boolean;
  onSelect: (part: number) => void;
  onFocus: () => void;
}) {
  const components = layerComponents[layer]!;
  const current = components[component]!;
  return (
    <div className="scene-inspection">
      <div className="scene-parts-heading">
        <span>
          {layer === 1 ? "ENDEREÇOS E BYTES" : "INSPECIONAR COMPONENTE"}
        </span>
        <small>
          {layer === 1 ? "Base 0x00402000" : "Selecione abaixo ou no modelo"}
        </small>
      </div>
      <div
        className={layer === 1 ? "scene-memory-grid" : "scene-part-list"}
        role="group"
        aria-label={`Componentes de ${["CPU", "memória", "executável"][layer]}`}
      >
        {components.map((part, index) => (
          <button
            key={part.label}
            aria-label={
              layer === 1
                ? `Byte no endereço 0x${(memoryBase + index).toString(16).padStart(8, "0")}`
                : `Inspecionar ${part.label}`
            }
            aria-pressed={index === component}
            onClick={() => onSelect(index)}
          >
            {layer === 1 ? (
              <>
                <small>{part.label}</small>
                <code>
                  {memorySample[index]!.toString(16)
                    .padStart(2, "0")
                    .toUpperCase()}
                </code>
              </>
            ) : (
              part.label
            )}
          </button>
        ))}
      </div>
      <div className="scene-part-detail" aria-live="polite">
        <div>
          <span>{layer === 1 ? `Byte ${current.label}` : current.label}</span>
          <strong>{current.value}</strong>
          <p>{current.detail}</p>
        </div>
        <button onClick={onFocus} className="scene-isolate-part">
          {focused ? <Undo2 size={15} /> : <Focus size={15} />}
          {focused ? "Voltar à camada" : "Isolar componente"}
        </button>
      </div>
    </div>
  );
}
