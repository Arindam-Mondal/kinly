import { Skeleton } from "@/components/ui/Skeleton";

// Shown instantly while the journal's server component fetches notes. The static chrome
// (title, Add button, helper text) renders for real; only the note cards shimmer.
export default function NotesLoading() {
  return (
    <div className="space-y-5 pt-2" role="status" aria-live="polite">
      <span className="sr-only">Loading your notes…</span>

      <div className="flex items-center justify-between px-1">
        <h1 className="font-display text-3xl font-semibold text-ink">Notes</h1>
        <Skeleton className="h-11 w-28 rounded-full" />
      </div>

      <p className="px-1 text-sm text-ink/70">
        Your journal across days and cycles, newest first. Tap a note to edit it.
      </p>

      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-3xl bg-surface p-4 shadow-soft">
            <Skeleton className="h-4 w-24 rounded-lg" />
            <Skeleton className="mt-2.5 h-3.5 w-full rounded" />
            <Skeleton className="mt-1.5 h-3.5 w-3/4 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
