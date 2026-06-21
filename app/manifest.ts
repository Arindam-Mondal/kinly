import type { MetadataRoute } from "next";

// Web app manifest — Next serves this at /manifest.webmanifest and links it
// automatically. Drives the Android/Chrome "Add to Home Screen" install.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kinly",
    short_name: "Kinly",
    description: "A calm, private health & cycle tracker.",
    start_url: "/",
    display: "standalone",
    background_color: "#fdfbf7", // warm alabaster — splash/load background (app canvas)
    theme_color: "#1e3a1e", // deep forest — browser/status-bar chrome
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
