"use client";
import { usePlatform } from "@nucleo/platform";
import dynamic from "@nucleo/platform/lazy";
import type { CompletionDialect } from "./completion-data";
import type { VirtualFile } from "@nucleo/core";
import { useEffect, useState } from "react";
const Monaco = dynamic(() => import("./MonacoCodeEditor"), { ssr: false });
const Touch = dynamic(() => import("./TouchCodeEditor"), { ssr: false });
export type EditorProps = {
  value: string;
  onChange: (value: string) => void;
  language: string;
  dialect?: CompletionDialect;
  files?: VirtualFile[];
  mode?: "x86-32" | "x86-64";
  path?: string;
  currentLine?: number;
  breakpoints?: number[];
  onBreakpoint?: (line: number) => void;
};
export function CodeEditor(props: EditorProps) {
  const { target } = usePlatform();
  const [touch, setTouch] = useState(target === "mobile");
  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px), (pointer: coarse)");
    const update = () => setTouch(target === "mobile" || media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [target]);
  return touch ? <Touch {...props} /> : <Monaco {...props} />;
}
