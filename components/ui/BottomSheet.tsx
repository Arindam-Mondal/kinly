"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

// Accessible slide-up sheet used for confirmations and detail panels. Closes on
// backdrop click or Escape; constrained to the mobile column width.
export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/30 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-t-3xl bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-lift">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-ink/15" />
        {title && <h2 className="mb-4 font-display text-xl font-semibold text-ink">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
