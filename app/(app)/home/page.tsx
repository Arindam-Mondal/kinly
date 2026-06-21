import { CalendarCheck, Droplet, Repeat, Sparkles } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { todayISO } from "@/components/calendar/calendarUtils";
import { type Sex, getDashboardCopy } from "@/components/dashboard/getDashboardCopy";
import { type PredictionResult, computePeriodInsights } from "@/lib/domains/period/periodInsights";
import { createClient } from "@/lib/supabase/server";

// The Home dashboard (build-sequence step 7). Reads the user's logged periods, runs the
// pure prediction engine, and renders real cycle metrics. Sex affects exactly one thing
// here — the header copy, isolated in getDashboardCopy — and nothing else in the app.
export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // These two reads don't depend on each other — run them concurrently so the
  // dashboard waits on one round-trip, not two stacked back-to-back.
  const [{ data: profile }, { data }] = await Promise.all([
    supabase.from("profiles").select("name, sex").single(),
    supabase
      .from("log_entries")
      .select("start_date, end_date")
      .eq("domain", "period")
      .order("start_date", { ascending: true }),
  ]);

  const firstName = profile?.name?.split(" ")[0] ?? "there";
  const sex = (profile?.sex ?? "prefer_not_to_say") as Sex;

  const insights = computePeriodInsights(
    (data ?? []).map((row) => ({ startDate: row.start_date, endDate: row.end_date })),
    todayISO(),
  );

  const hour = new Date().getHours();
  const partOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

  return (
    <div className="space-y-6 pt-2">
      {insights.periodsLogged === 0 ? (
        <FirstTimeDashboard greeting={partOfDay} firstName={firstName} />
      ) : (
        <TrackingDashboard
          greeting={partOfDay}
          firstName={firstName}
          sex={sex}
          insights={insights}
        />
      )}
    </div>
  );
}

// ---- First-time state: no periods logged yet ----
function FirstTimeDashboard({ greeting, firstName }: { greeting: string; firstName: string }) {
  return (
    <>
      <section className="rounded-3xl bg-surface p-6 shadow-soft">
        <p className="text-sm text-ink/70">Good {greeting},</p>
        <h1 className="font-display text-3xl font-semibold leading-tight text-ink">{firstName}</h1>

        <div className="mt-5 flex items-center gap-5">
          <CycleRing day={null} progress={0.06} />
          <div className="flex-1">
            <p className="text-base font-medium text-ink">Let&apos;s start tracking</p>
            <p className="mt-1 text-sm leading-relaxed text-ink/70">
              Log your first period and Kinly will begin learning your cycle.
            </p>
          </div>
        </div>
      </section>

      <MetricGrid
        metrics={[
          { Icon: Repeat, label: "Avg cycle", value: "—", unit: "days" },
          { Icon: Droplet, label: "Avg period", value: "—", unit: "days" },
          { Icon: CalendarCheck, label: "Cycles logged", value: "0", unit: "" },
          { Icon: Sparkles, label: "Status", value: "New", unit: "" },
        ]}
      />

      <PrimaryCta title="Log your first period" body="It only takes a few taps." />
    </>
  );
}

// ---- Tracking state: at least one period logged ----
function TrackingDashboard({
  greeting,
  firstName,
  sex,
  insights,
}: {
  greeting: string;
  firstName: string;
  sex: Sex;
  insights: PredictionResult;
}) {
  const copy = getDashboardCopy(sex, insights);
  const progress =
    insights.currentCycleDay && insights.avgCycleLength
      ? Math.min(insights.currentCycleDay / insights.avgCycleLength, 1)
      : 0.06;

  return (
    <>
      <section className="rounded-3xl bg-surface p-6 shadow-soft">
        <p className="text-sm text-ink/70">Good {greeting},</p>
        <h1 className="font-display text-3xl font-semibold leading-tight text-ink">{firstName}</h1>

        <div className="mt-5 flex items-center gap-5">
          <CycleRing day={insights.currentCycleDay} progress={progress} />
          <div className="flex-1">
            <p className="text-base font-medium text-ink">{copy.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink/70">{copy.body}</p>
          </div>
        </div>
      </section>

      <MetricGrid
        metrics={[
          { Icon: Repeat, label: "Avg cycle", value: numberOrDash(insights.avgCycleLength), unit: "days" },
          {
            Icon: Droplet,
            label: "Avg period",
            value: numberOrDash(insights.avgPeriodDuration),
            unit: "days",
          },
          {
            Icon: CalendarCheck,
            label: "Cycles logged",
            value: String(insights.periodsLogged),
            unit: "",
          },
          { Icon: Sparkles, label: "Status", value: copy.statusLabel, unit: "" },
        ]}
      />

      <PrimaryCta title="Log a period" body="Add or edit days on the calendar." />
    </>
  );
}

function numberOrDash(value: number | null): string {
  return value == null ? "—" : String(value);
}

// ---- Shared pieces ----
type Metric = { Icon: typeof Repeat; label: string; value: string; unit: string };

function MetricGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <section>
      <h2 className="px-1 pb-3 text-sm font-medium text-ink/70">Cycle overview</h2>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map(({ Icon, label, value, unit }) => (
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

function PrimaryCta({ title, body }: { title: string; body: string }) {
  return (
    <Link
      href="/calendar"
      className="flex items-center justify-between rounded-3xl bg-accent p-5 text-ink shadow-soft transition-all duration-200 active:scale-95"
    >
      <span>
        <span className="block font-display text-lg font-semibold">{title}</span>
        <span className="block text-sm text-ink/80">{body}</span>
      </span>
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-accent">
        <Droplet size={20} />
      </span>
    </Link>
  );
}

// Cycle ring: shows the current cycle day with a progress arc. `day` null renders a
// gentle placeholder arc for the first-time state.
function CycleRing({ day, progress }: { day: number | null; progress: number }) {
  const r = 42;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-ink/10" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          className="text-accent"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-ink/70">Cycle</span>
        <span className="font-display text-2xl font-semibold text-ink">{day == null ? "Day —" : `Day ${day}`}</span>
      </div>
    </div>
  );
}
