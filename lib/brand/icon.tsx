/**
 * The Kinly app mark: a Fraunces-flavoured "K" monogram — a thick stem and leg
 * with a thin upper arm (the high stroke-contrast that reads as an old-style
 * serif) in citron on a deep-forest field. This is the single source of truth
 * for every generated icon (favicon, apple-touch, and the PWA manifest sizes);
 * it renders as pure SVG shapes so `next/og` can rasterise it without any font.
 *
 * Two independent knobs cover every platform's needs:
 *  - `rounded` draws a rounded-square field (favicon / Android "any" icon).
 *    Off → full-bleed square: required for the iOS apple-touch icon (transparent
 *    corners render black there) and for the Android maskable background.
 *  - `safeZone` shrinks the glyph into the central ~64% so a circle/squircle
 *    mask can't crop it (Android maskable variant).
 */

const FOREST = "#1e3a1e"; // page ink / brand field
const CITRON = "#a3e635"; // accent — the mark itself

// K geometry on a 512×512 canvas. Round caps keep it warm/organic; the thin
// arm against the thick stem & leg gives the serif-like contrast.
const STEM = "M176 128 L176 384";
const ARM = "M176 256 L336 128";
const LEG = "M176 256 L348 384";
const THICK = 44;
const THIN = 22;

export function IconArt({
  rounded = true,
  safeZone = false,
}: {
  rounded?: boolean;
  safeZone?: boolean;
}) {
  // Centre the glyph (its bounding box sits a few px right/low of canvas centre)
  // and, in safe-zone mode, scale it about the canvas centre so a mask can't crop it.
  const center = "translate(-6 -6)";
  const transform = safeZone
    ? `translate(256 256) scale(0.66) translate(-256 -256) ${center}`
    : center;

  return (
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 512 512"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x={0}
          y={0}
          width={512}
          height={512}
          rx={rounded ? 96 : 0}
          fill={FOREST}
        />
        <g
          transform={transform}
          fill="none"
          stroke={CITRON}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={STEM} strokeWidth={THICK} />
          <path d={LEG} strokeWidth={THICK} />
          <path d={ARM} strokeWidth={THIN} />
        </g>
      </svg>
    </div>
  );
}
