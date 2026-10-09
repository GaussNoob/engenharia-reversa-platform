"use client";
import { useState } from "react";
import dynamic from "@nucleo/platform/lazy";
import {
  SquareTerminal,
  Binary,
  FileCode2,
  Layers,
  Type,
  Route,
  Box,
  Hash,
} from "lucide-react";
const CodeWorkbench = dynamic(
  () => import("./CodeWorkbench").then((module) => module.CodeWorkbench),
  { ssr: false },
);
const HexBench = dynamic(() =>
  import("./HexBench").then((module) => module.HexBench),
);
const BinaryInspector = dynamic(() =>
  import("./BinaryInspector").then((module) => module.BinaryInspector),
);
const MemoryBench = dynamic(() =>
  import("./MemoryBench").then((module) => module.MemoryBench),
);
const EncodingBench = dynamic(() =>
  import("./EncodingBench").then((module) => module.EncodingBench),
);
const FloatBench = dynamic(() =>
  import("./FloatBench").then((module) => module.FloatBench),
);
const BranchBench = dynamic(() =>
  import("./BranchBench").then((module) => module.BranchBench),
);
const SoftwareScene = dynamic(
  () => import("../scene/SoftwareScene").then((module) => module.SoftwareScene),
  { ssr: false },
);
const environments = [
  {
    id: "assembly",
    label: "Assembly",
    description: "CPU, flags e pontos de parada.",
    icon: SquareTerminal,
  },
  {
    id: "c",
    label: "C / Python",
    description: "Editor e execução isolada.",
    icon: FileCode2,
  },
  {
    id: "hex",
    label: "Hex Viewer",
    description: "Offset, hexadecimal e ASCII.",
    icon: Binary,
  },
  {
    id: "pe",
    label: "Binary Inspector",
    description: "PE, strings e endereços.",
    icon: FileCode2,
  },
  {
    id: "memory",
    label: "Memória",
    description: "Variáveis, endereços e ponteiros.",
    icon: Layers,
  },
  {
    id: "encoding",
    label: "Strings",
    description: "Codificações vistas como bytes.",
    icon: Type,
  },
  {
    id: "float",
    label: "Ponto flutuante",
    description: "Os 32 bits de um número.",
    icon: Hash,
  },
  {
    id: "flow",
    label: "Fluxo de controle",
    description: "Compare as flags e siga o salto.",
    icon: Route,
  },
  {
    id: "anatomy",
    label: "Anatomia 3D",
    description: "Três perspectivas do software.",
    icon: Box,
  },
];
function Environment({ id }: { id: string }) {
  if (id === "assembly") return <CodeWorkbench />;
  if (id === "c") return <CodeWorkbench initialLanguage="c" />;
  if (id === "hex") return <HexBench />;
  if (id === "pe") return <BinaryInspector />;
  if (id === "memory") return <MemoryBench />;
  if (id === "float") return <FloatBench />;
  if (id === "flow") return <BranchBench />;
  if (id === "anatomy") return <SoftwareScene compact />;
  return <EncodingBench />;
}
export function Playground({ initial = "assembly" }: { initial?: string }) {
  const [selected, setSelected] = useState(initial);
  const [opened, setOpened] = useState([initial]);
  const choose = (id: string) => {
    setSelected(id);
    setOpened((items) => (items.includes(id) ? items : [...items, id]));
  };
  return (
    <>
      <div
        className="playground-environments"
        role="tablist"
        aria-label="Ambientes de experimentação"
      >
        {environments.map(({ id, label, description, icon: Icon }, index) => (
          <button
            key={id}
            className={selected === id ? "active" : ""}
            role="tab"
            id={`environment-${id}`}
            aria-controls={`panel-${id}`}
            aria-selected={selected === id}
            tabIndex={selected === id ? 0 : -1}
            onClick={() => choose(id)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                event.preventDefault();
                const next =
                  environments[
                    (index +
                      (event.key === "ArrowRight"
                        ? 1
                        : environments.length - 1)) %
                      environments.length
                  ]!;
                choose(next.id);
                document.getElementById(`environment-${next.id}`)?.focus();
              }
            }}
          >
            <Icon size={18} />
            <span>
              <strong>{label}</strong>
              <small>{description}</small>
            </span>
          </button>
        ))}
      </div>
      {opened.map((id) => (
        <div
          key={id}
          id={`panel-${id}`}
          className="playground-bench"
          role="tabpanel"
          aria-labelledby={`environment-${id}`}
          hidden={selected !== id}
        >
          <Environment id={id} />
        </div>
      ))}
    </>
  );
}
