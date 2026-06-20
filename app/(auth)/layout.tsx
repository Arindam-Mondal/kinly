import type { ReactNode } from "react";

// Centered, mobile-first card shell shared by all auth screens.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-rose-50 p-4 dark:bg-neutral-950">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-sm dark:bg-neutral-900">
        {children}
      </div>
    </main>
  );
}
