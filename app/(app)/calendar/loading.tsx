import { Skeleton } from "@/components/ui/Skeleton";

// Shown instantly while the Calendar's server component fetches logged periods and
// derives the prediction. The static chrome (title, legend, helper text) renders for
// real; only the data-driven month grid shimmers, matching the live card's geometry.
export default function CalendarLoading() {
  return (
    <div className="space-y-5 pt-2" role="status" aria-live="polite">
      <span className="sr-only">Loading your calendar…</span>

      <h1 className="px-1 font-display text-3xl font-semibold text-ink">Calendar</h1>

      <div className="rounded-3xl bg-surface p-4 shadow-soft">
        {/* Month navigation */}
        <div className="flex items-center justify-between px-1 pb-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-5 w-32 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>

        {/* Weekday labels */}
        <div className="grid grid-cols-7 pb-1">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="flex justify-center">
              <Skeleton className="h-3 w-4 rounded" />
            </div>
          ))}
        </div>

        {/* Day grid: 6 weeks × 7 days, matching the h-11 cells with centered h-9 marks */}
        <div className="grid grid-cols-7">
          {Array.from({ length: 42 }, (_, i) => (
            <div key={i} className="flex h-11 items-center justify-center">
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 px-1 text-xs text-ink/70">
        <Legend className="bg-accent" label="Logged period" />
        <Legend className="border-2 border-dashed border-accent" label="Predicted" />
        <Legend className="ring-1 ring-ink/40" label="Today" />
      </div>

      <p className="px-1 text-sm text-ink/70">
        Tap a start date, then an end date, to log a period. Tap a logged day to edit it.
      </p>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3.5 w-3.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}
