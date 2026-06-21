import type { Metadata, Viewport } from "next";
import { Fraunces, Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Characterful "old style" serif for the wordmark and headings — organic and warm,
// not a default UI sans. Used with restraint.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  title: "Kinly",
  description: "A calm, private health & cycle tracker.",
  // Lets iOS treat the app as standalone with our title when added to the Home Screen.
  appleWebApp: { capable: true, title: "Kinly", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#1e3a1e", // deep forest — matches the manifest theme_color
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-canvas text-ink">{children}</body>
    </html>
  );
}
