import { Skeleton } from "@/components/ui/Skeleton";

// Shown instantly while the Home dashboard's server component fetches the profile and
// logged periods. Mirrors the real layout (greeting card, metric grid, CTA) so the swap
// to live content lands without a jump.
export default function HomeLoading() {
  return (
    <div className="space-y-6 pt-2" role="status" aria-live="polite">
      <span className="sr-only">Loading your dashboard…</span>

      <section className="rounded-3xl bg-surface p-6 shadow-soft">
        <Skeleton className="h-4 w-24 rounded-lg" />
        <Skeleton className="mt-2 h-8 w-40 rounded-xl" />

        <div className="mt-5 flex items-center gap-5">
          <Skeleton className="h-28 w-28 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4 rounded-lg" />
            <Skeleton className="h-3 w-full rounded-lg" />
            <Skeleton className="h-3 w-5/6 rounded-lg" />
          </div>
        </div>
      </section>

      <section>
        <Skeleton className="mb-3 ml-1 h-4 w-28 rounded-lg" />
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

      <Skeleton className="h-[88px] w-full rounded-3xl" />
    </div>
  );
}
