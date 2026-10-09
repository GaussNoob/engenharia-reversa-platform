import "@fontsource-variable/instrument-sans/wght.css";
import "@fontsource-variable/literata/wght.css";
import "@nucleo/design-tokens/tokens.css";
import "@nucleo/features/styles/global.css";
import "@nucleo/features/styles/installed.css";
import "@nucleo/features/modules/labs/labs.css";
import "@nucleo/features/modules/labs/float.css";
import "@nucleo/features/modules/labs/bits.css";
import "@nucleo/features/modules/learning/learning.css";
import "@nucleo/features/modules/exercises/exercises.css";
import "@nucleo/features/modules/scene/landing.css";
import "@nucleo/features/components/select.css";
import "@nucleo/features/components/code/syntax.css";
import { createRoot } from "react-dom/client";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { openUrl } from "@tauri-apps/plugin-opener";
import { browserDownload } from "@nucleo/platform";
import { configureApi } from "@nucleo/api-client";
import { bearerTransport } from "@nucleo/api-client/native";
import { InstalledApp } from "@nucleo/features/installed/InstalledApp";
declare const __NUCLEO_API_URL__: string;
configureApi({
  origin: __NUCLEO_API_URL__,
  transport: isTauri()
    ? bearerTransport(__NUCLEO_API_URL__, {
        get: () => invoke<string | null>("session_get"),
        set: (token) => invoke("session_set", { token }),
        clear: () => invoke("session_clear"),
      })
    : (path, init) =>
        fetch(__NUCLEO_API_URL__ + "/api" + path, {
          ...init,
          credentials: "include",
          cache: "no-store",
        }),
});
createRoot(document.getElementById("root")!).render(
  <InstalledApp
    platform={{
      target: "desktop",
      download: async (bytes, name) => {
        if (!isTauri()) return browserDownload(bytes, name);
        const location = await save({ defaultPath: name });
        if (location) await writeFile(location, bytes);
      },
      openExternal: async (url) => {
        const parsed = new URL(url);
        if (!["https:", "http:"].includes(parsed.protocol))
          throw new Error("URL externa inválida.");
        if (isTauri()) await openUrl(url);
        else window.open(url, "_blank", "noopener,noreferrer");
      },
    }}
  />,
);
