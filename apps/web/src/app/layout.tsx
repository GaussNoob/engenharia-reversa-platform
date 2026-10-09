import { WebPlatform } from "@/components/WebPlatform";
import type { Metadata } from "next";
import "@fontsource-variable/instrument-sans/wght.css";
import "@fontsource-variable/literata/wght.css";
import "./globals.css";
import "@nucleo/features/modules/scene/landing.css";
import "@nucleo/features/modules/labs/labs.css";
import "@nucleo/features/modules/labs/float.css";
import "@nucleo/features/modules/labs/bits.css";
import "@nucleo/features/modules/learning/learning.css";
import "@nucleo/features/components/select.css";
import "@nucleo/features/components/code/syntax.css";
import "@nucleo/features/modules/exercises/exercises.css";
import { AccountProvider } from "@nucleo/features/components/AccountProvider";
import { CommandPalette } from "@nucleo/features/components/CommandPalette";
export const metadata: Metadata = {
  title: {
    default: "Núcleo — entenda o software por dentro",
    template: "%s · Núcleo",
  },
  description:
    "Curso prático de engenharia reversa em português: números, memória, executáveis PE e Assembly, com exercícios que rodam no navegador.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Núcleo — Engenharia Reversa",
    description:
      "Curso prático de engenharia reversa em português, com simuladores e exercícios no navegador.",
    locale: "pt_BR",
    type: "website",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body>
        <a href="#main" className="skip-link">
          Pular para o conteúdo
        </a>
        <WebPlatform>
          <AccountProvider>
            {children}
            <CommandPalette />
          </AccountProvider>
        </WebPlatform>
      </body>
    </html>
  );
}
