"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { CalendarConfig, CalendarEntry, ISODate } from "@/lib/types/calendar";
import {
  type RangePosition,
  type Selection,
  addMonths,
  buildMonthGrid,
  monthLabel,
  nextSelection,
  rangePosition,
  todayISO,
  weekdayLabels,
} from "./calendarUtils";

type CalendarProps = {
  entries: CalendarEntry[];
  config: CalendarConfig;
  selection: Selection | null;
  onSelectionChange: (selection: Selection | null) => void;
  onRangeComplete: (start: ISODate, end: ISODate) => void;
  weekStartsOn?: number;
  /** Inclusive latest selectable date. Later days are shown but not tappable. Defaults to `today`. */
  maxDate?: ISODate;
  /** Injectable "today" for deterministic rendering/tests. Defaults to the real date. */
  today?: ISODate;
};

// Positions the connecting fill so adjacent days form one continuous pill with rounded caps.
const capClass: Record<RangePosition, string> = {
  single: "inset-x-1 rounded-full",
  start: "left-1 right-0 rounded-l-full",
  middle: "inset-x-0",
  end: "left-0 right-1 rounded-r-full",
};

export function Calendar({
  entries,
  config,
  selection,
  onSelectionChange,
  onRangeComplete,
  weekStartsOn = 0,
  maxDate,
  today = todayISO(),
}: CalendarProps) {
  const max = maxDate ?? today;
  const [view, setView] = useState(() => {
    const [y, m] = today.split("-").map(Number);
    return { year: y, monthIndex: m - 1 };
  });

  const weeks = buildMonthGrid(view.year, view.monthIndex, weekStartsOn);
  const labels = weekdayLabels(weekStartsOn);

  function handleTap(iso: ISODate) {
    if (iso > max) return; // a period can't be logged in the future
    const { selection: next, completed } = nextSelection(selection, iso);
    onSelectionChange(next);
    if (completed) onRangeComplete(completed.start, completed.end);
  }

  return (
    <div>
      <div className="flex items-center justify-between px-1 pb-3">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setView(addMonths(view.year, view.monthIndex, -1))}
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink transition-all duration-200 active:scale-95"
        >
          <ChevronLeft size={20} />
        </button>
        <p className="font-display text-lg font-semibold text-ink">
          {monthLabel(view.year, view.monthIndex)}
        </p>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setView(addMonths(view.year, view.monthIndex, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink transition-all duration-200 active:scale-95"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 pb-1">
        {labels.map((label) => (
          <div key={label} className="text-center text-xs font-medium text-ink/40">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {weeks.flat().map((cell) => {
          const entry = entries
            .map((e) => ({ e, pos: rangePosition(cell.iso, e.startDate, e.endDate ?? e.startDate) }))
            .find((x) => x.pos);
          const selPos = selection ? rangePosition(cell.iso, selection.start, selection.end) : null;
          const isToday = cell.iso === today;
          const isFuture = cell.iso > max;
          const interactive = cell.inCurrentMonth && !isFuture;
          const fill = entry?.pos ? config.styles[entry.e.styleKey] : null;

          return (
            <button
              key={cell.iso}
              type="button"
              aria-label={cell.iso}
              aria-pressed={selPos != null}
              disabled={!interactive}
              onClick={() => handleTap(cell.iso)}
              className="relative flex h-11 items-center justify-center disabled:cursor-default"
            >
              {entry?.pos && (
                <span className={`absolute inset-y-1.5 ${capClass[entry.pos]} ${fill?.fillClass ?? ""}`} aria-hidden />
              )}
              {selPos && (
                <span
                  className={`absolute inset-y-1.5 ${capClass[selPos]} bg-accent/30 ring-1 ring-accent`}
                  aria-hidden
                />
              )}
              <span
                className={`relative z-10 flex h-9 w-9 items-center justify-center text-sm ${
                  !cell.inCurrentMonth
                    ? "text-ink/25"
                    : isFuture
                      ? "text-ink/30"
                      : entry
                        ? "font-semibold text-ink"
                        : "text-ink"
                } ${isToday ? "rounded-full ring-1 ring-ink/40" : ""}`}
              >
                {cell.day}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
