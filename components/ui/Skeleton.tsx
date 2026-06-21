import type { CSSProperties } from "react";

// A single shimmer block. Decorative only (aria-hidden) — loading screens carry their
// own role="status" announcement. Shape it with utility classes (height, width, radius);
// the shimmer + reduced-motion fallback live in globals.css (.kinly-skeleton).
export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return <span aria-hidden className={`kinly-skeleton block rounded-2xl ${className}`} style={style} />;
}
