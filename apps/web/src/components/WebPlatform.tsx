"use client";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  PlatformProvider,
  browserDownload,
  type LinkProps,
} from "@nucleo/platform";
import type { ReactNode } from "react";
function WebLink(props: LinkProps) {
  return <NextLink {...props} />;
}
export function WebPlatform({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <PlatformProvider
      value={{
        target: "web",
        home: "/",
        pathname,
        Link: WebLink,
        ...router,
        download: browserDownload,
        openExternal: async (url) => {
          window.open(url, "_blank", "noopener,noreferrer");
        },
      }}
    >
      {children}
    </PlatformProvider>
  );
}
