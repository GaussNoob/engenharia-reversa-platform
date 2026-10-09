"use client";
import { lazy, Suspense, useEffect, useState, type ComponentType } from "react";
/** React lazy shared by SSR web and local native shells. */
export default function lazyView<P extends object>(
  load: () => Promise<ComponentType<P> | { default: ComponentType<P> }>,
  options: { ssr?: boolean } = {},
) {
  const Component = lazy(async () => {
    const module = await load();
    return typeof module === "function"
      ? { default: module }
      : (module as { default: ComponentType<P> });
  });
  return function LazyView(props: P) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (options.ssr === false && !mounted)
      return <div role="status">Preparando bancada…</div>;
    return (
      <Suspense fallback={<div role="status">Preparando bancada…</div>}>
        <Component {...props} />
      </Suspense>
    );
  };
}
