import { loader } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";

let pending: Promise<void> | undefined;
/** Load only our local ESM build, including the patched HTML sanitizer. */
export function prepareMonaco(): Promise<void> {
  if (pending) return pending;
  pending = new Promise<void>((resolve, reject) => {
    const runtime = window as unknown as {
      NucleoMonaco?: typeof Monaco;
      MonacoEnvironment?: { getWorkerUrl: () => string };
    };
    runtime.MonacoEnvironment = {
      getWorkerUrl: () => "/vendor/runtime/editor.worker.js",
    };
    const configure = () => {
      if (!runtime.NucleoMonaco) {
        reject(new Error("Não foi possível preparar o editor."));
        return;
      }
      loader.config({ monaco: runtime.NucleoMonaco });
      resolve();
    };
    if (runtime.NucleoMonaco) {
      configure();
      return;
    }
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = "/vendor/runtime/editor.css";
    document.head.append(style);
    const script = document.createElement("script");
    script.src = "/vendor/runtime/editor.js";
    script.async = true;
    script.onload = configure;
    script.onerror = () => {
      pending = undefined;
      script.remove();
      reject(
        new Error(
          "O editor não carregou. Recarregue a página para tentar novamente.",
        ),
      );
    };
    document.head.append(script);
  });
  return pending;
}
