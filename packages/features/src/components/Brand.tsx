"use client";
import { Link, usePlatform } from "@nucleo/platform";
export function Brand() {
  const { home } = usePlatform();
  return (
    <Link className="brand" href={home} aria-label="Núcleo, início">
      <svg viewBox="0 0 28 28" aria-hidden="true">
        <path
          d="M3 4h6v14H3zM10 4h6l9 20h-6zM19 4h6v14h-6z"
          fill="currentColor"
        />
      </svg>
      <span>
        núcleo<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
