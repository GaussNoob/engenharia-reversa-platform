"use client";
import {
  createContext,
  useContext,
  type ReactNode,
  type ComponentType,
  type AnchorHTMLAttributes,
} from "react";
export type Target = "web" | "desktop" | "mobile";
export type LinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> & { href: string };
export type Platform = {
  target: Target;
  pathname: string;
  home: string;
  Link: ComponentType<LinkProps>;
  push: (href: string) => void;
  replace: (href: string) => void;
  refresh: () => void;
  download: (bytes: Uint8Array, name: string, mime?: string) => Promise<void>;
  openExternal: (url: string) => Promise<void>;
};
export async function browserDownload(
  bytes: Uint8Array,
  name: string,
  mime = "application/octet-stream",
) {
  const url = URL.createObjectURL(
    new Blob([new Uint8Array(bytes)], { type: mime }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const Context = createContext<Platform | null>(null);
export function PlatformProvider({
  value,
  children,
}: {
  value: Platform;
  children: ReactNode;
}) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function usePlatform() {
  const platform = useContext(Context);
  if (!platform) throw new Error("PlatformProvider ausente.");
  return platform;
}
export function useRouter() {
  return usePlatform();
}
export function usePathname() {
  return usePlatform().pathname;
}
export function Link(props: LinkProps) {
  const Component = usePlatform().Link;
  return <Component {...props} />;
}
