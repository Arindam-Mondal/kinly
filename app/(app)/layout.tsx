import type { ReactNode } from "react";
import { AppHeader } from "@/components/app/AppHeader";
import { BottomNav } from "@/components/app/BottomNav";

// Shell for authenticated app screens: floating header, scrollable content, and the
// fixed bottom tab bar — a mobile-width column centered on larger viewports.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md bg-canvas">
      <AppHeader />
      <main className="px-5 pb-28 pt-1">{children}</main>
      <BottomNav />
    </div>
  );
}
