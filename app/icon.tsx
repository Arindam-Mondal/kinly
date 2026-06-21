import { ImageResponse } from "next/og";
import { IconArt } from "@/lib/brand/icon";

// Browser-tab favicon. Next wires up <link rel="icon"> automatically.
export const size = { width: 96, height: 96 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<IconArt />, size);
}
