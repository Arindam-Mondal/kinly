import type { ReactNode } from "react";

// Shell for authenticated app screens. The bottom navigation (Home · Calendar ·
// Insights · Notes) and top bar arrive with those screens; for now it just centers
// content in a mobile-width column.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-md bg-rose-50 dark:bg-neutral-950">{children}</div>
  );
}
