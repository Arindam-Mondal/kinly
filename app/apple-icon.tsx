import { ImageResponse } from "next/og";
import { IconArt } from "@/lib/brand/icon";

// iOS home-screen icon. Full-bleed square (iOS applies its own rounded mask;
// transparent corners would render black). Next wires up the apple-touch link.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<IconArt rounded={false} />, size);
}
