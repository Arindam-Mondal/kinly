"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Calendar } from "@/components/calendar/Calendar";
import { type Selection, formatHuman, todayISO } from "@/components/calendar/calendarUtils";
import { BottomSheet } from "@/components/ui/BottomSheet";
import {
  PERIOD_STYLE_LOGGED,
  PERIOD_STYLE_PREDICTED,
  periodCalendarConfig,
} from "@/lib/domains/period/periodConfig";
import type { CalendarEntry } from "@/lib/types/calendar";
import { createPeriodEntry, deletePeriodEntry, updatePeriodEntry } from "./actions";

export type LoggedPeriod = {
  id: string;
  startDate: string;
  endDate: string | null;
  notes: string | null;
};

// The sheet edits one entry. `id` null = creating a new period; set = editing an existing one.
type SheetState = { id: string | null; start: string; end: string; notes: string };

const PREDICTED_ID = "predicted-next";

export function CalendarView({
  periods,
  predicted,
  initialEditId = null,
}: {
  periods: LoggedPeriod[];
  predicted: { start: string; end: string } | null;
  initialEditId?: string | null;
}) {
  const router = useRouter();
  const [selection, setSelection] = useState<Selection | null>(null);
  // Open the editor straight away when arriving via ?edit=<id> (e.g. from the journal).
  // Lazy init runs once, so re-renders/refreshes won't reopen a sheet the user closed.
  const [sheet, setSheet] = useState<SheetState | null>(() => {
    const period = initialEditId ? periods.find((p) => p.id === initialEditId) : undefined;
    return period
      ? { id: period.id, start: period.startDate, end: period.endDate ?? period.startDate, notes: period.notes ?? "" }
      : null;
  });
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const entries: CalendarEntry[] = periods.map((p) => ({
    id: p.id,
    startDate: p.startDate,
    endDate: p.endDate,
    styleKey: PERIOD_STYLE_LOGGED,
  }));
  // The predicted range renders last so it never hides a real logged day.
  if (predicted) {
    entries.push({
      id: PREDICTED_ID,
      startDate: predicted.start,
      endDate: predicted.end,
      styleKey: PERIOD_STYLE_PREDICTED,
    });
  }

  const editing = sheet?.id != null;

  function handleRangeComplete(start: string, end: string) {
    setSheet({ id: null, start, end, notes: "" });
    setConfirmingDelete(false);
    setError("");
  }

  function handleEntryTap(entryId: string) {
    const period = periods.find((p) => p.id === entryId);
    if (!period) return; // predicted (or unknown) entries aren't editable
    setSelection(null);
    setSheet({
      id: period.id,
      start: period.startDate,
      end: period.endDate ?? period.startDate,
      notes: period.notes ?? "",
    });
    setConfirmingDelete(false);
    setError("");
  }

  function closeSheet() {
    setSheet(null);
    setSelection(null);
    setConfirmingDelete(false);
    setError("");
  }

  function save() {
    if (!sheet) return;
    startTransition(async () => {
      const payload = { startDate: sheet.start, endDate: sheet.end, notes: sheet.notes };
      const result =
        sheet.id == null
          ? await createPeriodEntry(payload)
          : await updatePeriodEntry({ id: sheet.id, ...payload });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      closeSheet();
      router.refresh();
    });
  }

  function remove() {
    if (!sheet?.id) return;
    startTransition(async () => {
      const result = await deletePeriodEntry({ id: sheet.id });
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
          onEntryTap={handleEntryTap}
        />
      </div>

      <div className="flex flex-wrap gap-4 px-1 text-xs text-ink/70">
        <LegendDot className="bg-accent" label="Logged period" />
        <LegendDot className="border-2 border-dashed border-accent" label="Predicted" />
        <LegendDot className="ring-1 ring-ink/40" label="Today" />
      </div>

      <p className="px-1 text-sm text-ink/70">
        Tap a start date, then an end date, to log a period. Tap a logged day to edit it.
      </p>

      <BottomSheet open={sheet != null} onClose={closeSheet} title={editing ? "Edit period" : "Log period"}>
        {sheet && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <label className="min-w-0 flex-1 text-sm font-medium text-ink/80">
                Start
                <input
                  type="date"
                  value={sheet.start}
                  max={sheet.end}
                  onChange={(e) => setSheet({ ...sheet, start: e.target.value })}
                  className="mt-1 w-full min-w-0 appearance-none rounded-2xl border border-ink/10 bg-canvas px-3 py-2.5 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
                />
              </label>
              <label className="min-w-0 flex-1 text-sm font-medium text-ink/80">
                End
                <input
                  type="date"
                  value={sheet.end}
                  min={sheet.start}
                  max={todayISO()}
                  onChange={(e) => setSheet({ ...sheet, end: e.target.value })}
                  className="mt-1 w-full min-w-0 appearance-none rounded-2xl border border-ink/10 bg-canvas px-3 py-2.5 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
                />
              </label>
            </div>

            <p className="text-sm text-ink/70">
              {formatHuman(sheet.start)} – {formatHuman(sheet.end)}
            </p>

            <label className="block text-sm font-medium text-ink/80">
              Notes (optional)
              <textarea
                value={sheet.notes}
                onChange={(e) => setSheet({ ...sheet, notes: e.target.value })}
                maxLength={1000}
                rows={3}
                placeholder="Anything you want to remember about this period."
                className="mt-1 w-full resize-none rounded-2xl border border-ink/10 bg-canvas px-3 py-2.5 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
              />
            </label>

            {error && <p className="rounded-2xl bg-danger/10 p-3 text-sm text-danger">{error}</p>}

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
                {pending ? "Saving…" : editing ? "Save changes" : "Save period"}
              </button>
            </div>

            {editing &&
              (confirmingDelete ? (
                <div className="rounded-2xl bg-danger/10 p-3">
                  <p className="text-sm text-ink/80">Delete this logged period? This can&apos;t be undone.</p>
                  <div className="mt-3 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      className="flex-1 rounded-2xl border border-ink/10 bg-canvas px-4 py-2.5 font-medium text-ink active:scale-95"
                    >
                      Keep it
                    </button>
                    <button
                      type="button"
                      onClick={remove}
                      disabled={pending}
                      className="flex-1 rounded-2xl bg-danger px-4 py-2.5 font-semibold text-canvas active:scale-95 disabled:opacity-60"
                    >
                      {pending ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="w-full rounded-2xl px-4 py-2.5 text-sm font-medium text-danger transition-all duration-200 active:scale-95"
                >
                  Delete period
                </button>
              ))}
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
