import { ImageResponse } from "next/og";
import { IconArt } from "@/lib/brand/icon";

// Android maskable icon (purpose "maskable"): full-bleed field, glyph kept in
// the central safe zone so adaptive masks can't crop it. From app/manifest.ts.
export function GET() {
  return new ImageResponse(<IconArt rounded={false} safeZone />, {
    width: 512,
    height: 512,
  });
}
