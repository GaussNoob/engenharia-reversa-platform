"use client";
import dynamic from "@nucleo/platform/lazy";
import type { SupplementId } from "@nucleo/core";
import { BranchBench } from "@nucleo/features/modules/labs/BranchBench";
import { FloatBench } from "@nucleo/features/modules/labs/FloatBench";
import { ByteStory } from "./ByteStory";
const SoftwareScene = dynamic(
  () =>
    import("@nucleo/features/modules/scene/SoftwareScene").then(
      (module) => module.SoftwareScene,
    ),
  { ssr: false },
);
export function SupplementBench({ id }: { id: SupplementId }) {
  if (id === "camadas-do-software") return <SoftwareScene compact />;
  if (id === "fluxo-de-controle") return <BranchBench />;
  if (id === "ponto-flutuante") return <FloatBench />;
  return (
    <div className="concept-bench">
      <ByteStory />
    </div>
  );
}
