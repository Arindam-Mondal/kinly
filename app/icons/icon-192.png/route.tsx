import { ImageResponse } from "next/og";
import { IconArt } from "@/lib/brand/icon";

// Android / Chrome PWA icon (purpose "any"). Referenced from app/manifest.ts.
export function GET() {
  return new ImageResponse(<IconArt />, { width: 192, height: 192 });
}
