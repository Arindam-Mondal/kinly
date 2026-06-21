"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

// Accessible slide-up sheet used for confirmations and detail panels. Closes on
// backdrop click or Escape; constrained to the mobile column width. While open it
// moves focus into the panel, traps Tab within it, and restores focus to the
// trigger on close — the contract an aria-modal dialog owes keyboard/SR users.
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
  const panelRef = useRef<HTMLDivElement>(null);
  // Hold the latest onClose without making it an effect dependency — otherwise the
  // focus effect re-runs on every parent render (e.g. each keystroke in a field)
  // and steals focus back into the panel. Sync in an effect (never during render) so
  // the keydown handler still reads the current onClose.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Move focus into the sheet on open, restore it to the trigger on close. Keyed on
  // `open` only, so it fires once per open — not on every re-render. Focus lands on
  // the panel itself rather than the first field, so no date segment gets auto-selected.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => previouslyFocused?.focus();
  }, [open]);

  // Escape to close, Tab to stay trapped within the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      // When focus is on the panel itself, Tab should enter the field list normally.
      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/30 backdrop-blur-sm" />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-full max-w-md rounded-t-3xl bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-lift outline-none"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-ink/15" />
        {title && <h2 className="mb-4 font-display text-xl font-semibold text-ink">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
