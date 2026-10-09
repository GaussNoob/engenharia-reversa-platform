import type { CapacitorConfig } from "@capacitor/cli";
const config: CapacitorConfig = {
  appId: "com.nucleo.estudo",
  appName: "Núcleo",
  webDir: "dist",
  server: { hostname: "localhost", androidScheme: "https" },
  android: { allowMixedContent: false },
  plugins: {
    SystemBars: { insetsHandling: "css", style: "DARK" },
    Keyboard: { resizeOnFullScreen: true },
    CapacitorHttp: { enabled: false },
  },
};
export default config;
