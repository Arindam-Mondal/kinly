import { ArrowDownRight, ArrowUpRight, Droplet, LineChart, Repeat } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TrendChart } from "@/components/insights/TrendChart";
import { todayISO } from "@/components/calendar/calendarUtils";
import { getInsightsSummary } from "@/lib/domains/period/getInsightsSummary";
import { computePeriodInsights, computePeriodTrends } from "@/lib/domains/period/periodInsights";
import { createClient } from "@/lib/supabase/server";

// The Insights screen (build-sequence step 9). A read-only Server Component: it reads the
// user's logged periods (owner-scoped by RLS), runs the SAME pure engine as the dashboard,
// and renders trend charts + stat cards + a plain-language irregularity summary. All copy is
// domain-descriptive and sex-neutral — there is no getDashboardCopy-style sex branch here.
export default async function InsightsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("log_entries")
    .select("start_date, end_date")
    .eq("domain", "period")
    .order("start_date", { ascending: true });

  const periods = (data ?? []).map((row) => ({ startDate: row.start_date, endDate: row.end_date }));
  const trends = computePeriodTrends(periods);
  const prediction = computePeriodInsights(periods, todayISO());

  if (trends.totalCycles === 0) return <InsightsEmptyState />;

  return (
    <div className="space-y-6 pt-2">
      <header className="px-1">
        <h1 className="font-display text-3xl font-semibold leading-tight text-ink">Insights</h1>
        <p className="mt-1 text-sm text-ink/70">
          Based on {trends.totalCycles} logged {trends.totalCycles === 1 ? "period" : "periods"}.
        </p>
      </header>

      {/* Plain-language summary, generated from the same status flag as the dashboard. */}
      <section className="rounded-3xl bg-surface p-5 shadow-soft">
        <h2 className="text-sm font-medium text-ink/70">Your pattern</h2>
        <p className="mt-2 text-base leading-relaxed text-ink">{getInsightsSummary(prediction)}</p>
      </section>

      <StatGrid
        stats={[
          { Icon: Repeat, label: "Avg cycle", value: numberOrDash(trends.avgCycleLength), unit: "days" },
          { Icon: Droplet, label: "Avg period", value: numberOrDash(trends.avgPeriodDuration), unit: "days" },
          { Icon: ArrowDownRight, label: "Shortest cycle", value: numberOrDash(trends.shortestCycle), unit: "days" },
          { Icon: ArrowUpRight, label: "Longest cycle", value: numberOrDash(trends.longestCycle), unit: "days" },
        ]}
      />

      <ChartCard
        title="Cycle length"
        caption={trends.avgCycleLength != null ? `Average ${trends.avgCycleLength} days` : "Log one more period to chart cycles"}
      >
        <TrendChart title="Cycle length" data={trends.cycles} average={trends.avgCycleLength} unit="days" type="line" />
      </ChartCard>

      <ChartCard
        title="Period duration"
        caption={trends.avgPeriodDuration != null ? `Average ${trends.avgPeriodDuration} days` : ""}
      >
        <TrendChart title="Period duration" data={trends.durations} average={trends.avgPeriodDuration} unit="days" type="bar" />
      </ChartCard>
    </div>
  );
}

function numberOrDash(value: number | null): string {
  return value == null ? "—" : String(value);
}

type Stat = { Icon: typeof Repeat; label: string; value: string; unit: string };

function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <section>
      <h2 className="px-1 pb-3 text-sm font-medium text-ink/70">Key stats</h2>
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ Icon, label, value, unit }) => (
          <div key={label} className="rounded-3xl bg-surface p-4 shadow-soft">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-accent/15 text-ink">
              <Icon size={18} />
            </span>
            <p className="mt-3 text-2xl font-semibold text-ink">
              {value}
              {unit && <span className="ml-1 text-sm font-normal text-ink/70">{unit}</span>}
            </p>
            <p className="text-sm text-ink/70">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ChartCard({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-surface p-5 shadow-soft">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-medium text-ink">{title}</h2>
        {caption && <span className="text-xs text-ink/60">{caption}</span>}
      </div>
      <div className="mt-4 text-ink">{children}</div>
    </section>
  );
}

// First-run: no periods logged yet — never a blank screen (ui.md empty-state rule).
function InsightsEmptyState() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-surface text-ink shadow-soft">
        <LineChart size={28} />
      </span>
      <h1 className="mt-5 font-display text-2xl font-semibold text-ink">Insights</h1>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink/70">
        Log your first period and your cycle-length and period-duration trends will appear here.
      </p>
      <Link
        href="/calendar"
        className="mt-5 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-ink shadow-soft transition-all duration-200 active:scale-95"
      >
        Log a period
      </Link>
    </div>
  );
}
