import { Browser } from "@capacitor/browser";
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
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import {
  SecureStorage,
  KeychainAccess,
} from "@aparajita/capacitor-secure-storage";
import { configureApi } from "@nucleo/api-client";
import { bearerTransport } from "@nucleo/api-client/native";
import { InstalledApp } from "@nucleo/features/installed/InstalledApp";
import { browserDownload } from "@nucleo/platform";
declare const __NUCLEO_API_URL__: string;
async function start() {
  if (Capacitor.isNativePlatform()) {
    await SecureStorage.setKeyPrefix("nucleo-session-");
    await SecureStorage.setSynchronize(false);
    await SecureStorage.setDefaultKeychainAccess(
      KeychainAccess.whenUnlockedThisDeviceOnly,
    );
    const key = "session:" + __NUCLEO_API_URL__;
    configureApi({
      origin: __NUCLEO_API_URL__,
      transport: bearerTransport(__NUCLEO_API_URL__, {
        get: async () => {
          const value = await SecureStorage.get(key, false, false);
          return typeof value === "string" ? value : null;
        },
        set: (token) => SecureStorage.set(key, token, false, false),
        clear: async () => {
          await SecureStorage.remove(key, false);
        },
      }),
    });
    await App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) window.dispatchEvent(new Event("nucleo:resume"));
    });
    await App.addListener("backButton", () => {
      const dialog = document.querySelector<HTMLDialogElement>("dialog[open]");
      if (dialog) {
        dialog.close();
        return;
      }
      if (location.hash && !["#/entrar", "#/dashboard"].includes(location.hash))
        history.back();
    });
  } else {
    // Development browser: same-origin cookies via the local proxy, never a localStorage fallback.
    configureApi({
      origin: __NUCLEO_API_URL__,
      transport: (path, init) =>
        fetch(__NUCLEO_API_URL__ + "/api" + path, {
          ...init,
          credentials: "include",
          cache: "no-store",
        }),
    });
  }
  createRoot(document.getElementById("root")!).render(
    <InstalledApp
      platform={{
        target: "mobile",
        download: async (bytes, name, mime) => {
          if (!Capacitor.isNativePlatform())
            return browserDownload(bytes, name, mime);
          let binary = "";
          for (const byte of bytes) binary += String.fromCharCode(byte);
          const path = "downloads/" + name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const file = await Filesystem.writeFile({
            path,
            directory: Directory.Cache,
            data: btoa(binary),
            recursive: true,
          });
          await Share.share({ title: name, url: file.uri });
        },
        openExternal: async (url) => {
          const parsed = new URL(url);
          if (!["https:", "http:"].includes(parsed.protocol))
            throw new Error("URL externa inválida.");
          if (Capacitor.isNativePlatform()) await Browser.open({ url });
          else window.open(url, "_blank", "noopener,noreferrer");
        },
      }}
    />,
  );
}
void start().catch(() => {
  document.getElementById("root")!.textContent =
    "Não foi possível acessar o armazenamento seguro. Reinicie o aplicativo.";
});
