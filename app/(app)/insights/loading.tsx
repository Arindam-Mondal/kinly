import { Skeleton } from "@/components/ui/Skeleton";

// Shown instantly while the Insights server component fetches logged periods. Mirrors the
// real layout (header, summary card, stat grid, two chart cards) so the swap to live
// content lands without a jump.
export default function InsightsLoading() {
  return (
    <div className="space-y-6 pt-2" role="status" aria-live="polite">
      <span className="sr-only">Loading your insights…</span>

      <div className="px-1">
        <Skeleton className="h-8 w-32 rounded-xl" />
        <Skeleton className="mt-2 h-4 w-44 rounded-lg" />
      </div>

      <section className="rounded-3xl bg-surface p-5 shadow-soft">
        <Skeleton className="h-4 w-24 rounded-lg" />
        <Skeleton className="mt-3 h-4 w-full rounded-lg" />
        <Skeleton className="mt-2 h-4 w-4/5 rounded-lg" />
      </section>

      <section>
        <Skeleton className="mb-3 ml-1 h-4 w-20 rounded-lg" />
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-3xl bg-surface p-4 shadow-soft">
              <Skeleton className="h-9 w-9 rounded-2xl" />
              <Skeleton className="mt-3 h-7 w-16 rounded-lg" />
              <Skeleton className="mt-2 h-3 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </section>

      {[0, 1].map((i) => (
        <section key={i} className="rounded-3xl bg-surface p-5 shadow-soft">
          <Skeleton className="h-5 w-28 rounded-lg" />
          <Skeleton className="mt-4 h-[132px] w-full rounded-2xl" />
        </section>
      ))}
    </div>
  );
}
