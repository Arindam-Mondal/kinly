import type { ReactNode } from "react";

// Centered, mobile-first shell shared by all auth screens, with the Kinly wordmark
// above a soft cream card on the alabaster canvas.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas p-5">
      <div className="w-full max-w-sm">
        <p className="mb-5 text-center font-display text-3xl font-semibold tracking-tight text-ink">
          Kinly
        </p>
        <div className="rounded-3xl bg-surface p-6 shadow-soft">{children}</div>
      </div>
    </main>
  );
}
