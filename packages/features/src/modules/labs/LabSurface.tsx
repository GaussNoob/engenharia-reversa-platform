"use client";
import dynamic from "@nucleo/platform/lazy";
import type { Lab } from "@nucleo/core";
import { BitBench } from "./BitBench";
import { EncodingBench } from "./EncodingBench";
import { HexBench } from "./HexBench";
import { MemoryBench } from "./MemoryBench";
import { WindowsApiBench } from "./WindowsApiBench";
import { LoaderBench } from "./LoaderBench";
const CodeWorkbench = dynamic(
  () => import("./CodeWorkbench").then((module) => module.CodeWorkbench),
  { ssr: false },
);
const BinaryInspector = dynamic(
  () => import("./BinaryInspector").then((module) => module.BinaryInspector),
  { ssr: false },
);
export function LabSurface({
  lab,
  lessonId,
  panel,
  onTab,
}: {
  lab: Lab;
  lessonId?: string;
  panel?: string;
  onTab?: (tab: string) => void;
}) {
  if (lab.engine === "number-bench" || lab.engine === "bit-bench")
    return <BitBench initial={lab.id === "signed-byte" ? "0xF6" : undefined} />;
  if (lab.engine === "encoding") return <EncodingBench />;
  if (lab.engine === "hex") return <HexBench key={lab.id} labId={lab.id} />;
  if (lab.engine === "patch")
    return <HexBench key={lab.id} patch labId={lab.id} />;
  if (lab.engine === "pe") return <BinaryInspector />;
  if (lab.engine === "memory") return <MemoryBench />;
  if (lab.engine === "windows-api-model")
    return <WindowsApiBench registry={lab.id === "registry"} />;
  if (lab.engine === "process-model" || lab.engine === "loader-model")
    return <LoaderBench processes={lab.engine === "process-model"} />;
  const language =
    lab.engine === "python"
      ? "python"
      : lab.engine === "c-portable"
        ? "c"
        : lab.engine === "assembler"
          ? "fasm"
          : "assembly";
  return (
    <CodeWorkbench
      key={lab.id}
      initialLanguage={language}
      labId={lab.id}
      lessonId={lessonId}
      panel={panel}
      onTab={onTab}
    />
  );
}
