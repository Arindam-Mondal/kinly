"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Calendar } from "@/components/calendar/Calendar";
import { type Selection, formatHuman } from "@/components/calendar/calendarUtils";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { periodCalendarConfig } from "@/lib/domains/period/periodConfig";
import type { CalendarEntry } from "@/lib/types/calendar";
import { createPeriodEntry } from "./actions";

type DraftRange = { start: string; end: string };

export function CalendarView({ entries }: { entries: CalendarEntry[] }) {
  const router = useRouter();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [draft, setDraft] = useState<DraftRange | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleRangeComplete(start: string, end: string) {
    setDraft({ start, end });
    setNotes("");
    setError("");
  }

  function closeSheet() {
    setDraft(null);
    setSelection(null);
    setError("");
  }

  function save() {
    if (!draft) return;
    startTransition(async () => {
      const result = await createPeriodEntry({ startDate: draft.start, endDate: draft.end, notes });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      closeSheet();
      router.refresh();
    });
  }

  return (
    <div className="space-y-5 pt-2">
      <h1 className="px-1 font-display text-3xl font-semibold text-ink">Calendar</h1>

      <div className="rounded-3xl bg-surface p-4 shadow-soft">
        <Calendar
          entries={entries}
          config={periodCalendarConfig}
          selection={selection}
          onSelectionChange={setSelection}
          onRangeComplete={handleRangeComplete}
        />
      </div>

      <div className="flex flex-wrap gap-4 px-1 text-xs text-ink/60">
        <LegendDot className="bg-accent" label="Logged period" />
        <LegendDot className="bg-accent/30 ring-1 ring-accent" label="Selecting" />
        <LegendDot className="ring-1 ring-ink/40" label="Today" />
      </div>

      <p className="px-1 text-sm text-ink/50">Tap a start date, then an end date, to log a period.</p>

      <BottomSheet open={draft != null} onClose={closeSheet} title="Log period">
        {draft && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <label className="flex-1 text-sm font-medium text-ink/80">
                Start
                <input
                  type="date"
                  value={draft.start}
                  max={draft.end}
                  onChange={(e) => setDraft({ ...draft, start: e.target.value })}
                  className="mt-1 w-full rounded-2xl border border-ink/10 bg-canvas px-3 py-2.5 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
                />
              </label>
              <label className="flex-1 text-sm font-medium text-ink/80">
                End
                <input
                  type="date"
                  value={draft.end}
                  min={draft.start}
                  onChange={(e) => setDraft({ ...draft, end: e.target.value })}
                  className="mt-1 w-full rounded-2xl border border-ink/10 bg-canvas px-3 py-2.5 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
                />
              </label>
            </div>

            <p className="text-sm text-ink/60">
              {formatHuman(draft.start)} – {formatHuman(draft.end)}
            </p>

            <label className="block text-sm font-medium text-ink/80">
              Notes (optional)
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Anything you want to remember about this period."
                className="mt-1 w-full resize-none rounded-2xl border border-ink/10 bg-canvas px-3 py-2.5 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
              />
            </label>

            {error && <p className="rounded-2xl bg-[#a8412a]/10 p-3 text-sm text-[#a8412a]">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeSheet}
                className="flex-1 rounded-2xl border border-ink/10 bg-canvas px-4 py-3 font-medium text-ink transition-all duration-200 active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={pending}
                className="flex-1 rounded-2xl bg-accent px-4 py-3 font-semibold text-ink transition-all duration-200 hover:bg-accent-strong active:scale-95 disabled:opacity-60"
              >
                {pending ? "Saving…" : "Save period"}
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3.5 w-3.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}
